import { escapeHtml, resolveAssetPath, stackCardAttributes } from '../template-utils.mjs';

export function renderGallery(section, context) {
    return `
        <section id="${escapeHtml(section.id)}" ${stackCardAttributes(context.stackIndex)} data-desktop-variant="${escapeHtml(section.desktopVariant ?? 'grid')}" data-mobile-variant="${escapeHtml(section.mobileVariant ?? 'stacked')}">
            <div class="project-stack-card__inner">
                <div class="project-stack-card__content mx-auto max-w-[70rem] px-5 py-12 sm:px-7 lg:px-12 lg:py-16">
                    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div class="space-y-3">
                            <p class="font-mono text-eyebrow uppercase text-subtext">${escapeHtml(section.label ?? 'Gallery')}</p>
                            <h2 class="font-display text-displaysubhead font-bold [font-kerning:normal] [text-rendering:optimizeLegibility] text-ink">${escapeHtml(section.heading ?? 'Selected frames')}</h2>
                        </div>
                        ${section.intro ? `<p class="max-w-xl text-base leading-7 text-subtext">${escapeHtml(section.intro)}</p>` : ''}
                    </div>

                    <div class="project-gallery mt-8">
                        ${section.items.map((item) => `<figure class="project-gallery__item" data-span="${escapeHtml(item.span ?? 'default')}"><div class="project-gallery__frame"><img src="${escapeHtml(resolveAssetPath(item.src, context.toRoot))}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async"></div>${item.caption ? `<figcaption class="project-gallery__caption">${escapeHtml(item.caption)}</figcaption>` : ''}</figure>`).join('')}
                    </div>
                </div>
            </div>
        </section>`;
}
