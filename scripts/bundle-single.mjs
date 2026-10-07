// Builds a single-file HTML (inline CSS + bundled script) from a dist folder.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
const [,, distDir, outFile, esbuild='/opt/npm-tools/node_modules/.bin/esbuild'] = process.argv;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unbrik-bundle-'));
for (const f of fs.readdirSync(distDir)) {
  if (!f.endsWith('.js')) continue;
  let src = fs.readFileSync(path.join(distDir, f), 'utf8');
  src = src.replace(/from '\.\/([a-z-]+\.js)\?v=[^']*'/g, "from './$1'");
  fs.writeFileSync(path.join(tmp, f), src);
}
const js = execFileSync(esbuild, [path.join(tmp, 'app.js'), '--bundle', '--format=iife', '--target=es2022', '--charset=utf8', '--legal-comments=none'], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(distDir, 'style.css'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="style\.css[^"]*">/, () => `<style>\n${css}\n</style>`);
html = html.replace(/<script type="module" src="app\.js[^"]*"><\/script>/, () => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
if (html.includes('style.css') || html.includes('app.js?')) throw new Error('asset references remain');
fs.writeFileSync(outFile, html);
fs.rmSync(tmp, {recursive: true, force: true});
console.log('wrote', outFile, (fs.statSync(outFile).size/1024).toFixed(0)+'KB');
