"""Generate original algorithm prompts with checked examples."""
import json
from pathlib import Path

FOOTER = (
    "Use the language of the editor. A correct result for the stated rules is what a reviewer grades. "
    "State the approach in a short comment if the code is not obvious. These prompts were written for this bank. "
    "They are not items from another site."
)
problems = []

def show(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, str):
        return json.dumps(value)
    if isinstance(value, float):
        if value == int(value):
            return str(int(value)) if abs(value) < 1e15 else repr(value)
        return repr(round(value, 6)) if abs(value) < 1 else repr(value)
    return json.dumps(value)

def add(diff, key, title, sig, task, call, value):
    problems.append({
        "key": key,
        "difficulty": diff,
        "title": title,
        "prompt": f"{title}\n\nWrite `{sig}`.\n\n{task}\n\nExample\n{call} returns {show(value)}.\n\n{FOOTER}",
    })

