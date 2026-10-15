"""
Scopes a standalone page's CSS to one studio template, so it can render inside
the editor, the phone preview and the live site without leaking:

- every selector is prefixed with the template's root class (.pm-dune …);
- :root and body rules apply to the root itself; html rules are dropped;
- viewport units become container units (vw -> cqw, svh/vh -> a cqw estimate),
  and @media (max-width/min-width …) becomes @container, as AGENTS.md asks;
- @keyframes are kept as they are.

    py -3 scripts/samples/scope-css.py <page.html|style.css> <root-class> > out.css

Written for the premium agent templates (Monolith, Tide, Blueprint, Dune, Atlas).
Position: fixed rules are left for the template to adjust by hand.
"""

import re
import sys


def read_css(path):
    text = open(path, encoding="utf-8").read()
    match = re.search(r"<style>(.*?)</style>", text, re.S)
    return match.group(1) if match else text


def split_blocks(css):
    """Top-level (prelude, body) pairs, handling nested braces."""
    out, i, n = [], 0, len(css)
    while i < n:
        start = css.find("{", i)
        if start == -1:
            break
        prelude = css[i:start].strip()
        depth, j = 1, start + 1
        while j < n and depth:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
            j += 1
        out.append((prelude, css[start + 1 : j - 1]))
        i = j
    return out


def units(body):
    body = re.sub(r"(\d*\.?\d+)vw\b", r"\1cqw", body)
    body = re.sub(r"(\d*\.?\d+)s?vh\b", lambda m: f"{float(m.group(1)) * 0.62:.1f}cqw", body)
    return body


def scope_selector(selector, root):
    parts = []
    for part in selector.split(","):
        part = part.strip()
        if not part:
            continue
        if part in (":root", "body", "html"):
            parts.append(root)
        elif part == "*":
            parts.append(f"{root}, {root} *")
        elif part.startswith(".gl-ready"):
            parts.append(root + part.replace(".gl-ready", ".gl-ready", 1))
        else:
            parts.append(f"{root} {part}")
    return ", ".join(parts)


def scope(css, root):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    lines = []
    for prelude, body in split_blocks(css):
        if prelude.startswith("@keyframes"):
            lines.append(f"{prelude}{{{body}}}")
        elif prelude.startswith("@media") and ("width" in prelude):
            inner = scope(body, root)
            lines.append(f"{prelude.replace('@media', '@container', 1)}{{{inner}}}")
        elif prelude.startswith("@"):
            inner = scope(body, root)
            lines.append(f"{prelude}{{{inner}}}")
        elif prelude.strip() == "html":
            continue
        else:
            lines.append(f"{scope_selector(prelude, root)}{{{units(body.strip())}}}")
    return "\n".join(lines)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(scope(read_css(sys.argv[1]), sys.argv[2]))
