"""Stamp a version onto every local script/style/import so browsers fetch fresh files after an update.
Usage: python3 tools/set_version.py 1.2
"""
import re, sys, pathlib
v = sys.argv[1]
root = pathlib.Path(__file__).resolve().parent.parent / 'precalc'
pat = re.compile(r"""((?:from\s+|src=|href=)['"])(\.{0,2}/?[\w./-]+?\.(?:js|css))(?:\?v=[\w.]+)?(['"])""")
for f in [root / 'index.html', *root.glob('js/**/*.js')]:
    s = f.read_text()
    t = pat.sub(lambda m: m.group(1) + m.group(2) + ('' if 'vendor/' in m.group(2) else '?v=' + v) + m.group(3), s)
    if f.name == 'config.js':
        t = re.sub(r"version: '[\w.]+'", f"version: '{v}'", t)
    if t != s:
        f.write_text(t); print('updated', f.relative_to(root.parent))
