import re
from typing import Tuple

BLOCKED_KEYWORDS = [
    r"\bdrop\b",
    r"\bdelete\b",
    r"\btruncate\b",
    r"\balter\b",
    r"\bupdate\b",
    r"\binsert\b",
    r"\bcreate\b",
    r"\battach\b",
    r"\bdetach\b",
    r"\bpragma\b",
    r"\bexec\b",
    r"\bexecute\b",
    r"\bgrant\b",
    r"\brevoke\b",
]

def is_safe_sql(sql: str) -> Tuple[bool, str]:
    """
    Validates that a SQL query is read-only and free of destructive statements.
    Returns (is_safe, reason).
    """
    cleaned = sql.strip()
    lower_sql = cleaned.lower()

    if not lower_sql.startswith("select") and not lower_sql.startswith("with"):
        return False, "Security violation: Only SELECT queries are permitted."

    for pattern in BLOCKED_KEYWORDS:
        if re.search(pattern, lower_sql):
            clean_kw = pattern.replace(r"\b", "")
            return False, f"Security violation: Disallowed keyword '{clean_kw}' detected."

    # Semicolon checks to prevent multi-statement SQL injection
    semicolon_count = cleaned.count(";")
    if semicolon_count > 1 or (semicolon_count == 1 and not cleaned.endswith(";")):
        return False, "Security violation: Multiple statements or inline semicolons are not permitted."

    return True, ""

def enforce_limit(sql: str, limit: int = 100) -> str:
    """
    Enforces a LIMIT clause on SELECT queries to prevent unbounded result sets.
    """
    s = sql.strip().rstrip(";")
    
    if re.search(r"\blimit\b", s, re.IGNORECASE):
        return s + ";"
    
    if s.lower().startswith("select") or s.lower().startswith("with"):
        return s + f" LIMIT {limit};"
    
    return s + ";"
