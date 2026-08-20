const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "firmware", "HomeGate", "webpage.h");
const delim = ")====";

function dump(name, text) {
  if (text.includes(delim)) {
    throw new Error(`Delimiter found while packing ${name}`);
  }
  return `const char ${name}[] PROGMEM = R"====(${text})====";\n\n`;
}

const css = fs.readFileSync(path.join(root, "css", "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const manifest = fs.readFileSync(path.join(root, "manifest.json"), "utf8");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");

// One-file page for ESP/tunnel (avoids parallel CSS/JS requests that time out)
html = html
  .replace(
    /<link\s+rel="stylesheet"\s+href="css\/styles\.css"\s*\/>/,
    `<style>\n${css}\n</style>`
  )
  .replace(
    /<script\s+src="js\/app\.js"><\/script>/,
    `<script>\n${js}\n</script>`
  )
  .replace(/\s*<link\s+rel="manifest"\s+href="manifest\.json"\s*\/>/, "");

const parts = [
  "#pragma once\n",
  "#include <pgmspace.h>\n\n",
  dump("APP_INDEX", html),
  dump("APP_CSS", css),
  dump("APP_JS", js),
  dump("APP_MANIFEST", manifest),
];

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, parts.join(""), "utf8");
console.log(`Wrote ${out} (inlined CSS+JS into APP_INDEX)`);
