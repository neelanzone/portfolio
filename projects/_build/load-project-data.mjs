import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, '..', '_data');
const projectsDataDir = path.join(dataDir, 'projects');
const supportedSectionTypes = new Set(['hero', 'overview', 'context', 'users', 'process', 'outcomes', 'gallery']);

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function readJson(filePath) {
    const raw = await readFile(filePath, 'utf8');
    const clean = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;

    try {
        return JSON.parse(clean);
    } catch (error) {
        throw new Error(`Invalid JSON in ${path.relative(dataDir, filePath)}: ${error.message}`);
    }
}

function ensureString(value, label) {
    assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a non-empty string.`);
}

function ensureOptionalString(value, label) {
    if (value !== null && value !== undefined) {
        ensureString(value, label);
    }
}

function ensureArray(value, label) {
    assert(Array.isArray(value), `${label} must be an array.`);
}

function validateImage(image, label) {
    assert(image && typeof image === 'object', `${label} must be an object.`);
    ensureString(image.src, `${label}.src`);
    ensureString(image.alt, `${label}.alt`);
}

function validateSeo(seo, label) {
    assert(seo && typeof seo === 'object', `${label} must be an object.`);
    ensureString(seo.title, `${label}.title`);
    ensureString(seo.description, `${label}.description`);
    ensureOptionalString(seo.socialImage, `${label}.socialImage`);
}

function validateHero(section, label) {
    ensureArray(section.tags, `${label}.tags`);
    ensureString(section.title, `${label}.title`);
    ensureArray(section.summary, `${label}.summary`);
    ensureArray(section.meta, `${label}.meta`);
    section.meta.forEach((item, index) => {
        ensureString(item.label, `${label}.meta[${index}].label`);
        ensureString(item.value, `${label}.meta[${index}].value`);
    });
    validateImage(section.media, `${label}.media`);
}

function validateOverview(section, label) {
    ensureString(section.label, `${label}.label`);
    ensureString(section.heading, `${label}.heading`);
    ensureArray(section.items, `${label}.items`);
    ensureArray(section.notes, `${label}.notes`);
}

function validateContext(section, label) {
    ensureString(section.label, `${label}.label`);
    ensureString(section.heading, `${label}.heading`);
    ensureString(section.aside, `${label}.aside`);
}

function validateUsers(section, label) {
    ensureString(section.heading, `${label}.heading`);
    ensureArray(section.users, `${label}.users`);
}

function validateProcess(section, label) {
    ensureString(section.eyebrow, `${label}.eyebrow`);
    ensureString(section.hint, `${label}.hint`);
    ensureArray(section.cards, `${label}.cards`);
}

function validateOutcomes(section, label) {
    ensureString(section.label, `${label}.label`);
    validateImage(section.image, `${label}.image`);
    ensureArray(section.metrics, `${label}.metrics`);
}

function validateGallery(section, label) {
    ensureArray(section.items, `${label}.items`);
}

function validateSection(section, index, slug) {
    const label = `project "${slug}" section[${index}]`;
    assert(section && typeof section === 'object', `${label} must be an object.`);
    ensureString(section.type, `${label}.type`);
    assert(supportedSectionTypes.has(section.type), `${label}.type "${section.type}" is not supported.`);
    ensureString(section.id, `${label}.id`);
    ensureOptionalString(section.navLabel, `${label}.navLabel`);
    ensureOptionalString(section.desktopVariant, `${label}.desktopVariant`);
    ensureOptionalString(section.mobileVariant, `${label}.mobileVariant`);

    if (section.type === 'hero') validateHero(section, label);
    if (section.type === 'overview') validateOverview(section, label);
    if (section.type === 'context') validateContext(section, label);
    if (section.type === 'users') validateUsers(section, label);
    if (section.type === 'process') validateProcess(section, label);
    if (section.type === 'outcomes') validateOutcomes(section, label);
    if (section.type === 'gallery') validateGallery(section, label);
}

function validateProject(project) {
    assert(project && typeof project === 'object', 'Each project file must export an object.');
    ensureString(project.slug, 'project.slug');
    ensureString(project.title, 'project.title');
    ensureString(project.theme, `project "${project.slug}".theme`);
    ensureString(project.colorMode, `project "${project.slug}".colorMode`);
    validateSeo(project.seo, `project "${project.slug}".seo`);
    ensureArray(project.sections, `project "${project.slug}".sections`);

    const ids = new Set();
    project.sections.forEach((section, index) => {
        validateSection(section, index, project.slug);
        assert(!ids.has(section.id), `project "${project.slug}" has duplicate section id "${section.id}".`);
        ids.add(section.id);
    });
}

function validateSite(site) {
    assert(site && typeof site === 'object', 'site.json must contain an object.');
    ensureString(site.owner, 'site.owner');
    ensureString(site.copyrightOwner, 'site.copyrightOwner');
    ensureString(site.year, 'site.year');
    ensureString(site.homeHref, 'site.homeHref');
    ensureArray(site.socialLinks, 'site.socialLinks');
    ensureArray(site.moreProjects, 'site.moreProjects');
}

export async function loadSiteData() {
    const site = await readJson(path.join(dataDir, 'site.json'));
    validateSite(site);
    return site;
}

export async function loadProjectData() {
    const files = (await readdir(projectsDataDir))
        .filter((file) => file.endsWith('.json'))
        .sort((left, right) => left.localeCompare(right));

    assert(files.length > 0, 'No project JSON files were found in projects/_data/projects.');

    const projects = [];
    const slugs = new Set();

    for (const file of files) {
        const project = await readJson(path.join(projectsDataDir, file));
        validateProject(project);
        assert(!slugs.has(project.slug), `Duplicate project slug "${project.slug}".`);
        slugs.add(project.slug);
        projects.push(project);
    }

    return projects;
}


