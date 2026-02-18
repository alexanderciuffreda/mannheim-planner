"""
Mannheim DS Planner - Cloud Version (Stateless)

This version is designed for cloud deployment (Azure Container Apps).
All user data is stored in the browser's LocalStorage.
The server only provides read-only catalog data.
"""

from __future__ import annotations
from typing import Union, List, Dict, Any, Optional
from flask import Flask, jsonify, request, render_template, Response
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import json
import re
import os

app = Flask(__name__)

# =============================================================================
# DATA LOADING (Read-only catalog)
# =============================================================================

DATA_DIR = Path(__file__).parent / "data"


def _load_json(filename: str) -> Union[Dict, List]:
    """Load a JSON file from the data directory."""
    path = DATA_DIR / filename
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _load_courses() -> List[Dict]:
    """Load the course catalog.
    
    Tries courses_full.json first (has professor/metrics data),
    falls back to courses_parsed.json.
    """
    # Try full data first (includes professor, metrics)
    data = _load_json("courses_full.json")
    if isinstance(data, dict) and "courses" in data:
        return data["courses"]
    # Fallback to parsed data
    data = _load_json("courses_parsed.json")
    if isinstance(data, dict) and "courses" in data:
        return data["courses"]
    return []


def _load_restricted() -> Dict:
    """Load restricted courses info."""
    return _load_json("restricted_courses.json")


# MMDS Program Rules (PO 2024)
MMDS_RULES = {
    "program_name": "M.Sc. Data Science (Mannheim)",
    "total_ects": 120,
    "areas": [
        {"id": "fundamentals", "name": "B. Fundamentals", "min_ects": 27, "max_ects": 27, "required_ects": 27},
        {"id": "data-management", "name": "C. Data Management", "min_ects": 6, "max_ects": 24, "required_ects": 6},
        {"id": "data-analytics-methods", "name": "D. Data Analytics Methods", "min_ects": 12, "max_ects": 36, "required_ects": 12},
        {"id": "responsible-data-science", "name": "E. Responsible Data Science", "min_ects": 3, "max_ects": 7, "required_ects": 3},
        {"id": "projects-and-seminars", "name": "F. Projects and Seminars", "min_ects": 14, "max_ects": 18, "required_ects": 14},
        {"id": "master-thesis", "name": "G. Master Thesis", "min_ects": 30, "max_ects": 30, "required_ects": 30},
    ]
}

# Additional Course module constants
ADDITIONAL_COURSE_CODES = {"AC 651", "AC 652", "AC 653", "AC 654"}
ADDITIONAL_COURSE_MAX_ECTS = 18

