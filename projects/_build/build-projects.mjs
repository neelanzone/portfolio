import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProjectPage } from '../_templates/render-project-page.mjs';
import { syncReferenceAssets } from './sync-reference-assets.mjs';
import { loadProjectData, loadSiteData } from './load-project-data.mjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectsDir = path.resolve(currentDir, '..');

async function buildProject(project, site) {
    const outputDir = path.join(projectsDir, project.slug);
    const html = renderProjectPage(project, site);

    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

async function main() {
    await syncReferenceAssets();

    const [site, projects] = await Promise.all([
        loadSiteData(),
        loadProjectData()
    ]);

    for (const project of projects) {
        await buildProject(project, site);
    }

    console.log(`Built ${projects.length} project page(s).`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
