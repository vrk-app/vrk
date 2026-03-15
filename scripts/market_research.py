from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import math
import os
import random
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


USER_AGENT = "Mozilla/5.0 (compatible; VRKMarketResearch/1.0; +https://www.nvrk.ru/)"
REQUEST_TIMEOUT = 30
REQUEST_RETRIES = 2
REQUEST_DELAY_RANGE = (1.0, 2.0)
TRACKED_YEARS = tuple(range(2010, 2027))
TRACKED_LAWS = ("44", "223", "94")
HARD_BLOCK_REASONS = {"http_429", "captcha", "rate_limited"}
CHECKO_API_BASE = "https://api.checko.ru/v2"
CHECKO_API_KEY_ENV = "CHECKO_API_KEY"
CHECKO_API_REQUEST_BUDGET_ENV = "CHECKO_API_REQUEST_BUDGET"
CHECKO_REVENUE_LINE_CODE = "2110"
API_HARD_BLOCK_REASONS = HARD_BLOCK_REASONS | {"api_auth_error", "api_balance_empty", "api_rate_limited", "api_budget_exhausted"}
HIDDEN_223_SUPPLIER_LABEL = "Не раскрыто в ЕИС"

MONTHS = {
    "января": "01",
    "февраля": "02",
    "марта": "03",
    "апреля": "04",
    "мая": "05",
    "июня": "06",
    "июля": "07",
    "августа": "08",
    "сентября": "09",
    "октября": "10",
    "ноября": "11",
    "декабря": "12",
}

TRANSLIT_MAP = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}

RELEVANT_KEYWORDS = (
    "вагон",
    "ремонт",
    "техническ",
    "обслуживан",
    "сервис",
    "поверк",
    "диагност",
    "калибров",
    "колесн",
    "тележк",
    "букс",
    "подвижн",
    "цистерн",
    "танк-контейнер",
)

SERVICE_KEYWORDS = (
    "ремонт",
    "техническ",
    "обслуживан",
    "сервис",
    "поверк",
    "диагност",
    "калибров",
    "испытан",
    "метролог",
    "стандартизац",
    "сертификац",
    "анализ",
    "исследован",
    "контрол",
    "очистк",
    "восстановлен",
    "переоборудован",
)

ROLLING_STOCK_KEYWORDS = (
    "вагон",
    "железнодорож",
    "подвижн",
    "локомотив",
    "тележк",
    "колесн",
    "букс",
    "междувагон",
    "пассажирск",
    "транспортн",
)

SUPPLY_KEYWORDS = (
    "комплектующ",
    "запасн",
    "част",
    "материал",
    "товар",
    "издели",
    "окно",
    "щетк",
    "диск",
    "мыло",
    "паста",
    "соль",
    "натрий",
    "калий",
    "рукав",
    "стекл",
    "поводок",
    "амортизатор",
    "кольцо",
    "пол туалета",
    "прокат",
    "труб",
    "кабел",
    "ламп",
    "мебел",
    "металл",
    "проволок",
    "суфле резинов",
)

NON_TARGET_SERVICE_KEYWORDS = (
    "компьют",
    "программн",
    "телеком",
    "связ",
    "клининг",
    "уборк",
    "охран",
    "интернет",
    "электроэнерг",
    "водоснаб",
    "водоотвед",
    "юридическ",
    "страхован",
    "реклам",
)

EXCLUDED_KEYWORDS = (
    "охрана",
    "охранн",
    "связ",
    "интернет",
    "канцеляр",
    "бумаг",
    "питани",
    "коммун",
    "водоснаб",
    "водоотвед",
    "электроэнерг",
    "клининг",
    "уборк",
    "бензин",
    "дизель",
    "топлив",
    "юридическ",
    "страхован",
    "реклама",
    "мебель",
    "оргтехник",
    "аренда",
    "строительств",
)

WORK_COUNT_PATTERNS = (
    re.compile(
        r"(?P<count>\d{1,6})\s*(?P<unit>шт(?:\.|ук)?|ед(?:\.|иниц)?|вагон(?:ов|а)?|"
        r"колесн\w*\s+пар(?:ы)?|комплект(?:ов|а)?|секц(?:ий|ии)|объект(?:ов|а)?)",
        re.I,
    ),
    re.compile(
        r"(ремонт|обслуживан|поверк|диагност\w*)[^0-9]{0,40}(?P<count>\d{1,6})",
        re.I,
    ),
)


@dataclass(frozen=True)
class CustomerSeed:
    name: str
    ogrn: str
    inn: str
    slug: str
    website: str | None = None
    wiki_prom_url: str | None = None
    checko_slug: str | None = None
    rusprofile_id: str | None = None

    @property
    def checko_company_url(self) -> str:
        return f"https://checko.ru/company/{self.ogrn}"

    @property
    def contracts_summary_url(self) -> str:
        return f"https://checko.ru/company/{self.ogrn}/contracts"


PILOT_CUSTOMERS = {
    "1057600294322": CustomerSeed(
        name="Ярославский вагоноремонтный завод",
        ogrn="1057600294322",
        inn="7603030907",
        slug="yaroslavskiy_vrz",
        website=None,
        wiki_prom_url="https://www.wiki-prom.ru/1265zavod.html",
    ),
    "1087746722293": CustomerSeed(
        name='ООО "Новая вагоноремонтная компания"',
        ogrn="1087746722293",
        inn="7705845722",
        slug="nvrk",
        website="https://www.nvrk.ru/",
        rusprofile_id="1000354",
    ),
    "1117746294104": CustomerSeed(
        name='АО "Вагонная ремонтная компания - 1"',
        ogrn="1117746294104",
        inn="7708737490",
        slug="vrk_1",
        website="https://1vrk.ru/",
        rusprofile_id="5519493",
    ),
    "1071516000841": CustomerSeed(
        name='АО "ВВРЗ ИМ. С.М. КИРОВА"',
        ogrn="1071516000841",
        inn="1516613186",
        slug="vvrz_kirova",
        wiki_prom_url="https://www.wiki-prom.ru/1209zavod.html",
    ),
}


@dataclass
class FetchResult:
    url: str
    final_url: str
    status_code: int
    text: str
    from_cache: bool
    blocked_reason: str | None = None
    error: str | None = None


@dataclass
class BlockedSource:
    customer_ogrn: str
    stage: str
    url: str
    reason: str
    status_code: int | None
    detected_at: str


@dataclass
class CompanyProfile:
    name: str | None = None
    inn: str | None = None
    ogrn: str | None = None
    org_type: str | None = None
    region: str | None = None
    city: str | None = None
    employee_count: int | None = None
    revenue_value: int | None = None
    revenue_year: int | None = None
    website: str | None = None
    source_card_url: str | None = None
    active_status: str | None = None
    activity_signals: list[str] = field(default_factory=list)


@dataclass
class ContractRecord:
    customer_ogrn: str
    customer_name: str
    contractor_name: str
    contractor_card_url: str | None
    contractor_inn: str | None
    contract_number: str
    contract_date: str | None
    law_type: str
    contract_subject: str
    contract_value: int | None
    contract_period_start: str | None
    contract_period_end: str | None
    extracted_work_count: int | None
    work_count_confidence: float | None
    relevance_confidence: float
    source_url: str | None
    source_platform: str


def contract_counterparty_key(contract: ContractRecord) -> str:
    if contract.contractor_inn:
        return contract.contractor_inn
    if contract.contractor_card_url and "checko.ru/company/" in contract.contractor_card_url:
        return contract.contractor_card_url
    if is_hidden_223_supplier(contract.contractor_name):
        return f"hidden_223:{contract.source_url or contract.contract_number or 'unknown'}"
    return normalize_company_name(contract.contractor_name)


@dataclass
class ApiFetchResult:
    url: str
    status_code: int
    payload: dict[str, Any] | list[Any] | None
    from_cache: bool
    blocked_reason: str | None = None
    error: str | None = None


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_whitespace(value: str | None) -> str | None:
    if value is None:
        return None
    return re.sub(r"\s+", " ", value.replace("\xa0", " ").replace("\u2009", " ")).strip()


