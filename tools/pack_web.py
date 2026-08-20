from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "firmware" / "HomeGate" / "webpage.h"
DELIM = ")===="


def dump(var: str, text: str) -> str:
    if DELIM in text:
        raise SystemExit(f"Refusing to pack {var}: delimiter found in file")
    return f'const char {var}[] PROGMEM = R"====({text})====";\n\n'


files = {
    "APP_INDEX": ROOT / "index.html",
    "APP_CSS": ROOT / "css" / "styles.css",
    "APP_JS": ROOT / "js" / "app.js",
    "APP_MANIFEST": ROOT / "manifest.json",
}

parts = [
    "#pragma once\n",
    "#include <pgmspace.h>\n\n",
]
for var, path in files.items():
    parts.append(dump(var, path.read_text(encoding="utf-8")))

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("".join(parts), encoding="utf-8")
print(f"Wrote {OUT}")
