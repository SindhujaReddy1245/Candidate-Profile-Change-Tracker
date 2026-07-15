import difflib
import hashlib
import hmac
import re
import secrets

import pdfplumber


SKILL_KEYWORDS = [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "Node",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "FastAPI",
    "Django",
    "Flask",
    "Excel",
    "Power BI",
    "Tableau",
    "Machine Learning",
]

SECTION_HEADERS = {
    "experience": ["experience", "work experience", "employment", "professional experience"],
    "education": ["education", "academic background"],
    "projects": ["projects", "personal projects", "academic projects"],
    "certifications": ["certifications", "certificates", "licenses"],
    "summary": ["summary", "profile", "objective", "professional summary"],
}

CRITICAL_CHANGE_TYPES = {"email", "phone"}
IMPORTANT_CHANGE_TYPES = {"skills", "experience", "education", "certifications"}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def extract_skills(text: str):
    normalized = text.lower()
    return [skill for skill in SKILL_KEYWORDS if skill.lower() in normalized]


def extract_email(text: str):
    match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    return match.group(0) if match else ""


def extract_phone(text: str):
    match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", text)
    return normalize_text(match.group(0)) if match else ""

def extract_sections(text: str):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sections = {key: "" for key in SECTION_HEADERS}
    current_section = None

    for line in lines:
        normalized_line = normalize_text(line).lower().rstrip(":")
        matched_section = next(
            (
                section
                for section, headers in SECTION_HEADERS.items()
                if normalized_line in headers or any(normalized_line.startswith(f"{header}:") for header in headers)
            ),
            None,
        )

        if matched_section:
            current_section = matched_section
            continue

        if current_section:
            sections[current_section] = normalize_text(f"{sections[current_section]} {line}")

    return sections


def calculate_similarity(old_text: str, new_text: str):
    old_words = normalize_text(old_text).lower().split()
    new_words = normalize_text(new_text).lower().split()
    if not old_words and not new_words:
        return 100
    return round(difflib.SequenceMatcher(None, old_words, new_words).ratio() * 100)


def classify_change(change_type: str, old_value: str, new_value: str):
    similarity = calculate_similarity(old_value, new_value)

    if change_type in CRITICAL_CHANGE_TYPES:
        return "Critical"
    if change_type in IMPORTANT_CHANGE_TYPES and similarity < 85:
        return "Important"
    if similarity < 60:
        return "Important"
    if similarity < 90:
        return "Moderate"
    return "Minor"


def summarize_diff(old_text: str, new_text: str):
    old_words = normalize_text(old_text).split()
    new_words = normalize_text(new_text).split()
    matcher = difflib.SequenceMatcher(None, old_words, new_words)
    added = []
    removed = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag in ("replace", "delete"):
            removed.extend(old_words[i1:i2])
        if tag in ("replace", "insert"):
            added.extend(new_words[j1:j2])

    return {
        "added": " ".join(added[:40]) or "No major additions found",
        "removed": " ".join(removed[:40]) or "No major removals found",
        "similarity": round(matcher.ratio() * 100),
    }


def hash_password(password: str):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str):
    try:
        salt, expected = stored_hash.split("$", 1)
    except ValueError:
        return False

    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return hmac.compare_digest(digest.hex(), expected)


def add_change(changes, change_type: str, old_value, new_value):
    old_text = ", ".join(old_value) if isinstance(old_value, list) else str(old_value or "Not found")
    new_text = ", ".join(new_value) if isinstance(new_value, list) else str(new_value or "Not found")

    if normalize_text(old_text) == normalize_text(new_text):
        return

    changes.append({
        "change_type": change_type,
        "old_value": old_text,
        "new_value": new_text,
        "classification": classify_change(change_type, old_text, new_text),
    })

def extract_resume_data(file_path: str):
    data = {}
    with pdfplumber.open(file_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"

    clean_text = normalize_text(text)
    data["full_text"] = clean_text
    data["summary"] = clean_text[:500]
    data["skills"] = extract_skills(clean_text)
    data["email"] = extract_email(clean_text)
    data["phone"] = extract_phone(clean_text)
    data["sections"] = extract_sections(text)
    return data

def compare_resumes(old, new):
    changes = []

    add_change(changes, "skills", old.get("skills") or [], new.get("skills") or [])
    add_change(changes, "email", old.get("email"), new.get("email"))
    add_change(changes, "phone", old.get("phone"), new.get("phone"))

    old_sections = old.get("sections") or {}
    new_sections = new.get("sections") or {}
    for section_name in SECTION_HEADERS:
        add_change(changes, section_name, old_sections.get(section_name), new_sections.get(section_name))

    if normalize_text(old.get("full_text")) != normalize_text(new.get("full_text")):
        diff = summarize_diff(old.get("full_text", ""), new.get("full_text", ""))
        changes.append({
            "change_type": "resume_content",
            "old_value": f"Removed: {diff['removed']}",
            "new_value": f"Added: {diff['added']}",
            "classification": f"{classify_change('resume_content', old.get('full_text', ''), new.get('full_text', ''))} - {diff['similarity']}% similar"
        })
    return changes