def strip_tags(value: str | None) -> str | None:
    if value is None:
        return None
    without_scripts = re.sub(r"<script.*?>.*?</script>", " ", value, flags=re.S | re.I)
    without_styles = re.sub(r"<style.*?>.*?</style>", " ", without_scripts, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", without_styles)
    return normalize_whitespace(html.unescape(text))


def first_match(patterns: list[str], text: str, flags: int = re.S | re.I) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags)
        if match:
            return normalize_whitespace(html.unescape(match.group(1)))
    return None


def extract_first_href(fragment: str | None) -> str | None:
    if not fragment:
        return None
    match = re.search(r'href="([^"]+)"', fragment, re.I)
    return html.unescape(match.group(1)) if match else None


def absolutize_url(url: str | None, base: str) -> str | None:
    if not url:
        return None
    return urllib.parse.urljoin(base, url)


def parse_money_to_rubles(raw_value: str | None) -> int | None:
    if not raw_value:
        return None
    text = normalize_whitespace(raw_value.lower())
    if not text:
        return None
    match = re.search(r"([0-9][0-9\s.,]*)", text)
    if not match:
        return None
    number_text = match.group(1).replace(" ", "").replace(",", ".")
    try:
        number = float(number_text)
    except ValueError:
        return None
    multiplier = 1
    if "млрд" in text:
        multiplier = 1_000_000_000
    elif "млн" in text:
        multiplier = 1_000_000
    elif "тыс" in text:
        multiplier = 1_000
    return int(number * multiplier)


def parse_int(raw_value: str | None) -> int | None:
    if not raw_value:
        return None
    match = re.search(r"([0-9][0-9\s]{0,20}[0-9]|[0-9])", raw_value)
    if not match:
        return None
    return int(match.group(1).replace(" ", ""))


