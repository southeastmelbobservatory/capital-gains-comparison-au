#!/usr/bin/env python3
"""Regenerate the embedded ABS Table 17 CPI dataset from the official release page."""

from __future__ import annotations

import html
import json
import re
import io
import urllib.parse
import urllib.request
import zipfile
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

SOURCE_URL = "https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release?trk=public_post_comment-text"
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "src/domain/cpiTable17.generated.ts"
TABLE_TITLE = "TABLE 17. CPI: Quarterly All Groups, Index numbers and Percentage change"

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def fetch_text(url: str) -> str:
    with urllib.request.urlopen(url) as response:
        return response.read().decode("utf-8", "replace")


def fetch_bytes(url: str) -> bytes:
    with urllib.request.urlopen(url) as response:
        return response.read()


def parse_release_metadata(html_text: str) -> tuple[str, str, str]:
    period_match = re.search(r"Consumer Price Index, Australia, ([A-Za-z]+ \d{4})", html_text)
    release_match = re.findall(r"\d{2}/\d{2}/\d{4}", html_text)
    workbook_match = re.search(r"TABLE 17.*?href=\"([^\"]+\.xlsx)\"", html_text, re.S | re.I)

    if not period_match:
        raise RuntimeError("Could not find release reference period on ABS page")
    if not release_match:
        raise RuntimeError("Could not find release date on ABS page")
    if not workbook_match:
        raise RuntimeError("Could not find Table 17 workbook link on ABS page")

    workbook_url = urllib.parse.urljoin(SOURCE_URL, html.unescape(workbook_match.group(1)))
    release_date = datetime.strptime(release_match[0], "%d/%m/%Y").date().isoformat()
    reference_period = period_match.group(1)
    return release_date, reference_period, workbook_url


def excel_serial_to_date(serial: int) -> str:
    return (date(1899, 12, 30) + timedelta(days=serial)).isoformat()


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []

    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    values: list[str] = []
    for shared_string in root:
        pieces = [node.text or "" for node in shared_string.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")]
        values.append("".join(pieces))
    return values


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str | None:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("a:v", NS)
    if value_node is None or value_node.text is None:
        return None

    raw_value = value_node.text
    if cell_type == "s":
        return shared_strings[int(raw_value)]
    return raw_value


def parse_numeric(value: str | None) -> float | None:
    if value is None:
        return None

    try:
        return float(value)
    except ValueError:
        return None


def parse_table17_workbook(workbook_bytes: bytes) -> list[dict[str, object]]:
    with zipfile.ZipFile(io.BytesIO(workbook_bytes)) as zf:
        workbook = ET.fromstring(zf.read("xl/workbook.xml"))
        rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
        sheets = workbook.find("a:sheets", NS)
        if sheets is None or len(sheets) < 2:
            raise RuntimeError("Unexpected ABS workbook structure")

        sheet_id = sheets[1].attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        sheet_path = "xl/" + rel_map[sheet_id]
        shared_strings = load_shared_strings(zf)
        sheet = ET.fromstring(zf.read(sheet_path))
        data_rows: list[dict[str, object]] = []

        for row in sheet.find("a:sheetData", NS).findall("a:row", NS):  # type: ignore[union-attr]
            cells = {re.sub(r"\d+$", "", cell.attrib["r"]): cell for cell in row.findall("a:c", NS)}
            serial_value = cell_value(cells.get("A"), shared_strings) if cells.get("A") is not None else None
            index_value = cell_value(cells.get("J"), shared_strings) if cells.get("J") is not None else None
            pct_value = cell_value(cells.get("S"), shared_strings) if cells.get("S") is not None else None

            serial_number = parse_numeric(serial_value)
            index_number = parse_numeric(index_value)

            if serial_number is None or index_number is None:
                continue

            pct_number = parse_numeric(pct_value)
            data_rows.append(
                {
                    "period": excel_serial_to_date(int(serial_number)),
                    "index": round(index_number, 2),
                    "percentageChange": None if pct_number is None else round(pct_number, 2),
                }
            )

        return data_rows


def format_ts_array(rows: list[dict[str, object]]) -> str:
    lines = ["export const ABS_TABLE_17_QUARTERLY_AUSTRALIA = ["]
    for row in rows:
        pct = "null" if row["percentageChange"] is None else f'{row["percentageChange"]}'
        lines.append(
            "  { period: '%s', index: %s, percentageChange: %s },"
            % (row["period"], row["index"], pct)
        )
    lines.append("] as const")
    return "\n".join(lines)


def main() -> int:
    release_page = fetch_text(SOURCE_URL)
    release_date, reference_period, workbook_url = parse_release_metadata(release_page)
    workbook_bytes = fetch_bytes(workbook_url)
    rows = parse_table17_workbook(workbook_bytes)

    metadata = {
        "sourceUrl": SOURCE_URL,
        "workbookUrl": workbook_url,
        "releaseDate": release_date,
        "referencePeriod": reference_period,
        "tableTitle": TABLE_TITLE,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "rowCount": len(rows),
    }

    output = "\n".join(
        [
            "import type { CpiDatasetMetadata, CpiObservation } from './cpiTypes'",
            "",
            f"export const ABS_TABLE_17_METADATA: CpiDatasetMetadata = {json.dumps(metadata, indent=2)}",
            "",
            f"{format_ts_array(rows)} satisfies readonly CpiObservation[]",
            "",
        ]
    )

    OUTPUT_FILE.write_text(output, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
