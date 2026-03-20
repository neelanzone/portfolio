import { escapeHtml, resolveAssetPath, stackCardAttributes } from '../template-utils.mjs';

export function renderHero(section, context) {
    const summary = Array.isArray(section.summary) ? section.summary.join(' ') : section.summary;

    return `
        <section id="${escapeHtml(section.id)}" ${stackCardAttributes(context.stackIndex)} data-desktop-variant="${escapeHtml(section.desktopVariant ?? 'default')}" data-mobile-variant="${escapeHtml(section.mobileVariant ?? 'default')}">
            <div class="project-stack-card__inner">
                <div class="project-stack-card__content mx-auto flex max-w-[70rem] flex-col gap-8 px-5 py-4 sm:px-7 lg:px-12 lg:py-6">
                    <div class="project-hero-grid grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                        <div class="space-y-6">
                            <div class="space-y-3">
                                <div class="flex flex-wrap gap-2">
                                    ${section.tags.map((tag) => `<span class="inline-flex items-center rounded-full border border-rule bg-surface px-3 py-1 font-mono text-tag uppercase text-subtext">${escapeHtml(tag)}</span>`).join('\n                                ')}
                                </div>
                                <h1 class="max-w-xl font-display text-displayhero font-bold [font-kerning:normal] [text-rendering:optimizeLegibility] text-ink">${escapeHtml(section.title)}</h1>
                            </div>

                            <div class="grid max-w-2xl gap-4 sm:grid-cols-2">
                                ${section.meta.map((item) => `<div class="space-y-1"><p class="font-mono text-eyebrow uppercase text-subtext">${escapeHtml(item.label)}</p><p class="text-body text-ink">${escapeHtml(item.value)}</p></div>`).join('')}
                            </div>
                        </div>

                        <div class="project-hero-summary lg:flex lg:min-h-full lg:items-end">
                            <p class="max-w-lg text-lead text-subtext lg:border-l lg:border-rule lg:pl-6">${escapeHtml(summary)}</p>
                        </div>
                    </div>

                    <figure class="project-hero-media h-[40vh] w-full overflow-hidden rounded-[4px] border border-rule bg-surface shadow-soft">
                        <img src="${escapeHtml(resolveAssetPath(section.media.src, context.toRoot))}" alt="${escapeHtml(section.media.alt)}" class="h-full w-full object-cover" loading="eager" decoding="async">
                    </figure>
                </div>
            </div>
        </section>`;
}
