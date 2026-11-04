// Reads a JSON array of strings on stdin; prints indices whose $..$ / $$..$$ math KaTeX can't render.
const path = require('path');
const katex = require(path.join(__dirname, '..', 'web', 'node_modules', 'katex'));
try { require(path.join(__dirname, '..', 'web', 'node_modules', 'katex', 'contrib', 'mhchem')); } catch (e) {}
const items = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const bad = [];
items.forEach((s, i) => {
  for (const m of s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g)) {
    try { katex.renderToString(m[1] ?? m[2], { throwOnError: true, displayMode: !!m[1] }); }
    catch (e) { bad.push(i); break; }
  }
});
process.stdout.write(JSON.stringify(bad));
