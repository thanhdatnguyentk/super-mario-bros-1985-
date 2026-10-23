import fs from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function copyAndCompileDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue;
    const srcPath = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      copyAndCompileDir(srcPath, path.join(destDir, entry.name));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      const source = fs.readFileSync(srcPath, 'utf8');
      const jsCode = stripTypeScriptTypes(source, { mode: 'strip' }).replace(
        /from\s+(['"])([^'"]+)\.ts\1/g,
        'from $1$2.js$1'
      );
      const outPath = path.join(destDir, entry.name.replace(/\.ts$/, '.js'));
      fs.writeFileSync(outPath, jsCode, 'utf8');
    }
  }
}

fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

copyAndCompileDir(path.join(ROOT_DIR, 'src'), path.join(DIST_DIR, 'src'));

const indexHtml = fs
  .readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8')
  .replace('/src/main.ts', './src/main.js');
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8');

console.log('[SMB-1985] Production build written to dist/');
