#!/usr/bin/env python3
"""Search the repo-local Storybook inventory for reusable VRK UI components."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable


STORY_GLOB = "apps/web/stories/**/*.stories.tsx"
TITLE_RE = re.compile(r'title:\s*"([^"]+)"')
COMPONENT_RE = re.compile(r"component:\s*([A-Za-z0-9_]+)\b")
TAGS_RE = re.compile(r"tags:\s*\[([^\]]*)\]")
EXPORT_RE = re.compile(r"^export const ([A-Za-z0-9_]+)\s*:", re.MULTILINE)
IMPORT_RE = re.compile(
    r'^\s*import\s+(?!type\b)(?P<clause>.+?)\s+from\s+"(?P<path>[^"]+)";\s*$',
    re.MULTILINE,
)
EXPORT_FROM_RE = re.compile(
    r'^\s*export\s*\{(?P<symbols>[^}]*)\}\s*from\s*"(?P<path>[^"]+)";\s*$',
    re.MULTILINE,
)
EXPORT_ALL_RE = re.compile(
    r'^\s*export\s+\*\s+from\s+"(?P<path>[^"]+)";\s*$',
    re.MULTILINE,
)


@dataclass
class StoryEntry:
    title: str
    story_file: str
    component_symbol: str
    component_import_path: str | None
    component_source_path: str | None
    story_exports: list[str]
    tags: list[str]
    search_text: str


def find_repo_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / "AGENTS.md").exists() and (candidate / "apps" / "web").exists():
            return candidate
    raise SystemExit("Could not locate repo root from script path.")


def camel_to_words(value: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", " ", value)


def tokenize(parts: Iterable[str]) -> set[str]:
    tokens: set[str] = set()
    for part in parts:
        expanded = camel_to_words(part)
        for token in re.split(r"[^\w]+", expanded.lower()):
            if token:
                tokens.add(token)
    return tokens


def parse_import_symbols(clause: str, import_path: str) -> dict[str, str]:
    mapping: dict[str, str] = {}
    normalized = clause.strip()
    default_part = ""
    named_part = ""

    if "{" in normalized and "}" in normalized:
        before_brace, after_brace = normalized.split("{", 1)
        default_part = before_brace.rstrip(", ").strip()
        named_part = after_brace.split("}", 1)[0]
    elif normalized.startswith("{") and normalized.endswith("}"):
        named_part = normalized[1:-1]
    else:
        default_part = normalized

    if default_part and not default_part.startswith("type "):
        mapping[default_part] = import_path

    for raw_symbol in named_part.split(","):
        symbol = raw_symbol.strip()
        if not symbol or symbol.startswith("type "):
            continue
        local_name = symbol
        if " as " in symbol:
            _, local_name = symbol.split(" as ", 1)
        mapping[local_name.strip()] = import_path

    return mapping


def resolve_module_path(repo_root: Path, story_file: Path, import_path: str) -> Path | None:
    if import_path.startswith("@/"):
        base = repo_root / "apps" / "web" / import_path.removeprefix("@/")
    elif import_path.startswith("."):
        base = (story_file.parent / import_path).resolve()
    else:
        return None

    candidates = [
        base,
        base.with_suffix(".ts"),
        base.with_suffix(".tsx"),
        base / "index.ts",
        base / "index.tsx",
    ]

    for candidate in candidates:
        if candidate.is_file():
            return candidate

    return None


def resolve_barrel_export(repo_root: Path, module_path: Path, symbol: str) -> Path | None:
    if module_path.suffix in {".ts", ".tsx"} and module_path.name != "index.ts":
        return module_path

    if not module_path.exists() or not module_path.is_file():
        return module_path if module_path.exists() else None

    text = module_path.read_text(encoding="utf-8")

    for match in EXPORT_FROM_RE.finditer(text):
        export_path = match.group("path")
        raw_symbols = match.group("symbols")
        for raw_symbol in raw_symbols.split(","):
            candidate = raw_symbol.strip()
            if not candidate:
                continue
            candidate = candidate.removeprefix("type ").strip()
            exported_name = candidate
            if " as " in candidate:
                exported_name = candidate.split(" as ", 1)[1].strip()
            if exported_name == symbol:
                target = resolve_module_path(repo_root, module_path, export_path)
                if target is None:
                    return None
                return resolve_barrel_export(repo_root, target, symbol)

    for match in EXPORT_ALL_RE.finditer(text):
        export_path = match.group("path")
        target = resolve_module_path(repo_root, module_path, export_path)
        if target is None or target == module_path:
            continue
        resolved = resolve_barrel_export(repo_root, target, symbol)
        if resolved is not None:
            return resolved

    return module_path


def relative_path(repo_root: Path, path: Path | None) -> str | None:
    if path is None:
        return None
    try:
        return str(path.resolve().relative_to(repo_root.resolve()))
    except ValueError:
        return str(path.resolve())


def parse_story_entry(repo_root: Path, story_path: Path) -> StoryEntry | None:
    text = story_path.read_text(encoding="utf-8")

    title_match = TITLE_RE.search(text)
    component_match = COMPONENT_RE.search(text)
    if title_match is None or component_match is None:
        return None

    imports: dict[str, str] = {}
    for match in IMPORT_RE.finditer(text):
        imports.update(parse_import_symbols(match.group("clause"), match.group("path")))

    tags_match = TAGS_RE.search(text)
    tags = []
    if tags_match is not None:
        tags = [tag.strip().strip('"').strip("'") for tag in tags_match.group(1).split(",") if tag.strip()]

    story_exports = EXPORT_RE.findall(text)
    component_symbol = component_match.group(1)
    component_import_path = imports.get(component_symbol)
    component_source_path = None

    if component_import_path is not None:
        module_path = resolve_module_path(repo_root, story_path, component_import_path)
        resolved = resolve_barrel_export(repo_root, module_path, component_symbol) if module_path else None
        component_source_path = relative_path(repo_root, resolved)

    title = title_match.group(1)
    search_tokens = tokenize(
        [
            title,
            component_symbol,
            component_import_path or "",
            component_source_path or "",
            " ".join(story_exports),
            " ".join(tags),
        ]
    )

    return StoryEntry(
        title=title,
        story_file=relative_path(repo_root, story_path) or str(story_path),
        component_symbol=component_symbol,
        component_import_path=component_import_path,
        component_source_path=component_source_path,
        story_exports=story_exports,
        tags=tags,
        search_text=" ".join(sorted(search_tokens)),
    )


def build_registry(repo_root: Path) -> list[StoryEntry]:
    entries: list[StoryEntry] = []
    for story_path in sorted(repo_root.glob(STORY_GLOB)):
        entry = parse_story_entry(repo_root, story_path)
        if entry is not None:
            entries.append(entry)
    return entries


def score_entry(entry: StoryEntry, query: str) -> float:
    if not query:
        return 0.0

    query_tokens = tokenize([query])
    if not query_tokens:
        return 0.0

    entry_tokens = set(entry.search_text.split())
    overlap = len(query_tokens & entry_tokens)
    normalized_query = query.strip().lower()
    contains_query = (
        normalized_query in entry.title.lower()
        or normalized_query in entry.component_symbol.lower()
        or normalized_query in (entry.component_source_path or "").lower()
    )
    ratio = max(
        SequenceMatcher(None, query.lower(), entry.title.lower()).ratio(),
        SequenceMatcher(None, query.lower(), entry.component_symbol.lower()).ratio(),
    )

    if overlap == 0 and not contains_query and ratio < 0.55:
        return 0.0

    score = overlap * 3.0 + ratio
    if normalized_query == entry.title.lower():
        score += 4.0
    if normalized_query == entry.component_symbol.lower():
        score += 4.0
    if normalized_query in entry.title.lower():
        score += 2.0
    if normalized_query in (entry.component_source_path or "").lower():
        score += 2.0
    return score


def render_text(entries: list[dict[str, object]], total_stories: int, query: str) -> str:
    header = [f"Storybook registry entries: {total_stories}"]
    if query:
        header.append(f'Query: "{query}"')
    lines = header + [""]
    if not entries:
        lines.append("No matching story-backed components found.")
        return "\n".join(lines)

    for index, entry in enumerate(entries, start=1):
        lines.append(f"{index}. {entry['title']} [{entry['component_symbol']}]")
        lines.append(f"   story: {entry['story_file']}")
        if entry["component_source_path"]:
            lines.append(f"   source: {entry['component_source_path']}")
        elif entry["component_import_path"]:
            lines.append(f"   import: {entry['component_import_path']}")
        if entry["story_exports"]:
            lines.append(f"   stories: {', '.join(entry['story_exports'])}")
        if entry["tags"]:
            lines.append(f"   tags: {', '.join(entry['tags'])}")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Search the repo-local Storybook inventory for existing VRK UI components."
    )
    parser.add_argument("--query", default="", help="Natural-language need or component name.")
    parser.add_argument("--limit", type=int, default=5, help="Maximum number of results to return.")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of text.")
    parser.add_argument(
        "--include-all",
        action="store_true",
        help="Return the full registry instead of only scored candidates.",
    )
    args = parser.parse_args()

    repo_root = find_repo_root(Path(__file__).resolve())
    registry = build_registry(repo_root)

    scored_entries: list[tuple[float, StoryEntry]] = []
    for entry in registry:
        score = score_entry(entry, args.query)
        if args.include_all or not args.query or score > 0:
            scored_entries.append((score, entry))

    if args.query:
        scored_entries.sort(key=lambda item: (-item[0], item[1].title, item[1].story_file))
    else:
        scored_entries.sort(key=lambda item: (item[1].title, item[1].story_file))

    limited_entries = scored_entries if args.include_all else scored_entries[: max(args.limit, 1)]

    payload_entries: list[dict[str, object]] = []
    for score, entry in limited_entries:
        row = asdict(entry)
        if args.query:
            row["score"] = round(score, 3)
        payload_entries.append(row)

    if args.json:
        print(
            json.dumps(
                {
                    "repo_root": str(repo_root),
                    "query": args.query,
                    "story_count": len(registry),
                    "results": payload_entries,
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        return

    print(render_text(payload_entries, len(registry), args.query))


if __name__ == "__main__":
    main()
