import { renderHero } from './sections/hero.mjs';
import { renderOverview } from './sections/overview.mjs';
import { renderContext } from './sections/context.mjs';
import { renderUsers } from './sections/users.mjs';
import { renderProcess } from './sections/process.mjs';
import { renderOutcomes } from './sections/outcomes.mjs';
import { renderGallery } from './sections/gallery.mjs';

const sectionRenderers = {
    hero: renderHero,
    overview: renderOverview,
    context: renderContext,
    users: renderUsers,
    process: renderProcess,
    outcomes: renderOutcomes,
    gallery: renderGallery
};

export function renderSection(section, context) {
    const renderer = sectionRenderers[section.type];
    return renderer ? renderer(section, context) : '';
}