def parse_russian_date(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    text = normalize_whitespace(raw_value.lower())
    if not text:
        return None
    dotted = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", text)
    if dotted:
        day, month, year = dotted.groups()
        return f"{year}-{month}-{day}"
    worded = re.search(r"(\d{1,2})\s+([а-я]+)\s+(\d{4})", text)
    if worded:
        day, month_name, year = worded.groups()
        month = MONTHS.get(month_name)
        if month:
            return f"{year}-{month}-{int(day):02d}"
    return None


def normalize_date(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    text = normalize_whitespace(str(raw_value))
    if not text:
        return None
    iso = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
    if iso:
        return iso.group(0)
    return parse_russian_date(text)


def slugify(value: str) -> str:
    lowered = unicodedata.normalize("NFKD", value.lower())
    transliterated = []
    for char in lowered:
        if char in TRANSLIT_MAP:
            transliterated.append(TRANSLIT_MAP[char])
        elif char.isascii():
            transliterated.append(char)
    result = "".join(transliterated)
    result = re.sub(r"[^a-z0-9]+", "_", result)
    return result.strip("_") or "unknown"


def organization_type_from_name(name: str | None) -> str | None:
    if not name:
        return None
    match = re.match(r'^\s*(ООО|АО|ПАО|ОАО|ЗАО|ИП|НАО|ГУП|МУП|ФГУП)\b', name)
    return match.group(1) if match else None


def normalize_company_name(name: str | None) -> str:
    if not name:
        return ""
    normalized = normalize_whitespace(name.lower()) or ""
    normalized = re.sub(r'^(ооо|ао|пао|оао|зао|ип|нао)\s+', "", normalized)
    normalized = normalized.replace('"', "").replace("«", "").replace("»", "")
    return normalized.strip()


def is_hidden_223_supplier(name: str | None) -> bool:
    normalized = normalize_company_name(name)
    return normalized.startswith("не раскрыто в еис")


def evaluate_relevance(subject: str) -> float:
    text = normalize_company_name(subject)
    if not text:
        return 0.0
    relevant_hits = sum(1 for keyword in RELEVANT_KEYWORDS if keyword in text)
    service_hits = sum(1 for keyword in SERVICE_KEYWORDS if keyword in text)
    rolling_hits = sum(1 for keyword in ROLLING_STOCK_KEYWORDS if keyword in text)
    supply_hits = sum(1 for keyword in SUPPLY_KEYWORDS if keyword in text)
    excluded_hits = sum(1 for keyword in EXCLUDED_KEYWORDS if keyword in text)
    non_target_service_hits = sum(1 for keyword in NON_TARGET_SERVICE_KEYWORDS if keyword in text)
    if relevant_hits == 0 or service_hits == 0:
        return 0.0
    if non_target_service_hits:
        return 0.0
    if excluded_hits > 0 and rolling_hits == 0 and "метролог" not in text and "испытан" not in text:
        return 0.0
    if supply_hits > 0 and rolling_hits == 0 and "метролог" not in text and "испытан" not in text:
        return 0.0
    if "метролог" in text or "испытан" in text or "сертификац" in text or "стандартизац" in text:
        return 0.85
    if rolling_hits >= 2 and service_hits >= 1:
        return 0.95
    if rolling_hits >= 1:
        return 0.85
    if service_hits >= 2:
        return 0.7
    return 0.55


def extract_work_count(subject: str) -> tuple[int | None, float | None]:
    text = normalize_whitespace(subject) or ""
    for pattern in WORK_COUNT_PATTERNS:
        match = pattern.search(text)
        if match:
            try:
                return int(match.group("count")), 0.8
            except (KeyError, ValueError):
                continue
    return None, None


def detect_blocked_response(status_code: int, body: str) -> str | None:
    body_lower = body.lower()
    if status_code == 429:
        return "http_429"
    if "подтвердите, что вы человек" in body_lower or "smart-captcha" in body_lower:
        return "captcha"
    if "поступает большое количество запросов" in body_lower:
        return "rate_limited"
    if "регламентных работ" in body_lower and "еис" in body_lower:
        return "maintenance"
    if status_code >= 500:
        return f"http_{status_code}"
    return None


class HttpCache:
    def __init__(self, cache_dir: Path) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _path_prefix(self, url: str) -> Path:
        digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
        return self.cache_dir / digest

    def load(self, cache_key: str) -> FetchResult | None:
        prefix = self._path_prefix(cache_key)
        meta_path = prefix.with_suffix(".json")
        body_path = prefix.with_suffix(".html")
        if not meta_path.exists() or not body_path.exists():
            return None
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        body = body_path.read_text(encoding="utf-8")
        return FetchResult(
            url=meta.get("url", cache_key),
            final_url=meta["final_url"],
            status_code=int(meta["status_code"]),
            text=body,
            from_cache=True,
            blocked_reason=meta.get("blocked_reason"),
            error=meta.get("error"),
        )

    def save(self, cache_key: str, result: FetchResult) -> None:
        prefix = self._path_prefix(cache_key)
        meta_path = prefix.with_suffix(".json")
        body_path = prefix.with_suffix(".html")
        meta = {
            "url": result.url,
            "final_url": result.final_url,
            "status_code": result.status_code,
            "blocked_reason": result.blocked_reason,
            "error": result.error,
            "saved_at": utc_now_iso(),
        }
        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        body_path.write_text(result.text, encoding="utf-8")


class HttpFetcher:
    def __init__(self, cache_dir: Path) -> None:
        self.cache = HttpCache(cache_dir)
        self.blocked_sources: list[BlockedSource] = []

    def get(self, url: str, customer_ogrn: str, stage: str) -> FetchResult:
        cached = self.cache.load(url)
        if cached:
            return cached

        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        attempt = 0
        while attempt <= REQUEST_RETRIES:
            if attempt > 0:
                time.sleep(random.uniform(*REQUEST_DELAY_RANGE))
            attempt += 1
            try:
                with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                    body = response.read().decode("utf-8", "ignore")
                    result = FetchResult(
                        url=url,
                        final_url=response.geturl(),
                        status_code=getattr(response, "status", 200),
                        text=body,
                        from_cache=False,
                        blocked_reason=detect_blocked_response(getattr(response, "status", 200), body),
                    )
            except urllib.error.HTTPError as error:
                body = error.read().decode("utf-8", "ignore")
                result = FetchResult(
                    url=url,
                    final_url=error.geturl(),
                    status_code=error.code,
                    text=body,
                    from_cache=False,
                    blocked_reason=detect_blocked_response(error.code, body),
                    error=str(error),
                )
            except urllib.error.URLError as error:
                result = FetchResult(
                    url=url,
                    final_url=url,
                    status_code=0,
                    text="",
                    from_cache=False,
                    blocked_reason="network_error",
                    error=str(error),
                )

            should_retry = result.blocked_reason in HARD_BLOCK_REASONS | {"network_error"} and attempt <= REQUEST_RETRIES
            if should_retry:
                continue

            self.cache.save(url, result)
            if result.blocked_reason:
                self.blocked_sources.append(
                    BlockedSource(
                        customer_ogrn=customer_ogrn,
                        stage=stage,
                        url=url,
                        reason=result.blocked_reason,
                        status_code=result.status_code,
                        detected_at=utc_now_iso(),
                    )
                )
            return result

        unreachable = FetchResult(
            url=url,
            final_url=url,
            status_code=0,
            text="",
            from_cache=False,
            blocked_reason="unreachable",
            error="unreachable",
        )
        self.cache.save(url, unreachable)
        return unreachable


class FakeFetcher:
    def __init__(self, responses: dict[str, str]) -> None:
        self.responses = responses
        self.blocked_sources: list[BlockedSource] = []

    def get(self, url: str, customer_ogrn: str, stage: str) -> FetchResult:
        body = self.responses.get(url, "")
        blocked_reason = detect_blocked_response(200, body)
        if blocked_reason:
            self.blocked_sources.append(
                BlockedSource(
                    customer_ogrn=customer_ogrn,
                    stage=stage,
                    url=url,
                    reason=blocked_reason,
                    status_code=200,
                    detected_at=utc_now_iso(),
                )
            )
        return FetchResult(
            url=url,
            final_url=url,
            status_code=200,
            text=body,
            from_cache=False,
            blocked_reason=blocked_reason,
        )


class JsonCache:
    def __init__(self, cache_dir: Path) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _path_prefix(self, cache_key: str) -> Path:
        digest = hashlib.sha256(cache_key.encode("utf-8")).hexdigest()
        return self.cache_dir / digest

    def load(self, cache_key: str) -> ApiFetchResult | None:
        prefix = self._path_prefix(cache_key)
        meta_path = prefix.with_suffix(".json")
        body_path = prefix.with_suffix(".payload.json")
        if not meta_path.exists() or not body_path.exists():
            return None
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        payload = json.loads(body_path.read_text(encoding="utf-8"))
        return ApiFetchResult(
            url=meta["url"],
            status_code=int(meta["status_code"]),
            payload=payload,
            from_cache=True,
            blocked_reason=meta.get("blocked_reason"),
            error=meta.get("error"),
        )

    def save(self, cache_key: str, result: ApiFetchResult) -> None:
        prefix = self._path_prefix(cache_key)
        meta_path = prefix.with_suffix(".json")
        body_path = prefix.with_suffix(".payload.json")
        meta_path.write_text(
            json.dumps(
                {
                    "url": result.url,
                    "status_code": result.status_code,
                    "blocked_reason": result.blocked_reason,
                    "error": result.error,
                    "saved_at": utc_now_iso(),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        body_path.write_text(json.dumps(result.payload, ensure_ascii=False, indent=2), encoding="utf-8")


def detect_api_blocked(payload: dict[str, Any] | list[Any] | None) -> str | None:
    if not isinstance(payload, dict):
        return None
    meta = payload.get("meta")
    if not isinstance(meta, dict):
        return None
    if meta.get("status") != "error":
        return None
    message = normalize_whitespace(str(meta.get("message", ""))).lower()
    if "недостаточ" in message and "баланс" in message:
        return "api_balance_empty"
    if "лимит" in message or "слишком много запрос" in message:
        return "api_rate_limited"
    if "api-ключ" in message or "api key" in message or "ключ" in message:
        return "api_auth_error"
    return "api_error"


class CheckoApiClient:
    def __init__(self, api_key: str, cache_dir: Path, request_budget: int | None = None) -> None:
        self.api_key = api_key
        self.cache = JsonCache(cache_dir / "checko_api")
        self.blocked_sources: list[BlockedSource] = []
        self.request_budget = request_budget
        self.requests_used = 0

    @classmethod
    def from_env(cls, cache_dir: Path) -> CheckoApiClient | None:
        api_key = os.getenv(CHECKO_API_KEY_ENV)
        if not api_key:
            return None
        raw_budget = os.getenv(CHECKO_API_REQUEST_BUDGET_ENV)
        request_budget = parse_int(raw_budget) if raw_budget else None
        return cls(api_key=api_key, cache_dir=cache_dir, request_budget=request_budget)

    def remaining_budget(self) -> int | None:
        if self.request_budget is None:
            return None
        return max(self.request_budget - self.requests_used, 0)

    def _register_block(self, customer_ogrn: str, stage: str, url: str, reason: str, status_code: int | None) -> None:
        self.blocked_sources.append(
            BlockedSource(
                customer_ogrn=customer_ogrn,
                stage=stage,
                url=url,
                reason=reason,
                status_code=status_code,
                detected_at=utc_now_iso(),
            )
        )

    def _request(self, endpoint: str, customer_ogrn: str, stage: str, params: dict[str, Any]) -> ApiFetchResult:
        sanitized_params = {key: value for key, value in params.items() if value is not None}
        query = urllib.parse.urlencode(sorted((key, str(value)) for key, value in sanitized_params.items()))
        display_url = f"{CHECKO_API_BASE}/{endpoint}?{query}"
        cache_key = f"checko_api:{endpoint}?{query}"
        cached = self.cache.load(cache_key)
        if cached:
            return cached

        if self.request_budget is not None and self.requests_used >= self.request_budget:
            self._register_block(customer_ogrn, stage, display_url, "api_budget_exhausted", 0)
            return ApiFetchResult(
                url=display_url,
                status_code=0,
                payload={"meta": {"status": "error", "message": "API request budget exhausted"}},
                from_cache=False,
                blocked_reason="api_budget_exhausted",
                error="api_budget_exhausted",
            )

        real_params = {"key": self.api_key, **sanitized_params}
        real_url = f"{CHECKO_API_BASE}/{endpoint}?{urllib.parse.urlencode(real_params)}"
        request = urllib.request.Request(real_url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                payload = json.loads(response.read().decode("utf-8", "ignore"))
                result = ApiFetchResult(
                    url=display_url,
                    status_code=getattr(response, "status", 200),
                    payload=payload,
                    from_cache=False,
                    blocked_reason=detect_api_blocked(payload),
                )
        except urllib.error.HTTPError as error:
            raw_body = error.read().decode("utf-8", "ignore")
            try:
                payload = json.loads(raw_body)
            except json.JSONDecodeError:
                payload = {"meta": {"status": "error", "message": raw_body}}
            result = ApiFetchResult(
                url=display_url,
                status_code=error.code,
                payload=payload,
                from_cache=False,
                blocked_reason=detect_blocked_response(error.code, raw_body) or detect_api_blocked(payload),
                error=str(error),
            )
        except urllib.error.URLError as error:
            result = ApiFetchResult(
                url=display_url,
                status_code=0,
                payload={"meta": {"status": "error", "message": str(error)}},
                from_cache=False,
                blocked_reason="network_error",
                error=str(error),
            )

        self.requests_used += 1
        self.cache.save(cache_key, result)
        if result.blocked_reason:
            self._register_block(customer_ogrn, stage, display_url, result.blocked_reason, result.status_code)
        return result

    def _load_company_profile(self, params: dict[str, Any], customer_ogrn: str, stage: str) -> CompanyProfile | None:
        company_result = self._request("company", customer_ogrn, stage, params)
        if company_result.blocked_reason or not company_result.payload:
            return None
        company_profile = parse_checko_api_company_payload(company_result.payload, company_result.url)
        finances_result = self._request("finances", customer_ogrn, f"{stage}_finances", params)
        if not finances_result.blocked_reason and finances_result.payload:
            company_profile = merge_profiles(company_profile, parse_checko_api_finances_payload(finances_result.payload, company_result.url))
        return company_profile

    def get_company_profile(self, customer_seed: CustomerSeed) -> CompanyProfile | None:
        return self._load_company_profile({"ogrn": customer_seed.ogrn}, customer_seed.ogrn, "customer_profile_api")

    def get_company_profile_by_inn(self, inn: str, customer_ogrn: str) -> CompanyProfile | None:
        return self._load_company_profile({"inn": inn}, customer_ogrn, "contractor_api")

    def get_customer_contracts(self, customer_seed: CustomerSeed, years: list[int]) -> tuple[list[ContractRecord], bool]:
        contracts: list[ContractRecord] = []
        seen_keys: set[tuple[str, str | None]] = set()
        api_responded = False
        hard_blocked = False
        tracked_laws = [law for law in TRACKED_LAWS if law != "94" or any(year <= 2013 for year in years)]
        target_years = {year for year in years}
        min_year = min(target_years) if target_years else None
        for law_type in tracked_laws:
            if hard_blocked:
                break
            page_number = 1
            while True:
                params = {
                    "ogrn": customer_seed.ogrn,
                    "law": law_type,
                    "role": "customer",
                    "sort": "-date",
                    "limit": 100,
                    "page": page_number,
                }
                result = self._request("contracts", customer_seed.ogrn, f"contracts_api_{law_type}_page_{page_number}", params)
                if result.blocked_reason in API_HARD_BLOCK_REASONS:
                    hard_blocked = True
                    break
                if result.blocked_reason or not result.payload:
                    break
                api_responded = True
                page_contracts, max_page = parse_checko_api_contracts_payload(result.payload, customer_seed, law_type)
                for contract in page_contracts:
                    contract_year = int(contract.contract_date[:4]) if contract.contract_date and re.match(r"^\d{4}-", contract.contract_date) else None
                    if contract_year is not None and contract_year not in target_years:
                        continue
                    key = (contract.contract_number, contract.source_url)
                    if key not in seen_keys:
                        seen_keys.add(key)
                        contracts.append(contract)
                oldest_year = extract_oldest_year_from_checko_api_payload(result.payload)
                if page_number >= max_page:
                    break
                if min_year is not None and oldest_year is not None and oldest_year < min_year:
                    break
                page_number += 1
        return sorted(contracts, key=lambda item: (item.contract_date or "", item.contract_number)), api_responded


def parse_wiki_prom_company_page(page_html: str, page_url: str) -> CompanyProfile:
    address = first_match(
        [
            r"Адрес производства</span></div>\s*<div class=\"cnt-box\"><span>(.*?)</span>",
        ],
        page_html,
    )
    region = None
    city = None
    if address:
        region_match = re.search(r"([А-ЯЁA-Z][^,]+область|[А-ЯЁA-Z][^,]+край|город Москва|Республика [^,]+)", address)
        city_match = re.search(r"(г\.\s*[^,]+)", address)
        region = normalize_whitespace(region_match.group(1)) if region_match else None
        city = normalize_whitespace(city_match.group(1)) if city_match else None
    name = first_match([r"<title>(.*?)</title>"], page_html)
    revenue = first_match([r"Выручка:</span>\s*([^<]+)"], page_html)
    return CompanyProfile(
        name=name.split("(")[0].strip() if name else None,
        inn=first_match([r"ИНН:</span>\s*([0-9]{10,12})"], page_html),
        ogrn=first_match([r"ОГРН:</span>\s*([0-9]{13})"], page_html),
        org_type=first_match([r"<div class=\"comp-ttl-info\">\s*<span>([^<]+)</span>"], page_html),
        region=region,
        city=city,
        revenue_value=parse_money_to_rubles(revenue),
        website=absolutize_url(
            extract_first_href(first_match([r"<div class=\"cnt-ttl\"><span>Сайт</span></div>\s*<div class=\"cnt-box\">(.*?)</div>"], page_html)),
            page_url,
        ),
        source_card_url=page_url,
        active_status="active",
        activity_signals=["profile_page", "website"] if "Сайт" in page_html else ["profile_page"],
    )


def parse_checko_company_page(page_html: str, page_url: str) -> CompanyProfile:
    canonical = first_match([r'<link rel="canonical" href="([^"]+)"'], page_html) or page_url
    name = first_match(
        [
            r'<meta property="og:title" content="([^"]+)"',
            r"<title>(.*?)</title>",
            r'legalName":"([^"]+)"',
        ],
        page_html,
    )
    inn = first_match(
        [
            r'ИНН <strong[^>]*>([0-9]{10,12})</strong>',
            r'ИНН\s*([0-9]{10,12})',
            r'"taxID":"([0-9]{10,12})"',
        ],
        page_html,
    )
    ogrn = first_match(
        [
            r'ОГРН <strong[^>]*>([0-9]{13})</strong>',
            r'ОГРН\s*([0-9]{13})',
            r'"name":"ОГРН","value":"([0-9]{13})"',
        ],
        page_html,
    )
    org_type = organization_type_from_name(name) or first_match(
        [
            r'Организационно-правовой формой является &quot;([^"]+)&quot;',
            r'<title>(ООО|АО|ПАО|ОАО|ЗАО|ИП)\b',
        ],
        page_html,
    )
    address = first_match(
        [
            r'"addressRegion":"([^"]+)".*?"addressLocality":"([^"]+)"',
            r'<span itemprop="addressRegion">([^<]+)</span>',
        ],
        page_html,
    )
    region = first_match(
        [
            r'"addressRegion":"([^"]+)"',
            r'<span itemprop="addressRegion">([^<]+)</span>',
        ],
        page_html,
    )
    city = first_match(
        [
            r'"addressLocality":"([^"]+)"',
            r'<span itemprop="addressLocality">([^<]+)</span>',
        ],
        page_html,
    )
    revenue_block = re.search(r"Финансовая отчетность за (\d{4}) год(.*?)(Среднесписочная численность работников|Реквизиты юридического лица|</section>)", page_html, re.S | re.I)
    revenue_value = None
    revenue_year = None
    if revenue_block:
        revenue_year = int(revenue_block.group(1))
        revenue_value = parse_money_to_rubles(first_match([r"Выручка.*?([0-9][0-9\s.,]*(?:млрд|млн)?\s*руб\.)"], revenue_block.group(2)))
    if revenue_value is None:
        fallback_revenue = first_match(
            [
                r'Выручка компании за (\d{4}) год составила <mark>([^<]+)</mark>',
                r'Выручка</em>.*?<a[^>]*>([^<]+)</a>',
            ],
            page_html,
        )
        if fallback_revenue and revenue_year is None:
            year_match = re.search(r"(\d{4})", fallback_revenue)
            revenue_year = int(year_match.group(1)) if year_match else None
        revenue_value = revenue_value or parse_money_to_rubles(fallback_revenue)
    employee_count = parse_int(
        first_match(
            [
                r"Среднесписочная численность работников</div>\s*<div>([^<]+)</div>",
                r"Среднесписочная численность работников.*?<div>([^<]+)</div>",
                r"численность персонала.*?до ([0-9\s]+) сотруд",
            ],
            page_html,
        )
    )
    website = absolutize_url(
        first_match(
            [
                r"Веб-сайт</strong>\s*<a[^>]+href=\"([^\"]+)\"",
                r'href=\"(https?://[^\"]+)\"[^>]*>милорем',
            ],
            page_html,
        ),
        canonical,
    )
    active_status = "active" if re.search(r"юридическое лицо является действующим|Действующая организация", page_html, re.I) else "inactive"
    signals: list[str] = []
    if revenue_value:
        signals.append("revenue")
    if employee_count:
        signals.append("employee_count")
    if website:
        signals.append("website")
    if re.search(r"Госзакупки <span class=\"count\">([1-9][0-9]*)</span>", page_html):
        signals.append("procurement")
    if re.search(r"Вакансии <span class=\"count\">([1-9][0-9]*)</span>", page_html):
        signals.append("vacancies")
    if re.search(r"Лицензии <span class=\"count\">([1-9][0-9]*)</span>", page_html):
        signals.append("licenses")
    return CompanyProfile(
        name=normalize_whitespace(name),
        inn=inn,
        ogrn=ogrn,
        org_type=normalize_whitespace(org_type),
        region=normalize_whitespace(region),
        city=normalize_whitespace(city),
        employee_count=employee_count,
        revenue_value=revenue_value,
        revenue_year=revenue_year,
        website=website,
        source_card_url=canonical,
        active_status=active_status,
        activity_signals=signals,
    )


def parse_rusprofile_company_page(page_html: str, page_url: str) -> CompanyProfile:
    canonical = first_match([r'<link rel="canonical" href="([^"]+)"'], page_html) or page_url
    title = first_match([r"<title>(.*?)</title>"], page_html)
    name = first_match(
        [
            r"<title>([^<(]+?)\s+[А-ЯЁA-Z][^<(]*\s+\(ИНН",
            r"<title>([^<]+?)\s+\(ИНН",
            r"<title>(.*?)</title>",
        ],
        page_html,
    )
    inn = first_match([r"ИНН ([0-9]{10,12})", r'taxID"> <span class="copy_target" id="clip_inn">([0-9]{10,12})'], page_html)
    ogrn = first_match([r"ОГРН ([0-9]{13})", r'id="clip_ogrn">([0-9]{13})'], page_html)
    region = first_match(
        [
            r'itemprop="addressRegion">([^<]+)</span>',
            r"зарегистрировано в ([А-ЯЁA-Z][^.,]+)",
        ],
        page_html,
    )
    city = first_match(
        [
            r'itemprop="addressLocality">([^<]+)</span>',
            r"<title>[^<]+ ([А-ЯЁA-Z][^<(]+?) \(",
            r"зарегистрировано в ([А-ЯЁA-Z][^.,]+)",
        ],
        page_html,
    )
    active_status = "active" if re.search(r"действующ", page_html, re.I) else "inactive"
    employee_count = parse_int(first_match([r"сократилась до ([0-9\s]+) сотруд", r"до ([0-9\s]+) сотруд"], page_html))
    revenue_value = parse_money_to_rubles(first_match([r"Выручка</div><div>([^<]+)</div>", r"Выручка.*?<span class=\"num\">([^<]+)</span>"], page_html))
    return CompanyProfile(
        name=name or title,
        inn=inn,
        ogrn=ogrn,
        org_type=organization_type_from_name(name or title),
        region=normalize_whitespace(region),
        city=normalize_whitespace(city),
        employee_count=employee_count,
        revenue_value=revenue_value,
        website=None,
        source_card_url=canonical,
        active_status=active_status,
        activity_signals=["fallback_profile"],
    )


def parse_checko_api_company_payload(payload: dict[str, Any], source_url: str) -> CompanyProfile:
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        return CompanyProfile(source_card_url=source_url)
    status = data.get("Статус")
    status_name = status.get("Наим") if isinstance(status, dict) else status
    active_status = None
    if isinstance(status_name, str):
        if "действ" in status_name.lower():
            active_status = "active"
        elif status_name:
            active_status = "inactive"
    contacts = data.get("Контакты") if isinstance(data.get("Контакты"), dict) else {}
    address = data.get("ЮрАдрес") if isinstance(data.get("ЮрАдрес"), dict) else {}
    website = contacts.get("ВебСайт")
    employee_count = data.get("СЧР")
    signals: list[str] = []
    if website:
        signals.append("website")
    if employee_count not in (None, ""):
        signals.append("employee_count")
    if active_status == "active":
        signals.append("profile_page")
    return CompanyProfile(
        name=normalize_whitespace(data.get("НаимПолн") or data.get("НаимСокр")),
        inn=normalize_whitespace(data.get("ИНН")),
        ogrn=normalize_whitespace(data.get("ОГРН")),
        org_type=organization_type_from_name(data.get("НаимПолн") or data.get("НаимСокр")),
        region=normalize_whitespace((data.get("Регион") or {}).get("Наим") if isinstance(data.get("Регион"), dict) else None),
        city=normalize_whitespace(address.get("НасПункт")),
        employee_count=parse_int(str(employee_count)) if employee_count not in (None, "") else None,
        website=normalize_whitespace(website),
        source_card_url=f"https://checko.ru/company/{data.get('ОГРН')}" if data.get("ОГРН") else source_url,
        active_status=active_status,
        activity_signals=signals,
    )


def parse_checko_api_finances_payload(payload: dict[str, Any], source_url: str) -> CompanyProfile:
    company = payload.get("company") if isinstance(payload, dict) else {}
    data = payload.get("data") if isinstance(payload, dict) else {}
    revenue_value = None
    revenue_year = None
    if isinstance(data, dict):
        for year in (2025, 2024, 2023, 2022, 2021):
            year_key = str(year)
            year_data = data.get(year_key) or data.get(year)
            if not isinstance(year_data, dict):
                continue
            candidate = year_data.get(CHECKO_REVENUE_LINE_CODE) or year_data.get(int(CHECKO_REVENUE_LINE_CODE))
            if candidate is not None:
                revenue_value = parse_int(str(candidate))
                revenue_year = year
                break
    signals = ["revenue"] if revenue_value else []
    company_name = None
    company_ogrn = None
    if isinstance(company, dict):
        company_name = company.get("НаимПолн") or company.get("НаимСокр")
        company_ogrn = company.get("ОГРН")
    return CompanyProfile(
        name=normalize_whitespace(company_name),
        ogrn=normalize_whitespace(company_ogrn),
        revenue_value=revenue_value,
        revenue_year=revenue_year,
        source_card_url=f"https://checko.ru/company/{company_ogrn}" if company_ogrn else source_url,
        activity_signals=signals,
    )


def merge_profiles(*profiles: CompanyProfile) -> CompanyProfile:
    merged = CompanyProfile()
    signals: list[str] = []
    for profile in profiles:
        if not profile:
            continue
        for field_name in (
            "name",
            "inn",
            "ogrn",
            "org_type",
            "region",
            "city",
            "employee_count",
            "revenue_value",
            "revenue_year",
            "website",
            "source_card_url",
            "active_status",
        ):
            current_value = getattr(merged, field_name)
            next_value = getattr(profile, field_name)
            if current_value in (None, "", []) and next_value not in (None, "", []):
                setattr(merged, field_name, next_value)
        signals.extend(profile.activity_signals)
    merged.activity_signals = sorted(dict.fromkeys(signal for signal in signals if signal))
    if not merged.org_type:
        merged.org_type = organization_type_from_name(merged.name)
    return merged


@dataclass
class LabeledValue:
    text: str | None
    href: str | None


def parse_label_values(fragment: str, base_url: str) -> dict[str, LabeledValue]:
    values: dict[str, LabeledValue] = {}
    for label_html, value_html in re.findall(
        r'<div class="fw-700(?: mt-2)?">(.*?)</div>\s*<div(?: class="[^"]*")?>(.*?)</div>',
        fragment,
        re.S | re.I,
    ):
        label = strip_tags(label_html)
        values[label or ""] = LabeledValue(
            text=strip_tags(value_html),
            href=absolutize_url(extract_first_href(value_html), base_url),
        )
    return values


def parse_checko_contracts_page(page_html: str, customer_seed: CustomerSeed, law_type: str) -> tuple[list[ContractRecord], int]:
    rows = re.findall(r"<tr>(.*?)</tr>", page_html, re.S | re.I)
    contracts: list[ContractRecord] = []
    for row in rows:
        if "№" not in row and "&thinsp;" not in row:
            continue
        top_match = re.search(
            r'<div>\s*<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>\s*от\s*([^<]+)</div>',
            row,
            re.S | re.I,
        )
        if not top_match:
            continue
        source_url, raw_number, raw_date = top_match.groups()
        number = strip_tags(raw_number) or ""
        details = parse_label_values(row, "https://checko.ru")
        subject = (
            details.get("Предмет закупки по ОКПД-2")
            or details.get("Предмет закупки по ОКДП")
            or details.get("Объект закупки")
            or details.get("Предмет контракта")
        )
        contractor = (
            details.get("Поставщик")
            or details.get("Исполнитель")
            or details.get("Подрядчик")
            or details.get("Участник")
        )
        if not subject or not subject.text:
            continue
        contractor_name = contractor.text if contractor and contractor.text else None
        if not contractor_name and law_type == "223":
            contractor_name = HIDDEN_223_SUPPLIER_LABEL
        if not contractor_name:
            continue
        value = details.get("Стоимость контракта") or details.get("Цена") or details.get("Сумма контракта")
        relevance_confidence = evaluate_relevance(subject.text)
        if relevance_confidence == 0.0:
            continue
        work_count, work_confidence = extract_work_count(subject.text)
        contracts.append(
            ContractRecord(
                customer_ogrn=customer_seed.ogrn,
                customer_name=customer_seed.name,
                contractor_name=contractor_name,
                contractor_card_url=contractor.href if contractor and contractor.href and not is_hidden_223_supplier(contractor_name) else None,
                contractor_inn=None,
                contract_number=number.replace("№", "").strip(),
                contract_date=parse_russian_date(raw_date),
                law_type=law_type,
                contract_subject=subject.text,
                contract_value=parse_money_to_rubles(value.text if value else None),
                contract_period_start=None,
                contract_period_end=None,
                extracted_work_count=work_count,
                work_count_confidence=work_confidence,
                relevance_confidence=relevance_confidence,
                source_url=absolutize_url(source_url, "https://checko.ru"),
                source_platform="checko_contracts",
            )
        )
    pages = [int(found) for found in re.findall(r"[?&]page=(\d+)", html.unescape(page_html))]
    return contracts, max(pages, default=1)


def parse_checko_api_contracts_payload(
    payload: dict[str, Any],
    customer_seed: CustomerSeed,
    law_type: str,
    filter_year: int | None = None,
) -> tuple[list[ContractRecord], int]:
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        return [], 1
    records = data.get("Записи")
    if not isinstance(records, list):
        return [], 1
    contracts: list[ContractRecord] = []
    for row in records:
        if not isinstance(row, dict):
            continue
        contract_date = normalize_date(row.get("Дата"))
        if filter_year is not None and contract_date and not contract_date.startswith(str(filter_year)):
            continue
        objects = row.get("Объекты") if isinstance(row.get("Объекты"), list) else []
        subject_parts = [normalize_whitespace(item.get("Наим")) for item in objects if isinstance(item, dict) and item.get("Наим")]
        subject = "; ".join(part for part in subject_parts if part)
        if not subject:
            continue
        relevance_confidence = evaluate_relevance(subject)
        if relevance_confidence == 0.0:
            continue
        suppliers = row.get("Постав") if isinstance(row.get("Постав"), list) else []
        supplier = next((item for item in suppliers if isinstance(item, dict)), None)
        contractor_name = None
        contractor_inn = None
        if supplier:
            contractor_name = normalize_whitespace(supplier.get("НаимПолн") or supplier.get("НаимСокр") or supplier.get("ФИО"))
            contractor_inn = normalize_whitespace(supplier.get("ИНН"))
        if not contractor_name and law_type == "223":
            contractor_name = HIDDEN_223_SUPPLIER_LABEL
        if not contractor_name:
            continue
        work_count, work_confidence = extract_work_count(subject)
        contracts.append(
            ContractRecord(
                customer_ogrn=customer_seed.ogrn,
                customer_name=customer_seed.name,
                contractor_name=contractor_name,
                contractor_card_url=None,
                contractor_inn=contractor_inn,
                contract_number=normalize_whitespace(str(row.get("РегНомер", ""))) or "",
                contract_date=contract_date,
                law_type=law_type,
                contract_subject=subject,
                contract_value=parse_int(str(row.get("Цена"))) if row.get("Цена") is not None else None,
                contract_period_start=None,
                contract_period_end=normalize_date(row.get("ДатаИсп")),
                extracted_work_count=work_count,
                work_count_confidence=work_confidence,
                relevance_confidence=relevance_confidence,
                source_url=normalize_whitespace(row.get("СтрЕИС")),
                source_platform="checko_api_contracts",
            )
        )
    max_pages = parse_int(str(data.get("СтрВсего"))) or 1
    return contracts, max_pages


def extract_oldest_year_from_checko_api_payload(payload: dict[str, Any]) -> int | None:
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        return None
    records = data.get("Записи")
    if not isinstance(records, list):
        return None
    years: list[int] = []
    for row in records:
        if not isinstance(row, dict):
            continue
        normalized = normalize_date(row.get("Дата"))
        if normalized and re.match(r"^\d{4}-", normalized):
            years.append(int(normalized[:4]))
    return min(years) if years else None


def parse_procurement_periods(page_html: str) -> tuple[str | None, str | None]:
    candidate_values = re.findall(
        r"(?:Срок исполнения контракта|Срок действия контракта|Период выполнения работ|"
        r"Срок оказания услуг|Период оказания услуг|Дата начала исполнения контракта|"
        r"Дата окончания исполнения контракта)[^<]{0,20}</[^>]+>\s*<[^>]+>(.*?)</[^>]+>",
        page_html,
        re.S | re.I,
    )
    values = [strip_tags(candidate) for candidate in candidate_values if strip_tags(candidate)]
    for value in values:
        all_dates = re.findall(r"\d{2}\.\d{2}\.\d{4}|\d{1,2}\s+[а-я]+\s+\d{4}", value or "", re.I)
        if len(all_dates) >= 2:
            return parse_russian_date(all_dates[0]), parse_russian_date(all_dates[1])
        single_date = parse_russian_date(value)
        if single_date:
            if "по" in (value or "") and "с " in (value or ""):
                all_dates = re.findall(r"\d{2}\.\d{2}\.\d{4}|\d{1,2}\s+[а-я]+\s+\d{4}", value or "", re.I)
                if len(all_dates) >= 2:
                    return parse_russian_date(all_dates[0]), parse_russian_date(all_dates[1])
            return single_date, None
    return None, None


def build_contracts_data_url(customer_seed: CustomerSeed, law_type: str, year: int, page: int = 1) -> str:
    query: list[tuple[str, str]] = [("role", "customer"), ("law", law_type), ("year", str(year))]
    if page > 1:
        query.append(("page", str(page)))
    return f"https://checko.ru/company/{customer_seed.ogrn}/contracts/data?{urllib.parse.urlencode(query)}"


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            serialized = {}
            for key in fieldnames:
                value = row.get(key)
                if isinstance(value, float):
                    serialized[key] = f"{value:.2f}".rstrip("0").rstrip(".")
                elif value is None:
                    serialized[key] = ""
                elif isinstance(value, list):
                    serialized[key] = ";".join(str(item) for item in value)
                else:
                    serialized[key] = str(value)
            writer.writerow(serialized)


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"customers": {}}
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


class MarketResearchPipeline:
    def __init__(
        self,
        out_dir: Path,
        fetcher: HttpFetcher | FakeFetcher,
        resume: bool = False,
        api_client: CheckoApiClient | Any | None = None,
    ) -> None:
        self.out_dir = out_dir
        self.fetcher = fetcher
        self.resume = resume
        self.api_client = api_client
        self.cache_dir = self.out_dir / ".cache"
        self.state_path = self.out_dir / "run_state.json"
        self.state = load_state(self.state_path)

    def _blocked_sources(self, customer_ogrn: str) -> list[BlockedSource]:
        blocked = [item for item in self.fetcher.blocked_sources if item.customer_ogrn == customer_ogrn]
        if self.api_client:
            blocked.extend(item for item in getattr(self.api_client, "blocked_sources", []) if item.customer_ogrn == customer_ogrn)
        return blocked

    def run(self, customer_ogrns: list[str], years: list[int]) -> None:
        self.out_dir.mkdir(parents=True, exist_ok=True)
        index_rows: list[dict[str, Any]] = []
        all_blocked_rows: list[dict[str, Any]] = []
        for ogrn in customer_ogrns:
            seed = PILOT_CUSTOMERS[ogrn]
            customer_dir = self.out_dir / f"{seed.ogrn}_{seed.slug}"
            profile = self._build_customer_profile(seed)
            self._mark_stage(seed.ogrn, "customer_profile")
            contracts = self._collect_customer_contracts(seed, years)
            self._mark_stage(seed.ogrn, "contracts_collected")
            contractor_profiles = self._enrich_contractors(seed, contracts)
            summary_rows, contract_rows, sources = self._build_exports(seed, profile, contracts, contractor_profiles, customer_dir)
            write_csv(
                customer_dir / "contracts.csv",
                contract_rows,
                [
                    "contract_number",
                    "contract_date",
                    "law_type",
                    "contract_subject",
                    "contract_value",
                    "contract_period_start",
                    "contract_period_end",
                    "extracted_work_count",
                    "work_count_confidence",
                    "relevance_confidence",
                    "source_url",
                    "source_platform",
                ],
            )
            write_csv(
                customer_dir / "summary.csv",
                summary_rows,
                [
                    "contractor_name",
                    "contractor_region",
                    "contracts_file",
                    "contractor_inn",
                    "total_contract_value",
                    "total_contract_count",
                    "total_work_count",
                    "org_type",
                    "employee_count",
                    "revenue_value",
                    "revenue_year",
                    "brigades_by_staff",
                    "brigades_by_revenue",
                    "source_card_url",
                ],
            )
            (customer_dir / "sources.json").write_text(
                json.dumps(sources, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            blocked_count = len(self._blocked_sources(seed.ogrn))
            index_rows.append(
                {
                    "customer_name": profile.name or seed.name,
                    "inn": profile.inn or seed.inn,
                    "ogrn": seed.ogrn,
                    "region": profile.region,
                    "city": profile.city,
                    "active_status": profile.active_status or "unknown",
                    "activity_signals": profile.activity_signals,
                    "source_card_url": profile.source_card_url or seed.website or seed.checko_company_url,
                    "contracts_found": len(contract_rows),
                    "blocked_sources": blocked_count,
                }
            )
            self._mark_stage(seed.ogrn, "exported")
            customer_blocked = [asdict(item) for item in self._blocked_sources(seed.ogrn)]
            all_blocked_rows.extend(customer_blocked)

        write_csv(
            self.out_dir / "customers_index.csv",
            index_rows,
            [
                "customer_name",
                "inn",
                "ogrn",
                "region",
                "city",
                "active_status",
                "activity_signals",
                "source_card_url",
                "contracts_found",
                "blocked_sources",
            ],
        )
        write_csv(
            self.out_dir / "blocked_sources.csv",
            all_blocked_rows,
            ["customer_ogrn", "stage", "url", "reason", "status_code", "detected_at"],
        )
        save_state(self.state_path, self.state)

    def _mark_stage(self, customer_ogrn: str, stage: str) -> None:
        self.state.setdefault("customers", {}).setdefault(customer_ogrn, {})["stage"] = stage
        self.state["customers"][customer_ogrn]["updated_at"] = utc_now_iso()
        save_state(self.state_path, self.state)

    def _build_customer_profile(self, seed: CustomerSeed) -> CompanyProfile:
        profiles: list[CompanyProfile] = []
        if self.api_client:
            api_profile = self.api_client.get_company_profile(seed)
            if api_profile:
                profiles.append(api_profile)
        checko = self.fetcher.get(seed.checko_company_url, seed.ogrn, "customer_profile_checko")
        if checko.text and not checko.blocked_reason:
            profiles.append(parse_checko_company_page(checko.text, checko.final_url))
        if seed.wiki_prom_url:
            wiki = self.fetcher.get(seed.wiki_prom_url, seed.ogrn, "customer_profile_wiki_prom")
            if wiki.text and not wiki.blocked_reason:
                profiles.append(parse_wiki_prom_company_page(wiki.text, seed.wiki_prom_url))
        needs_fallback = not profiles or not any(profile.active_status == "active" for profile in profiles)
        if needs_fallback:
            rusprofile_url = f"https://www.rusprofile.ru/search?query={seed.inn}"
            rusprofile = self.fetcher.get(rusprofile_url, seed.ogrn, "customer_profile_rusprofile")
            if rusprofile.text and not rusprofile.blocked_reason:
                profiles.append(parse_rusprofile_company_page(rusprofile.text, rusprofile.final_url))
        profile = merge_profiles(*profiles)
        profile.name = profile.name or seed.name
        profile.inn = profile.inn or seed.inn
        profile.ogrn = profile.ogrn or seed.ogrn
        profile.website = profile.website or seed.website
        profile.source_card_url = profile.source_card_url or seed.checko_company_url
        profile.active_status = profile.active_status or "unknown"
        if seed.website and "website" not in profile.activity_signals:
            profile.activity_signals.append("website")
        profile.activity_signals = sorted(dict.fromkeys(profile.activity_signals))
        return profile

    def _collect_customer_contracts(self, seed: CustomerSeed, years: list[int]) -> list[ContractRecord]:
        if self.api_client:
            api_contracts, api_responded = self.api_client.get_customer_contracts(seed, years)
            if api_responded:
                for contract in api_contracts:
                    if contract.source_url:
                        procurement = self.fetcher.get(contract.source_url, seed.ogrn, "procurement_source")
                        if procurement.text and not procurement.blocked_reason:
                            contract.contract_period_start, parsed_end = parse_procurement_periods(procurement.text)
                            contract.contract_period_end = contract.contract_period_end or parsed_end
                            if "zakupki.gov.ru" in contract.source_url:
                                contract.source_platform = "zakupki.gov.ru"
                return api_contracts
        contracts: list[ContractRecord] = []
        seen_keys: set[tuple[str, str | None]] = set()
        hard_blocked = False
        for law_type in TRACKED_LAWS:
            if hard_blocked:
                break
            for year in years:
                if hard_blocked:
                    break
                url = build_contracts_data_url(seed, law_type, year)
                first_page = self.fetcher.get(url, seed.ogrn, f"contracts_{law_type}_{year}")
                if first_page.blocked_reason in HARD_BLOCK_REASONS:
                    hard_blocked = True
                    continue
                if first_page.blocked_reason or not first_page.text:
                    continue
                page_contracts, max_page = parse_checko_contracts_page(first_page.text, seed, law_type)
                for contract in page_contracts:
                    key = (contract.contract_number, contract.source_url)
                    if key not in seen_keys:
                        seen_keys.add(key)
                        contracts.append(contract)
                for page_number in range(2, max_page + 1):
                    page_url = build_contracts_data_url(seed, law_type, year, page=page_number)
                    page_result = self.fetcher.get(page_url, seed.ogrn, f"contracts_{law_type}_{year}_page_{page_number}")
                    if page_result.blocked_reason in HARD_BLOCK_REASONS:
                        hard_blocked = True
                        break
                    if page_result.blocked_reason or not page_result.text:
                        continue
                    extra_contracts, _ = parse_checko_contracts_page(page_result.text, seed, law_type)
                    for contract in extra_contracts:
                        key = (contract.contract_number, contract.source_url)
                        if key not in seen_keys:
                            seen_keys.add(key)
                            contracts.append(contract)
        for contract in contracts:
            if contract.source_url:
                procurement = self.fetcher.get(contract.source_url, seed.ogrn, "procurement_source")
                if procurement.text and not procurement.blocked_reason:
                    contract.contract_period_start, contract.contract_period_end = parse_procurement_periods(procurement.text)
                    if "zakupki.gov.ru" in contract.source_url:
                        contract.source_platform = "zakupki.gov.ru"
        return sorted(contracts, key=lambda item: (item.contract_date or "", item.contract_number))

    def _enrich_contractors(self, seed: CustomerSeed, contracts: list[ContractRecord]) -> dict[str, CompanyProfile]:
        profiles: dict[str, CompanyProfile] = {}
        prioritized_contracts = sorted(
            contracts,
            key=lambda contract: (contract.contract_value or 0, contract.contractor_name),
            reverse=True,
        )
        for contract in prioritized_contracts:
            key = contract_counterparty_key(contract)
            if key in profiles:
                continue
            profile_parts: list[CompanyProfile] = []
            if is_hidden_223_supplier(contract.contractor_name):
                profile = CompanyProfile(
                    name=f"{contract.contractor_name} [{contract.contract_number}]" if contract.contract_number else contract.contractor_name,
                    source_card_url=contract.source_url,
                    active_status=None,
                )
                profiles[key] = profile
                continue
            if self.api_client and contract.contractor_inn:
                api_profile = self.api_client.get_company_profile_by_inn(contract.contractor_inn, seed.ogrn)
                if api_profile:
                    profile_parts.append(api_profile)
            if contract.contractor_card_url and "checko.ru/company/" in contract.contractor_card_url:
                checko_result = self.fetcher.get(contract.contractor_card_url, seed.ogrn, "contractor_checko")
                if checko_result.text and not checko_result.blocked_reason:
                    profile_parts.append(parse_checko_company_page(checko_result.text, checko_result.final_url))
            if not profile_parts:
                rusprofile_result = self.fetcher.get(
                    f"https://www.rusprofile.ru/search?query={urllib.parse.quote(contract.contractor_name)}",
                    seed.ogrn,
                    "contractor_rusprofile",
                )
                if rusprofile_result.text and not rusprofile_result.blocked_reason:
                    profile_parts.append(parse_rusprofile_company_page(rusprofile_result.text, rusprofile_result.final_url))
            profile = merge_profiles(*profile_parts)
            profile.name = profile.name or contract.contractor_name
            profile.org_type = profile.org_type or organization_type_from_name(contract.contractor_name)
            profile.source_card_url = profile.source_card_url or contract.contractor_card_url
            profiles[key] = profile
            if profile.source_card_url:
                profiles[profile.source_card_url] = profile
            if profile.inn:
                profiles[profile.inn] = profile
            if profile.inn:
                contract.contractor_inn = profile.inn
            if profile.source_card_url and not contract.contractor_card_url:
                contract.contractor_card_url = profile.source_card_url
        return profiles

    def _build_exports(
        self,
        seed: CustomerSeed,
        customer_profile: CompanyProfile,
        contracts: list[ContractRecord],
        contractor_profiles: dict[str, CompanyProfile],
        customer_dir: Path,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
        contract_rows = [asdict(contract) for contract in contracts]
        grouped: dict[str, dict[str, Any]] = {}
        for contract in contracts:
            group_key = contract_counterparty_key(contract)
            profile = contractor_profiles.get(group_key, CompanyProfile(name=contract.contractor_name))
            bucket = grouped.setdefault(
                group_key,
                {
                    "profile": profile,
                    "contracts": [],
                },
            )
            bucket["contracts"].append(contract)
        detail_dir = customer_dir / "contractors"
        summary_rows: list[dict[str, Any]] = []
        for group_key, payload in sorted(grouped.items(), key=lambda item: sum(contract.contract_value or 0 for contract in item[1]["contracts"]), reverse=True):
            profile = payload["profile"]
            bucket_contracts: list[ContractRecord] = payload["contracts"]
            total_contract_value = sum(contract.contract_value or 0 for contract in bucket_contracts) or None
            work_counts = [contract.extracted_work_count for contract in bucket_contracts if contract.extracted_work_count is not None]
            total_work_count = sum(work_counts) if work_counts else None
            contractor_slug = slugify(profile.name or group_key)
            contractor_file = detail_dir / f"{contractor_slug}.csv"
            write_csv(
                contractor_file,
                [asdict(contract) for contract in bucket_contracts],
                [
                    "contract_number",
                    "contract_date",
                    "law_type",
                    "contract_subject",
                    "contract_value",
                    "contract_period_start",
                    "contract_period_end",
                    "extracted_work_count",
                    "work_count_confidence",
                    "relevance_confidence",
                    "source_url",
                    "source_platform",
                ],
            )
            summary_rows.append(
                {
                    "contractor_name": profile.name or bucket_contracts[0].contractor_name,
                    "contractor_region": profile.region or profile.city,
                    "contracts_file": str(contractor_file),
                    "contractor_inn": profile.inn,
                    "total_contract_value": total_contract_value,
                    "total_contract_count": len(bucket_contracts),
                    "total_work_count": total_work_count,
                    "org_type": profile.org_type or organization_type_from_name(profile.name),
                    "employee_count": profile.employee_count,
                    "revenue_value": profile.revenue_value,
                    "revenue_year": profile.revenue_year,
                    "brigades_by_staff": math.ceil(profile.employee_count / 10) if profile.employee_count else None,
                    "brigades_by_revenue": math.ceil(profile.revenue_value / 80_000_000) if profile.revenue_value else None,
                    "source_card_url": profile.source_card_url,
                }
            )
        sources = {
            "generated_at": utc_now_iso(),
            "customer": {
                "name": customer_profile.name or seed.name,
                "ogrn": seed.ogrn,
                "inn": customer_profile.inn or seed.inn,
                "website": customer_profile.website or seed.website,
                "source_card_url": customer_profile.source_card_url,
                "activity_signals": customer_profile.activity_signals,
            },
            "contracts": [
                {
                    "contract_number": contract.contract_number,
                    "source_url": contract.source_url,
                    "source_platform": contract.source_platform,
                    "contractor_card_url": contract.contractor_card_url,
                }
                for contract in contracts
            ],
            "blocked_sources": [asdict(item) for item in self._blocked_sources(seed.ogrn)],
            "api_enabled": bool(self.api_client),
        }
        return summary_rows, contract_rows, sources


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Pilot market research ETL for VRK.")
    subparsers = parser.add_subparsers(dest="command")
    run_parser = subparsers.add_parser("run", help="Run the full ETL pipeline.")
    run_parser.add_argument("--customer-ogrn", action="append", dest="customer_ogrns", default=[])
    run_parser.add_argument("--years", nargs="+", type=int, default=list(TRACKED_YEARS))
    run_parser.add_argument("--out", required=True)
    run_parser.add_argument("--resume", action="store_true")
    run_parser.add_argument("--disable-api", action="store_true", help="Use HTML sources only, even if CHECKO_API_KEY is set.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command != "run":
        parser.print_help()
        return 1
    if not args.customer_ogrns:
        parser.error("Pilot mode requires at least one --customer-ogrn.")
    unknown = [ogrn for ogrn in args.customer_ogrns if ogrn not in PILOT_CUSTOMERS]
    if unknown:
        parser.error(f"Unknown pilot customer OGRN: {', '.join(unknown)}")
    invalid_years = [year for year in args.years if year not in TRACKED_YEARS]
    if invalid_years:
        parser.error(f"Supported years are {', '.join(str(year) for year in TRACKED_YEARS)}")
    out_dir = Path(args.out)
    fetcher = HttpFetcher(out_dir / ".cache")
    api_client = None if args.disable_api else CheckoApiClient.from_env(out_dir / ".cache")
    pipeline = MarketResearchPipeline(out_dir=out_dir, fetcher=fetcher, resume=args.resume, api_client=api_client)
    pipeline.run(customer_ogrns=args.customer_ogrns, years=args.years)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
