import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone


API_BASE = "https://mdb.api.cloud.yandex.net/managed-postgresql/v1"
OPERATION_BASE = "https://operation.api.cloud.yandex.net/operations"
METADATA_TOKEN_URL = (
    "http://169.254.169.254/computeMetadata/v1/instance/"
    "service-accounts/default/token"
)

DEFAULT_SESSION_HOURS = 6
DEFAULT_OPERATION_WAIT_SECONDS = 240
DEFAULT_LABEL_WAIT_SECONDS = 45
DEFAULT_OPERATION_POLL_SECONDS = 5


class ApiError(Exception):
    def __init__(self, status: int, body: str):
        super().__init__(f"Yandex Cloud API error {status}: {body}")
        self.status = status
        self.body = body


def start(event, context):
    config = _load_config()
    cluster = _get_cluster(config)
    active_until = int(time.time()) + config["session_seconds"]
    status = cluster.get("status")

    labels = _merged_labels(cluster, active_until)
    base_body = {
        "ok": True,
        "cluster_id": config["cluster_id"],
        "cluster_name": cluster.get("name"),
        "status_before": status,
        "health": cluster.get("health"),
        "active_until": active_until,
        "active_until_iso": _format_epoch(active_until),
        "session_hours": config["session_seconds"] // 3600,
    }

    try:
        if status == "STOPPED":
            label_operation = _update_labels(config, labels)
            label_result = _wait_operation(
                config,
                label_operation["id"],
                timeout_seconds=config["label_wait_seconds"],
            )
            if not label_result.get("done"):
                return _response(
                    202,
                    {
                        **base_body,
                        "action": "lease-update-in-progress",
                        "label_operation_id": label_operation["id"],
                        "label_operation_done": False,
                        "start_operation_id": None,
                        "message": "Lease label update is still running; retry the start URL in a minute.",
                    },
                )

            start_operation = _post_cluster_action(config, "start")
            return _response(
                202,
                {
                    **base_body,
                    "action": "start-requested",
                    "status": "STARTING",
                    "label_operation_id": label_operation["id"],
                    "label_operation_done": True,
                    "start_operation_id": start_operation["id"],
                    "message": "Database start was requested. Backend readiness may take a few minutes.",
                },
            )

        if status == "RUNNING":
            label_operation = _update_labels(config, labels)
            return _response(
                200,
                {
                    **base_body,
                    "action": "extend-requested",
                    "status": status,
                    "label_operation_id": label_operation["id"],
                    "label_operation_done": False,
                    "start_operation_id": None,
                    "message": "Database is already running; session extension was requested.",
                },
            )

        if status in {"STARTING", "UPDATING"}:
            current_active_until = _parse_int((cluster.get("labels") or {}).get("active_until"))
            return _response(
                202,
                {
                    **base_body,
                    "action": "cluster-operation-in-progress",
                    "reason": "cluster-operation-in-progress",
                    "status": status,
                    "current_active_until": current_active_until,
                    "current_active_until_iso": _format_epoch(current_active_until)
                    if current_active_until
                    else None,
                    "label_operation_id": None,
                    "label_operation_done": False,
                    "start_operation_id": None,
                    "message": "Cluster operation is already in progress. Check backend /readyz in a few minutes.",
                },
            )

        return _response(
            409,
            {
                **base_body,
                "ok": False,
                "action": "unsupported-status",
                "status": status,
                "message": "Cluster is not in a startable status.",
            },
        )
    except ApiError as err:
        return _response(
            err.status if 400 <= err.status < 500 else 502,
            {
                **base_body,
                "ok": False,
                "action": "api-error",
                "status": status,
                "error": err.body,
            },
        )


