import { escapeHtml, stackCardAttributes } from '../template-utils.mjs';
import { renderUsersBlock } from './users.mjs';

export function renderContext(section, context) {
    const usersBlock = section.embeddedUsers ? renderUsersBlock(section.embeddedUsers) : '';

    return `
        <section id="${escapeHtml(section.id)}" ${stackCardAttributes(context.stackIndex)}>
            <div class="project-stack-card__inner">
                <div class="project-stack-card__content mx-auto max-w-[70rem] px-5 pt-12 pb-8 sm:px-7 lg:px-12 lg:pt-16 lg:pb-10">
                    <div class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                        <div class="space-y-5">
                            <p class="font-mono text-eyebrow uppercase text-subtext">${escapeHtml(section.label)}</p>
                            <h2 class="max-w-3xl font-display text-displaysection font-bold [font-kerning:normal] [text-rendering:optimizeLegibility] text-ink">${escapeHtml(section.heading)}</h2>
                        </div>

                        <div class="border-l border-rule pl-6 lg:translate-x-3 lg:translate-y-4">
                            <p class="text-base leading-7 text-subtext">${escapeHtml(section.aside)}</p>
                        </div>
                    </div>
                    ${usersBlock}
                </div>
            </div>
        </section>`;
}
