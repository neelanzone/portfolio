import { escapeHtml, resolveAssetPath, stackCardAttributes } from '../template-utils.mjs';

export function renderOutcomes(section, context) {
    return `
        <section id="${escapeHtml(section.id)}" ${stackCardAttributes(context.stackIndex)}>
            <div class="project-stack-card__inner">
                <div class="project-stack-card__content mx-auto max-w-[70rem] px-5 pt-12 pb-4 sm:px-7 lg:px-12 lg:pt-16 lg:pb-2">
                    <p class="mb-4 font-mono text-eyebrow uppercase text-subtext">${escapeHtml(section.label)}</p>

                    <div class="overflow-hidden rounded-[4px] border border-rule bg-surface shadow-soft">
                        <div class="px-4 pb-4 sm:px-6 sm:pb-6">
                            <div class="relative h-[60vh] overflow-hidden rounded-[4px] border border-rule bg-rule/30 lg:relative lg:left-1/2 lg:w-[108%] lg:-translate-x-1/2">
                                ${section.image.src.endsWith('.mp4') || section.image.src.endsWith('.webm')
                                    ? `<video autoplay loop muted playsinline class="block h-full min-h-full w-full min-w-full scale-[1.18] object-cover object-center" preload="none" aria-hidden="true"><source src="${escapeHtml(resolveAssetPath(section.image.src, context.toRoot))}" type="video/mp4"></video>`
                                    : `<img src="${escapeHtml(resolveAssetPath(section.image.src, context.toRoot))}" alt="${escapeHtml(section.image.alt)}" class="block h-full min-h-full w-full min-w-full scale-[1.18] object-cover object-center" loading="lazy" decoding="async">`}
                            </div>
                        </div>

                        <div class="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
                            ${section.metrics.map((metric) => `<article class="bg-surface px-5 py-4"><p class="font-mono text-eyebrow uppercase text-subtext">${escapeHtml(metric.label)}</p><p class="mt-3 font-sans text-stat font-bold text-ink">${escapeHtml(metric.value)}</p><p class="mt-2 text-base leading-7 text-subtext">${escapeHtml(metric.text)}</p></article>`).join('')}
                        </div>
                    </div>

                    ${context.tailMarkup ?? ''}
                </div>
            </div>
        </section>`;
}