def autostop(event, context):
    config = _load_config()
    cluster = _get_cluster(config)
    labels = cluster.get("labels") or {}
    active_until = _parse_int(labels.get("active_until"))
    now = int(time.time())

    if cluster.get("status") == "STOPPED":
        return _response(
            200,
            {
                "ok": True,
                "action": "noop",
                "reason": "already-stopped",
                "status": cluster.get("status"),
                "active_until": active_until,
            },
        )

    if cluster.get("status") != "RUNNING":
        return _response(
            200,
            {
                "ok": True,
                "action": "noop",
                "reason": "transient-status",
                "status": cluster.get("status"),
                "health": cluster.get("health"),
                "active_until": active_until,
            },
        )

    if active_until is not None and active_until > now:
        return _response(
            200,
            {
                "ok": True,
                "action": "noop",
                "reason": "session-active",
                "status": cluster.get("status"),
                "health": cluster.get("health"),
                "active_until": active_until,
                "active_until_iso": _format_epoch(active_until),
                "seconds_left": active_until - now,
            },
        )

    stop_operation = _post_cluster_action(config, "stop")
    return _response(
        200,
        {
            "ok": True,
            "action": "stop",
            "reason": "expired-or-missing-active-until",
            "status_before": cluster.get("status"),
            "active_until": active_until,
            "stop_operation_id": stop_operation["id"],
        },
    )


def _load_config():
    cluster_id = os.environ.get("VRK_DB_CLUSTER_ID")
    if not cluster_id:
        raise RuntimeError("VRK_DB_CLUSTER_ID is required")

    session_hours = _parse_int(os.environ.get("VRK_DB_SESSION_HOURS"))
    if session_hours is None:
        session_hours = DEFAULT_SESSION_HOURS

    wait_seconds = _parse_int(os.environ.get("VRK_DB_OPERATION_WAIT_SECONDS"))
    if wait_seconds is None:
        wait_seconds = DEFAULT_OPERATION_WAIT_SECONDS

    label_wait_seconds = _parse_int(os.environ.get("VRK_DB_LABEL_WAIT_SECONDS"))
    if label_wait_seconds is None:
        label_wait_seconds = DEFAULT_LABEL_WAIT_SECONDS

    return {
        "cluster_id": cluster_id,
        "session_seconds": session_hours * 3600,
        "wait_seconds": wait_seconds,
        "label_wait_seconds": label_wait_seconds,
        "token": _get_iam_token(),
    }


def _get_iam_token():
    req = urllib.request.Request(
        METADATA_TOKEN_URL,
        headers={"Metadata-Flavor": "Google"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    token = payload.get("access_token")
    if not token:
        raise RuntimeError("Metadata service did not return access_token")
    return token


def _get_cluster(config):
    return _request_json(
        config,
        "GET",
        f"{API_BASE}/clusters/{config['cluster_id']}",
    )


def _update_labels(config, labels):
    return _request_json(
        config,
        "PATCH",
        f"{API_BASE}/clusters/{config['cluster_id']}",
        {
            "updateMask": "labels",
            "labels": labels,
        },
    )


def _post_cluster_action(config, action):
    return _request_json(
        config,
        "POST",
        f"{API_BASE}/clusters/{config['cluster_id']}:{action}",
        {},
    )


def _wait_operation(config, operation_id, timeout_seconds=None):
    wait_seconds = config["wait_seconds"] if timeout_seconds is None else timeout_seconds
    deadline = time.time() + wait_seconds
    last_payload = None

    while time.time() < deadline:
        last_payload = _request_json(
            config,
            "GET",
            f"{OPERATION_BASE}/{operation_id}",
        )
        if last_payload.get("done"):
            if "error" in last_payload:
                raise RuntimeError(json.dumps(last_payload["error"], ensure_ascii=False))
            return last_payload
        time.sleep(DEFAULT_OPERATION_POLL_SECONDS)

    return last_payload or {"done": False}


def _request_json(config, method, url, payload=None):
    data = None
    headers = {
        "Authorization": f"Bearer {config['token']}",
        "Content-Type": "application/json",
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        raise ApiError(exc.code, body) from exc

    if not raw:
        return {}
    return json.loads(raw)


def _merged_labels(cluster, active_until):
    labels = dict(cluster.get("labels") or {})
    labels["active_until"] = str(active_until)
    labels["managed_by"] = "vrk-db-control"
    return labels


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json; charset=utf-8"},
        "isBase64Encoded": False,
        "body": json.dumps(body, ensure_ascii=False),
    }


def _parse_int(value):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _format_epoch(value):
    return datetime.fromtimestamp(value, tz=timezone.utc).isoformat()
