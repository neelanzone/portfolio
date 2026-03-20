import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..', '..');
const sharedDir = path.resolve(rootDir, 'projects', '_shared');
const referenceTemplatePath = path.resolve(rootDir, 'design-project-template-desktop.html');

function extractInlineScripts(source) {
    return [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1].trim());
}

function extractInlineStyle(source) {
    const match = source.match(/<style>([\s\S]*?)<\/style>/);
    return match ? match[1].trim() : '';
}

export async function syncReferenceAssets() {
    const source = await readFile(referenceTemplatePath, 'utf8');
    const scripts = extractInlineScripts(source);
    const styles = extractInlineStyle(source);

    if (scripts.length < 3 || !styles) {
        throw new Error('Could not extract the expected inline assets from design-project-template-desktop.html.');
    }

    const tailwindConfig = scripts[0];
    const projectPageScript = `${scripts[1]}\n\n${scripts[2]}`.trim();

    await mkdir(sharedDir, { recursive: true });
    await writeFile(path.join(sharedDir, 'tailwind-config.js'), `/* Generated from design-project-template-desktop.html */\n${tailwindConfig}\n`, 'utf8');
    await writeFile(path.join(sharedDir, 'project-reference.css'), `/* Generated from design-project-template-desktop.html */\n${styles}\n`, 'utf8');
    await writeFile(path.join(sharedDir, 'project-page.js'), `/* Generated from design-project-template-desktop.html */\n${projectPageScript}\n`, 'utf8');
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
    syncReferenceAssets().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
