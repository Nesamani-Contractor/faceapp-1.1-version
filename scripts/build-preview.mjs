// Builds a self-contained web preview of the app into preview/dist:
// the Expo web bundle, only the fonts the app uses, and a phone-frame page.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = process.cwd();
const exportDir = join(root, 'dist');
const out = join(root, 'preview', 'dist');

execSync('npx expo export --platform web --output-dir dist', { stdio: 'inherit', env: { ...process.env, CI: '1' } });

const html = readFileSync(join(exportDir, 'index.html'), 'utf8');
const bundlePath = html.match(/src="\/(_expo\/static\/js\/web\/[^"]+\.js)"/)[1];
let bundle = readFileSync(join(exportDir, bundlePath), 'utf8');

// Keep: fonts registered in App.tsx, Ionicons, react-navigation images.
const USED = [/PlayfairDisplay_(400Regular|400Regular_Italic|500Medium|500Medium_Italic|600SemiBold)\./, /Jost_(300Light|400Regular|500Medium|600SemiBold)\./, /JetBrainsMono_(400Regular|500Medium)\./, /Ionicons\./, /@react-navigation\//];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
let kept = 0;
for (const file of walk(join(exportDir, 'assets'))) {
  const rel = relative(exportDir, file);
  if (!USED.some((re) => re.test(rel))) continue;
  mkdirSync(dirname(join(out, rel)), { recursive: true });
  cpSync(file, join(out, rel));
  kept++;
}

// Absolute /assets/ URLs → relative, so the preview works from any sub-path.
bundle = bundle.replaceAll('"/assets/', '"assets/');
writeFileSync(join(out, 'app.js'), bundle);
const shell = readFileSync(join(root, 'preview', 'shell.html'), 'utf8');
// artifact.html: the bare page body (the claude.ai artifact host adds the document skeleton).
writeFileSync(join(out, 'artifact.html'), shell);
// index.html: a complete document for serving locally.
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body style="margin:0">\n${shell}\n</body>\n</html>\n`
);
if (existsSync(join(exportDir, 'favicon.ico'))) cpSync(join(exportDir, 'favicon.ico'), join(out, 'favicon.ico'));

console.log(`preview/dist ready — app.js + ${kept} assets. Serve it with: npx serve preview/dist`);
