import { escapeHtml, withBreaks, stackCardAttributes } from '../template-utils.mjs';

function iconSvg(icon) {
    if (icon === 'commuter') {
        return `<svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18h11"></path><path d="M8 18V8l4-3 4 3v10"></path><path d="M10 11h4"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>`;
    }

    if (icon === 'fleet') {
        return `<svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"></path><path d="M6 20V7h12v13"></path><path d="M9 10h1"></path><path d="M14 10h1"></path><path d="M9 14h1"></path><path d="M14 14h1"></path></svg>`;
    }

    return `<svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16h13l4-4"></path><path d="M5 16l1-5h8l2 5"></path><circle cx="8" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle><path d="M12 7h4"></path></svg>`;
}

export function renderUsersBlock(section) {
    return `
        <div class="mt-10 lg:mt-14" data-desktop-variant="${escapeHtml(section.desktopVariant ?? 'default')}" data-mobile-variant="${escapeHtml(section.mobileVariant ?? 'default')}">
            <div class="mb-7 lg:mb-9">
                <h2 class="font-sans text-displaysubhead font-bold text-ink md:whitespace-nowrap">${escapeHtml(section.heading)}</h2>
            </div>

            <div class="project-users-table">
                <div class="hidden gap-6 pb-4 lg:grid lg:grid-cols-[220px_0.72fr_1.15fr_0.9fr_1.05fr]">
                    <div></div>
                    <p class="font-mono text-eyebrow uppercase text-subtext">Daily Usage (in kms)</p>
                    <p class="text-center font-mono text-eyebrow uppercase text-subtext">Needs</p>
                    <p class="text-center font-mono text-eyebrow uppercase text-subtext">Pains</p>
                    <p class="text-center font-mono text-eyebrow uppercase text-subtext">Priorities</p>
                </div>
                ${section.users.map((user, index) => `<article class="project-user-row grid gap-6 ${index < section.users.length - 1 ? 'border-b border-rule' : ''} py-${index === 1 ? '4' : '2'} lg:items-center lg:grid-cols-[220px_0.72fr_1.15fr_0.9fr_1.05fr]"><div class="grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 justify-self-start"><div class="flex h-14 w-14 items-center justify-center text-accent">${iconSvg(user.icon)}</div><p class="min-w-0 font-display text-cardtitle font-bold [font-kerning:normal] [text-rendering:optimizeLegibility] text-ink">${escapeHtml(user.title)}</p></div><div><p class="font-mono text-eyebrow uppercase text-subtext lg:hidden">Daily Usage (in kms)</p><p class="mt-3 text-base leading-7 text-ink lg:mt-0 lg:pl-3">${escapeHtml(user.usage)}</p></div><div class="lg:text-left"><p class="font-mono text-eyebrow uppercase text-subtext lg:hidden">Needs</p><p class="mt-3 text-base leading-7 text-ink lg:mt-0">${withBreaks(user.needs)}</p></div><div class="lg:text-left"><p class="font-mono text-eyebrow uppercase text-subtext lg:hidden">Pains</p><p class="mt-3 text-base leading-7 text-ink lg:mt-0">${withBreaks(user.pains)}</p></div><div class="lg:text-left"><p class="font-mono text-eyebrow uppercase text-subtext lg:hidden">Priorities</p><p class="mt-3 text-base leading-7 text-ink lg:mt-0">${withBreaks(user.priorities)}</p></div></article>`).join('')}
            </div>
        </div>`;
}

export function renderUsers(section, context) {
    return `
        <section id="${escapeHtml(section.id)}" ${stackCardAttributes(context.stackIndex)} data-desktop-variant="${escapeHtml(section.desktopVariant ?? 'default')}" data-mobile-variant="${escapeHtml(section.mobileVariant ?? 'default')}">
            <div class="project-stack-card__inner">
                <div class="project-stack-card__content mx-auto max-w-[70rem] px-5 pt-7 pb-12 sm:px-7 lg:px-12 lg:pt-8 lg:pb-16">
                    ${renderUsersBlock(section)}
                </div>
            </div>
        </section>`;
}
