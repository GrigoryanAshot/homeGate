const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "firmware", "HomeGate", "webpage.h");
const delim = ")====";

function dump(name, file) {
  const text = fs.readFileSync(file, "utf8");
  if (text.includes(delim)) {
    throw new Error(`Delimiter found in ${file}`);
  }
  return `const char ${name}[] PROGMEM = R"====(${text})====";\n\n`;
}

const parts = [
  "#pragma once\n",
  "#include <pgmspace.h>\n\n",
  dump("APP_INDEX", path.join(root, "index.html")),
  dump("APP_CSS", path.join(root, "css", "styles.css")),
  dump("APP_JS", path.join(root, "js", "app.js")),
  dump("APP_MANIFEST", path.join(root, "manifest.json")),
];

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, parts.join(""), "utf8");
console.log(`Wrote ${out}`);
