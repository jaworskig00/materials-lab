import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat, writeFile, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const pinned = {
  '@react-three/fiber@9.8.2': 'licenses/vendor/react-three-fiber-LICENSE.txt',
  'onnxruntime-web@1.31.1': 'licenses/vendor/onnxruntime-LICENSE.txt',
  'onnxruntime-common@1.31.1': 'licenses/vendor/onnxruntime-LICENSE.txt',
};
const folders = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], { encoding: 'utf8' }).trim().split('\n').slice(1);
const sections = new Map();
for (const folder of folders) {
  const metadata = JSON.parse(await readFile(path.join(folder, 'package.json'), 'utf8'));
  const id = `${metadata.name}@${metadata.version}`;
  if (sections.has(id)) continue;
  const names = (await readdir(folder)).filter(name => /^(license|licence|copying|notice|thirdpartynotices)/i.test(name)).sort();
  const notices = [];
  for (const name of names) {
    const file = path.join(folder, name);
    if ((await stat(file)).isFile()) notices.push(`${name}\n\n${await readFile(file, 'utf8')}`);
  }
  if (!notices.length && pinned[id]) notices.push(await readFile(pinned[id], 'utf8'));
  if (!notices.length && id === 'guid-typescript@1.0.9') {
    // The published package and its upstream commit contain no separate license file.
    // Preserve the actual declaration/author rather than inventing a copyright line.
    notices.push('No separate license text is shipped in this npm package. Published package metadata:\n' + JSON.stringify({ name: metadata.name, version: metadata.version, license: metadata.license, author: metadata.author, repository: metadata.repository }, null, 2) + '\nDeclared ISC terms: https://opensource.org/license/isc');
  }
  if (!notices.length) throw new Error(`Missing upstream notice for ${id}; review before distribution.`);
  sections.set(id, `${id}\nDeclared license: ${JSON.stringify(metadata.license)}\n\n${notices.join('\n\n')}`);
}
const header = 'MATERIALS LAB — THIRD-PARTY NOTICES\n\nGenerated from the pinned production dependency closure. Not every listed module is present in every tree-shaken bundle. Original license notices remain applicable. See NOTICE.md for source data and model license scope.\n';
const upstream = await readFile('licenses/vendor/onnxruntime-ThirdPartyNotices.txt', 'utf8');
const noticeText = header + '\n\n' + [...sections].sort(([a], [b]) => a.localeCompare(b)).map(([, text]) => text).join('\n\n' + '='.repeat(72) + '\n\n') + '\n\nONNX RUNTIME — COMPLETE UPSTREAM BUILD-VARIANT NOTICES\n\n' + upstream;
await writeFile('public/THIRD_PARTY_NOTICES.txt', noticeText.replace(/\r\n/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trimEnd() + '\n');
await mkdir('public/licenses', { recursive: true });
for (const [source, destination] of [['LICENSE', 'MIT.txt'], ['NOTICE.md', 'NOTICE.md'], ['licenses/CC-BY-4.0.txt', 'CC-BY-4.0.txt']]) await copyFile(source, `public/licenses/${destination}`);
console.log(`Retained notices for ${sections.size} production packages, plus ONNX Runtime build notices.`);
