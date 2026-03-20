import { escapeHtml, withBreaks, stackCardAttributes } from '../template-utils.mjs';

function processMediaMarkup(preset) {
    if (preset === 'panels') {
        return `<div class="grid h-full w-full content-center gap-3"><div class="h-10 rounded-[4px] bg-surface"></div><div class="grid grid-cols-[1.15fr_0.85fr] gap-3"><div class="rounded-[4px] bg-surface p-4"><div class="h-3 w-3/4 rounded-full bg-rule/60"></div><div class="mt-4 h-16 rounded-[4px] bg-rule/40"></div></div><div class="rounded-[4px] bg-surface p-4"><div class="h-3 w-2/3 rounded-full bg-rule/60"></div><div class="mt-4 h-16 rounded-[4px] bg-rule/40"></div></div></div><div class="h-24 rounded-[4px] bg-surface"></div></div>`;
    }

    if (preset === 'decision') {
        return `<div class="grid h-full w-full content-center gap-4"><div class="rounded-[4px] bg-surface p-4"><div class="flex items-center justify-between"><div class="h-3 w-24 rounded-full bg-rule/60"></div><div class="h-8 w-20 rounded-full bg-note-gold/70"></div></div><div class="mt-5 grid grid-cols-3 gap-3"><div class="h-20 rounded-[4px] bg-rule/30"></div><div class="h-20 rounded-[4px] bg-rule/40"></div><div class="h-20 rounded-[4px] bg-rule/30"></div></div></div></div>`;
    }

    return `<svg viewBox="0 0 520 360" class="h-full w-full" aria-hidden="true"><polygon points="260,20 410,70 380,320 260,290" fill="#d9d7d2"></polygon><polygon points="260,20 110,70 140,320 260,290" fill="#dfddd9"></polygon><polygon points="170,52 260,20 350,52 318,255 260,238 202,255" fill="#d3d1cd"></polygon></svg>`;
}

export function renderProcess(section, context) {
    const bgByPreset = {
        layers: 'bg-rule/20',
        panels: 'bg-rule/30',
        decision: 'bg-rule/25'
    };

    return `
        <section id="${escapeHtml(section.id)}" ${stackCardAttributes(context.stackIndex)} data-desktop-variant="${escapeHtml(section.desktopVariant ?? 'default')}" data-mobile-variant="${escapeHtml(section.mobileVariant ?? 'default')}">
            <div class="project-stack-card__inner">
                <div class="project-stack-card__content mx-auto max-w-[70rem] px-5 py-12 sm:px-7 lg:px-12 lg:py-16">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <p class="font-mono text-eyebrow uppercase text-subtext">${escapeHtml(section.eyebrow)}</p>
                        <p class="hidden font-mono text-tag uppercase tracking-[0.16em] text-subtext/75 lg:block">${escapeHtml(section.hint)}</p>
                    </div>

                    <div class="mt-6 process-stack" id="process-stack" data-active-card="none" data-ready="false">
                        ${section.cards.map((card) => `<article data-process-card data-process-origin="${escapeHtml(card.origin)}" class="process-card overflow-hidden rounded-[4px] border border-rule bg-surface shadow-soft" tabindex="0" role="button" aria-expanded="false" aria-label="Expand process card: ${escapeHtml(card.title.replaceAll('\n', ' '))}"><div class="process-card__inner"><div class="process-card__media flex items-center justify-center ${bgByPreset[card.mediaPreset] ?? bgByPreset.layers}">${processMediaMarkup(card.mediaPreset)}</div><div class="process-card__body p-6 sm:p-8"><div class="process-card__content"><div class="process-card__title-block"><p class="process-card__eyebrow font-mono text-eyebrow uppercase text-subtext">${escapeHtml(card.index)}</p><h3 class="mt-3 font-display text-title font-bold [font-kerning:normal] [text-rendering:optimizeLegibility] text-ink">${withBreaks(card.title)}</h3></div><p class="process-card__description text-subtext">${escapeHtml(card.description)}</p></div><p class="process-card__hint font-mono text-tag uppercase tracking-[0.16em] text-subtext/75">Open details</p></div></div></article>`).join('')}
                    </div>
                </div>
            </div>
        </section>`;
}
