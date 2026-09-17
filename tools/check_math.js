// Kiểm tra mọi công thức \( \) và \[ \] có render được bằng KaTeX không.
// Cách dùng:  node tools/check_math.js                (mọi trang lop-N/*.html)
//             node tools/check_math.js <file.html>…   (chỉ các file chỉ định, vd. partial)
// Cần 1 lần:  mkdir -p .cache/node && cd .cache/node && npm i katex@0.16.11
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const load = require("module").createRequire(path.join(ROOT, ".cache/node/package.json"));
const katex = load("katex");
load("katex/contrib/mhchem");

const MATH = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
const decode = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
let errors = 0, total = 0;

function checkFile(file) {
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(MATH)) {
    total++;
    const display = m[1] !== undefined;
    const tex = decode(display ? m[1] : m[2]);
    try {
      katex.renderToString(tex, { throwOnError: true, strict: false, displayMode: display });
    } catch (e) {
      errors++;
      const line = html.slice(0, m.index).split("\n").length;
      console.log(`${path.relative(ROOT, file)}:${line}  ${e.message}\n    ${tex.trim()}`);
    }
  }
}

const targets = process.argv.slice(2).map(f => path.resolve(f));
if (!targets.length) {
  for (const dir of fs.readdirSync(ROOT).filter(d => /^lop-\d+$/.test(d))) {
    for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith(".html"))) {
      targets.push(path.join(ROOT, dir, f));
    }
  }
}
targets.forEach(checkFile);

console.log(`${total} công thức, ${errors} lỗi`);
process.exit(errors ? 1 : 0);
