# Yandex Cloud VRK DB Control

`vrk-db` is intentionally on-demand. The public start function opens a 6-hour window, and the timer-driven autostop function closes the database after the `active_until` label expires.

This control path is cloud-only. There is no local repository script for starting or extending `vrk-db`.

## Resources

- Folder: `vrk` (`b1g5et00t4pvrfoetdtc`)
- PostgreSQL cluster: `vrk-db` (`c9qf8h0188hb4jolntie`)
- Runtime service account: `vrk-db-control-sa`
- Public start function: `vrk-db-start`
- Timer function: `vrk-db-autostop`
- Timer trigger: `vrk-db-autostop-15m`
- Source: `infra/yandex-cloud/vrk-db-control/index.py`

## Public Start URL

`GET https://functions.yandexcloud.net/d4ess1jd8mb1sqgk454l` starts or extends the DB session for 6 hours. The URL is intentionally public and unauthenticated, so anyone with the URL can trigger a DB start.

The start function uses the `start` handler. It opens or extends the runtime lease and returns a bounded JSON response instead of keeping the browser request open until the PostgreSQL cluster fully boots.

Response contract:

- `200` with `action=extend-requested`: the cluster is already `RUNNING`; the function requested a lease-label extension.
- `202` with `action=start-requested`: the cluster was `STOPPED`; the function wrote the lease label and requested a start operation. Backend readiness may still take a few minutes.
- `202` with `action=cluster-operation-in-progress`: Yandex Cloud already reports `STARTING` or `UPDATING`; poll backend `/readyz`.
- `409` with `action=unsupported-status`: the cluster is in a status that the public start URL should not mutate.

The lease labels are:

- `active_until`: Unix timestamp for the current session expiry.
- `managed_by`: `vrk-db-control`.

Calling the URL again extends `active_until` by another 6 hours from the call time.

After `action=start-requested`, check backend readiness with:

```bash
curl -i https://bbann5sjkg8iha0mmsl3.containers.yandexcloud.net/readyz
```

`/healthz` only proves the backend HTTP process is alive. `/readyz` is the source of truth for database availability.

## Autostop

The timer trigger invokes `vrk-db-autostop` every 15 minutes. If `vrk-db` is not stopped and `active_until` is missing or expired, the function sends a stop operation.

The autostop function uses the `autostop` handler. It does nothing while the cluster is stopped, in a transient status, or inside the active session window.

```mermaid
flowchart LR
    StartUrl["GET public start URL"] --> DbStatus{"vrk-db status"}
    DbStatus -->|STOPPED| Lease["Set active_until lease label"]
    Lease --> StartOp["Request DB start operation"]
    DbStatus -->|RUNNING| Extend["Request lease-label extension"]
    DbStatus -->|STARTING / UPDATING| InProgress["Return 202 operation in progress"]
    StartOp --> ReadyPoll["Poll backend /readyz"]
    Extend --> ReadyPoll
    InProgress --> ReadyPoll

    Timer["15m timer trigger"] --> ReadLabels["Read cluster labels"]
    ReadLabels --> LeaseValid{"active_until still valid?"}
    LeaseValid -->|yes| Noop["Noop"]
    LeaseValid -->|no or missing| StopDb["Stop vrk-db"]
```

## Runtime Configuration

Both functions read configuration from environment variables:

- `VRK_DB_CLUSTER_ID`: required Yandex Managed PostgreSQL cluster ID.
- `VRK_DB_SESSION_HOURS`: optional session length, defaults to `6`.
- `VRK_DB_OPERATION_WAIT_SECONDS`: optional operation wait timeout, defaults to `240`.
- `VRK_DB_LABEL_WAIT_SECONDS`: optional short wait for the lease-label operation before requesting cluster start, defaults to `45`.

The function runtime gets an IAM token from the Yandex Cloud metadata service through `vrk-db-control-sa`; no Lockbox payload or local `.env` file is required for the control path.
