import { escapeHtml, resolveAssetPath, stackCardAttributes } from '../template-utils.mjs';

const toneClasses = {
    gold: 'rotate-[-2deg] bg-note-gold hover:bg-[#f3e3a5]',
    lilac: 'rotate-[1.6deg] bg-note-lilac hover:bg-[#e8c8f8]',
    peach: 'rotate-[-1deg] bg-note-peach hover:bg-[#f6d4c7]'
};

export function renderOverview(section, context) {
    return `
        <section id="${escapeHtml(section.id)}" ${stackCardAttributes(context.stackIndex)} data-desktop-variant="${escapeHtml(section.desktopVariant ?? 'default')}" data-mobile-variant="${escapeHtml(section.mobileVariant ?? 'default')}">
            <div class="project-stack-card__inner">
                <div class="project-stack-card__content mx-auto grid max-w-[70rem] gap-10 px-5 py-12 sm:px-7 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-16">
                    <div class="space-y-5">
                        <div class="space-y-3">
                            <p class="font-mono text-eyebrow uppercase text-subtext">${escapeHtml(section.label)}</p>
                            <h2 class="font-display text-displaysubhead font-bold [font-kerning:normal] [text-rendering:optimizeLegibility] text-ink">${escapeHtml(section.heading)}</h2>
                        </div>

                        <div class="divide-y divide-rule">
                            ${section.items.map((item) => `<article class="grid gap-y-2 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start sm:gap-x-6"><p class="font-mono text-eyebrow uppercase text-subtext sm:pt-2">${escapeHtml(item.label)}</p><p class="max-w-[44rem] text-body text-ink">${escapeHtml(item.value)}</p></article>`).join('')}
                        </div>
                    </div>

                    <div class="project-overview-notes grid gap-4 self-start pt-1 lg:translate-x-12 xl:translate-x-16">
                        ${section.notes.map((note) => `<article class="${toneClasses[note.tone] ?? toneClasses.gold} rounded-[4px] border border-black/5 px-4 py-4 shadow-note transition duration-200 ease-out will-change-transform hover:-translate-y-1 hover:scale-[1.015] hover:shadow-soft"><p class="font-mono text-eyebrow uppercase text-ink/55">${escapeHtml(note.title)}</p><p class="mt-2 text-body text-ink">${escapeHtml(note.text)}</p></article>`).join('')}
                    </div>
                </div>
            </div>
        </section>`;
}