# Area color mapping
AREA_COLORS = {
    "fundamentals": "#b5673f",
    "data-management": "#c78c64",
    "data-analytics-methods": "#d4a574",
    "responsible-data-science": "#8fbc8f",
    "projects-and-seminars": "#9f4f2a",
    "master-thesis": "#6b4423",
    "unassigned": "#d2c8bf",
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _normalize_text(text: str) -> str:
    """Normalize text for matching."""
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def _is_additional_course(code: str) -> bool:
    """Check if a course code is an Additional Course module."""
    return (code or "").upper().strip() in ADDITIONAL_COURSE_CODES


def _get_area_id_from_name(name: str) -> Optional[str]:
    """Map area name to area ID."""
    n = _normalize_text(name)
    if "fundamental" in n:
        return "fundamentals"
    if "datamanagement" in n:
        return "data-management"
    if "dataanalyticsmethod" in n or "dataanalyticmethod" in n:
        return "data-analytics-methods"
    if "responsible" in n:
        return "responsible-data-science"
    if "project" in n or "seminar" in n:
        return "projects-and-seminars"
    if "thesis" in n:
        return "master-thesis"
    return None


def _serialize_course(course: dict, restricted_map: dict) -> dict:
    """Serialize a course for the API response."""
    # Support both field naming conventions (module_code/module_name vs code/title)
    code = course.get("code") or course.get("module_code") or ""
    title = course.get("title") or course.get("module_name") or ""
    is_ac = _is_additional_course(code)
    
    # Determine area_id
    area_id = course.get("area_id") or ""
    if not area_id:
        # Try to get from assigned_areas
        assigned = course.get("assigned_areas") or []
        if assigned:
            # assigned_areas can be list of strings or list of dicts
            first_area = assigned[0]
            if isinstance(first_area, dict):
                # Old format: [{"area": "...", "po_version": "..."}]
                for aa in assigned:
                    if "PO 2024" in aa.get("po_version", ""):
                        area_id = _get_area_id_from_name(aa.get("area", "")) or ""
                        break
                if not area_id:
                    area_id = _get_area_id_from_name(first_area.get("area", "")) or ""
            else:
                # New format: ["Data Analytics Methods", ...]
                area_id = _get_area_id_from_name(str(first_area)) or ""
    
    # Get area name
    area_name = "Unassigned"
    for area in MMDS_RULES["areas"]:
        if area["id"] == area_id:
            area_name = area["name"]
            break
    
    # Check restrictions
    restricted_info = restricted_map.get(code.upper(), {})
    is_restricted = restricted_info.get("kind") == "explicit"
    
    # Parse ECTS
    ects_raw = course.get("ects")
    if isinstance(ects_raw, str) and "max" in ects_raw.lower():
        ects = ADDITIONAL_COURSE_MAX_ECTS if is_ac else 0
    else:
        try:
            ects = float(ects_raw or 0)
        except (ValueError, TypeError):
            ects = 0
    
    # Extract metrics if available
    metrics = course.get("metrics") or {}
    h_index = metrics.get("h_index", 0)
    citations = metrics.get("citations", 0)
    top_paper = None
    if metrics.get("top_paper_title"):
        top_paper = {
            "title": metrics.get("top_paper_title", ""),
            "citations": metrics.get("top_paper_citations", 0),
            "year": metrics.get("top_paper_year"),
            "venue": metrics.get("top_paper_venue", ""),
        }
    
    return {
        "id": course.get("id") or f"course-{code}".lower().replace(" ", "-"),
        "code": code,
        "title": title,
        "ects": ects,
        "professor": course.get("professor") or "",
        "chair": course.get("chair") or "",
        "semester": course.get("semester") or "",
        "area_id": area_id,
        "area_name": area_name,
        "source": course.get("source") or "catalog",
        "is_additional_course": is_ac,
        "max_ects": ADDITIONAL_COURSE_MAX_ECTS if is_ac else None,
        "restricted": is_restricted,
        "restricted_kind": restricted_info.get("kind", ""),
        "restricted_reason": restricted_info.get("reason", ""),
        # Professor/research metrics
        "h_index": h_index,
        "citations": citations,
        "top_paper": top_paper,
    }


# =============================================================================
# API ENDPOINTS (Stateless)
# =============================================================================

@app.get("/")
def index():
    """Serve the main application."""
    return render_template("index.html")


@app.get("/api/catalog")
def get_catalog():
    """
    Get the complete course catalog and program rules.
    This is the only data the server provides - everything else is client-side.
    """
    courses_raw = _load_courses()
    restricted_data = _load_restricted()
    
    # Build restricted map
    restricted_map = {}
    for item in restricted_data.get("restricted", []):
        code = (item.get("code") or "").upper()
        if code:
            restricted_map[code] = item
    
    # Serialize courses
    courses = []
    for c in courses_raw:
        serialized = _serialize_course(c, restricted_map)
        # Only include non-explicitly-restricted courses
        if not serialized["restricted"]:
            courses.append(serialized)
    
    # Sort by title
    courses.sort(key=lambda x: x["title"].lower())
    
    return jsonify({
        "courses": courses,
        "rules": MMDS_RULES,
        "area_colors": AREA_COLORS,
    })


@app.post("/api/export/<format>")
def export_plan(format: str):
    """
    Export the study plan. Client sends their plan data, server generates the export.
    
    Expected payload:
    {
        "selections": [
            {"course_id": "...", "ects": 6, "status": "planned|completed"},
            ...
        ]
    }
    """
    from io import StringIO
    import csv as csv_module
    
    if format not in {"markdown", "md", "csv", "json"}:
        return jsonify({"error": "Invalid format. Use: markdown, csv, json"}), 400
    
    payload = request.get_json(silent=True) or {}
    selections = payload.get("selections", [])
    
    # Load catalog for course info
    courses_raw = _load_courses()
    restricted_data = _load_restricted()
    restricted_map = {(item.get("code") or "").upper(): item for item in restricted_data.get("restricted", [])}
    
    # Build course map
    course_map = {}
    for c in courses_raw:
        serialized = _serialize_course(c, restricted_map)
        course_map[serialized["id"]] = serialized
        # Also map by code for flexibility
        if serialized["code"]:
            course_map[serialized["code"].lower().replace(" ", "-")] = serialized
    
    # Build plan data
    plan_by_area: dict[str, list[dict]] = defaultdict(list)
    total_planned = 0.0
    total_completed = 0.0
    
    for sel in selections:
        course_id = sel.get("course_id") or sel.get("id") or ""
        course = course_map.get(course_id)
        if not course:
            # Try finding by code
            for c in course_map.values():
                if c.get("id") == course_id:
                    course = c
                    break
        
        if not course:
            continue
        
        # Use selection ECTS if provided (for AC modules), otherwise course ECTS
        ects = float(sel.get("ects") or sel.get("ects_override") or course.get("ects") or 0)
        is_completed = sel.get("status") == "completed"
        area_name = course.get("area_name") or "Unassigned"
        
        plan_by_area[area_name].append({
            "code": course.get("code") or "",
            "title": course.get("title") or "",
            "ects": ects,
            "professor": course.get("professor") or "",
            "status": "Abgeschlossen" if is_completed else "Geplant",
            "area": area_name,
        })
        
        total_planned += ects
        if is_completed:
            total_completed += ects
    
    # Calculate area progress
    area_progress_data = []
    for area in MMDS_RULES["areas"]:
        area_ects = sum(c["ects"] for c in plan_by_area.get(area["name"], []))
        area_progress_data.append({
            "name": area["name"],
            "planned": area_ects,
            "required": area["min_ects"],
            "fulfilled": area_ects >= area["min_ects"],
        })
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # === MARKDOWN FORMAT ===
    if format in {"markdown", "md"}:
        lines = [
            "# Studienplan M.Sc. Data Science (Mannheim)",
            "",
            f"*Exportiert am {now_str}*",
            "",
            "---",
            "",
            "## Zusammenfassung",
            "",
            f"- **ECTS geplant:** {total_planned:.0f} / 120",
            f"- **ECTS abgeschlossen:** {total_completed:.0f}",
            f"- **Fortschritt:** {(total_planned / 120 * 100):.0f}%",
            "",
            "### Bereichs-Fortschritt",
            "",
            "| Bereich | Geplant | Erforderlich | Status |",
            "|---------|---------|--------------|--------|",
        ]
        for ap in area_progress_data:
            status = "Erfüllt" if ap["fulfilled"] else "Offen"
            lines.append(f"| {ap['name']} | {ap['planned']:.0f} ECTS | {ap['required']:.0f} ECTS | {status} |")
        
        lines.extend(["", "---", "", "## Geplante Module", ""])
        
        for area_name in sorted(plan_by_area.keys()):
            courses = plan_by_area[area_name]
            area_ects = sum(c["ects"] for c in courses)
            lines.append(f"### {area_name} ({area_ects:.0f} ECTS)")
            lines.append("")
            lines.append("| Code | Titel | ECTS | Dozent | Status |")
            lines.append("|------|-------|------|--------|--------|")
            for c in sorted(courses, key=lambda x: x["code"]):
                lines.append(f"| {c['code']} | {c['title']} | {c['ects']:.0f} | {c['professor']} | {c['status']} |")
            lines.append("")
        
        lines.extend([
            "---",
            "",
            "*Generiert mit dem Mannheim DS Planner*",
        ])
        
        content = "\n".join(lines)
        response = Response(content, mimetype="text/markdown")
        response.headers["Content-Disposition"] = f"attachment; filename=studienplan_{datetime.now().strftime('%Y%m%d')}.md"
        return response
    
    # === CSV FORMAT ===
    elif format == "csv":
        output = StringIO()
        writer = csv_module.writer(output, delimiter=";")
        
        writer.writerow(["Bereich", "Code", "Titel", "ECTS", "Dozent", "Status"])
        
        for area_name in sorted(plan_by_area.keys()):
            for c in sorted(plan_by_area[area_name], key=lambda x: x["code"]):
                writer.writerow([
                    c["area"],
                    c["code"],
                    c["title"],
                    f"{c['ects']:.0f}",
                    c["professor"],
                    c["status"],
                ])
        
        writer.writerow([])
        writer.writerow(["# Zusammenfassung"])
        writer.writerow(["ECTS geplant", f"{total_planned:.0f}"])
        writer.writerow(["ECTS abgeschlossen", f"{total_completed:.0f}"])
        
        content = output.getvalue()
        response = Response(content, mimetype="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=studienplan_{datetime.now().strftime('%Y%m%d')}.csv"
        return response
    
    # === JSON FORMAT ===
    else:
        result = {
            "export_date": now_str,
            "program": "M.Sc. Data Science (Mannheim)",
            "summary": {
                "total_ects": 120,
                "planned_ects": total_planned,
                "completed_ects": total_completed,
                "progress_percent": round(total_planned / 120 * 100, 1),
            },
            "area_progress": area_progress_data,
            "modules": [
                c
                for area in sorted(plan_by_area.keys())
                for c in sorted(plan_by_area[area], key=lambda x: x["code"])
            ],
        }
        response = jsonify(result)
        response.headers["Content-Disposition"] = f"attachment; filename=studienplan_{datetime.now().strftime('%Y%m%d')}.json"
        return response


@app.get("/api/health")
def health():
    """Health check endpoint for container orchestration."""
    return jsonify({"status": "healthy", "version": "1.0.0"})


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
