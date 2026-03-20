import { absoluteUrl, escapeHtml, resolveAssetPath, resolveProjectLink } from './template-utils.mjs';

function renderMetaTags(project, site) {
    const title = project.seo?.title ?? `${project.title} | ${site.owner}`;
    const description = project.seo?.description ?? '';
    const canonicalUrl = absoluteUrl(site.siteUrl, `projects/${project.slug}/`);
    const socialImage = project.seo?.socialImage
        ? absoluteUrl(site.siteUrl, project.seo.socialImage)
        : '';

    return [
        `<title>${escapeHtml(title)}</title>`,
        `<meta name="description" content="${escapeHtml(description)}">`,
        canonicalUrl ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">` : '',
        '<meta property="og:type" content="website">',
        `<meta property="og:title" content="${escapeHtml(title)}">`,
        `<meta property="og:description" content="${escapeHtml(description)}">`,
        canonicalUrl ? `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">` : '',
        socialImage ? `<meta property="og:image" content="${escapeHtml(socialImage)}">` : '',
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:title" content="${escapeHtml(title)}">`,
        `<meta name="twitter:description" content="${escapeHtml(description)}">`,
        socialImage ? `<meta name="twitter:image" content="${escapeHtml(socialImage)}">` : ''
    ].filter(Boolean).join('\n    ');
}

function renderNav(project) {
    const navItems = project.sections
        .filter((section) => section.navLabel)
        .map((section) => ({ id: section.id, label: section.navLabel }));

    navItems.push({ id: 'more-projects', label: 'More Projects' });

    const desktopLinks = navItems.map((item, index) => {
        const textClass = index === 0 ? 'text-ink' : 'text-subtext';
        return `<a href="#${escapeHtml(item.id)}" class="nav-link font-mono text-eyebrow uppercase ${textClass} transition-colors hover:text-ink">${escapeHtml(item.label)}</a>`;
    }).join('\n                ');

    const mobileLinks = navItems.map((item, index) => {
        const textClass = index === 0 ? 'text-ink' : 'text-subtext';
        return `<a href="#${escapeHtml(item.id)}" class="font-mono text-eyebrow uppercase ${textClass}">${escapeHtml(item.label)}</a>`;
    }).join('\n                ');

    return { desktopLinks, mobileLinks };
}

export function renderHeader(project, site, toRoot) {
    const { desktopLinks, mobileLinks } = renderNav(project);
    const homeHref = `${toRoot}${site.homeHref}`;

    return `
    <div class="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 bg-gradient-to-b from-canvas via-canvas/90 to-transparent"></div>

    <header class="page-navbar fixed inset-x-0 top-0 z-50 border-b border-[color:var(--nav-border)] bg-[color:var(--nav-surface)] backdrop-blur-xl">
        <div class="relative flex w-full items-center justify-between gap-5 px-5 py-1.5 sm:px-7 lg:px-12">
            <a href="${escapeHtml(homeHref)}" class="brand-logo rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" aria-label="Back to homepage">
                <img src="${escapeHtml(resolveAssetPath('Assets/identity-motion-active.gif', toRoot))}" alt="Neel logo" class="logo-default" width="90" height="90">
                <img src="${escapeHtml(resolveAssetPath('Assets/identity-motion-hover.gif', toRoot))}" alt="" class="logo-hover" width="90" height="90" aria-hidden="true">
            </a>

            <nav class="hidden items-center gap-6 lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2" aria-label="Section navigation">
                ${desktopLinks}
            </nav>

            <div class="hidden items-center gap-2 lg:flex">
                <button type="button" data-theme-toggle class="project-theme-toggle" aria-label="Toggle Dark Mode"><span class="project-theme-toggle__cap" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg></span></button>
            </div>

            <div class="flex items-center gap-2 lg:hidden">
                <button type="button" data-theme-toggle class="project-theme-toggle" aria-label="Toggle Dark Mode"><span class="project-theme-toggle__cap" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg></span></button>
                <button id="mobile-menu-button" type="button" class="inline-flex items-center justify-center rounded-full bg-[color:var(--toggle-surface)] px-4 py-1.5 font-mono text-eyebrow uppercase text-ink transition hover:bg-[color:var(--toggle-surface-hover)]" aria-expanded="false" aria-controls="mobile-menu">Menu</button>
            </div>
        </div>

        <nav id="mobile-menu" class="hidden rounded-[4px] border-t border-[color:var(--nav-border)] bg-canvas px-5 py-4 sm:px-7 lg:hidden" aria-label="Mobile section navigation">
            <div class="flex flex-col gap-3">
                ${mobileLinks}
            </div>
        </nav>
    </header>`;
}

function splitCardMeta(entry) {
    const raw = String(entry.type ?? '').trim();
    const parts = raw.split(',');
    const dateLabel = parts.length > 1 ? parts.pop().trim() : '';

    const explicitLabelsBySlug = {
        'ludo-reimagined': ['Game Design'],
        'managed-asset-search': ['IA', 'Taxonomy'],
        'venture-hub': ['System Design']
    };

    if (explicitLabelsBySlug[entry.slug]) {
        return {
            typeLabels: explicitLabelsBySlug[entry.slug],
            dateLabel
        };
    }

    const typeLabel = parts.join(',').trim() || raw;
    const mappedLabels = {
        'Game Design & Development': ['Game Design', 'Game Dev'],
        'UX/UI & System Design': ['UX/UI', 'System Design']
    };

    const typeLabels = mappedLabels[typeLabel]
        ?? typeLabel
            .split(/\s*(?:&|and)\s*/i)
            .map((label) => label.trim())
            .filter(Boolean);

    return { typeLabels, dateLabel };
}

export function renderMoreProjectsBlock(project, site, toRoot) {
    return `
        <div id="more-projects" class="project-tail-block pt-5 lg:pt-6">
            <div class="project-carousel-section" data-current-project="${escapeHtml(project.slug)}">
                <div class="project-carousel-space" data-project-space aria-hidden="true"></div>
                <div class="project-carousel-shell">
                    <div class="project-carousel-heading">
                        <p class="project-carousel-eyebrow font-mono text-eyebrow uppercase">More Projects</p>
                    </div>
                    <div class="project-carousel" data-project-carousel tabindex="0" role="region" aria-label="More projects carousel">
                        <button class="project-carousel-control prev" type="button" aria-label="Previous project">&lt;</button>
                        <button class="project-carousel-control next" type="button" aria-label="Next project">&gt;</button>
                        <div class="project-carousel-track">
                            ${site.moreProjects.map((entry) => {
                                const href = resolveProjectLink(entry.link, project.slug, toRoot);
                                const current = entry.slug === project.slug;
                                const { typeLabels, dateLabel } = splitCardMeta(entry);
                                const description = entry.description
                                    ? `<p class="project-carousel-card__description">${escapeHtml(entry.description)}</p>`
                                    : '';
                                const typePills = typeLabels
                                    .map((label) => `<span class="project-carousel-card__pill project-carousel-card__pill--type">${escapeHtml(label)}</span>`)
                                    .join('');
                                const pills = `<div class="project-carousel-card__pills"><div class="project-carousel-card__pill-group">${typePills}</div>${dateLabel ? `<span class="project-carousel-card__pill project-carousel-card__pill--date">${escapeHtml(dateLabel)}</span>` : ''}</div>`;
                                return `<article class="project-carousel-card" data-project-slug="${escapeHtml(entry.slug)}"><a class="project-carousel-card__link" href="${escapeHtml(href)}"${current ? ' aria-current="page"' : ''}><div class="project-carousel-card__shell"><div class="project-carousel-card__face project-carousel-card__face--back" aria-hidden="true"></div><div class="project-carousel-card__face project-carousel-card__face--front">${pills}<div class="project-carousel-card__image"><img src="${escapeHtml(resolveAssetPath(entry.image.src, toRoot))}" alt="${escapeHtml(entry.image.alt)}" loading="lazy" decoding="async"></div><div class="project-carousel-card__meta"><h3 class="project-carousel-card__title">${escapeHtml(entry.title)}</h3>${description}</div></div></div></a></article>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

export function renderFooterBlock(site) {
    return `
        <footer class="project-tail-footer border-t border-rule/80 mt-4 pt-4 lg:mt-5 lg:pt-5">
            <div class="flex max-w-[70rem] flex-col gap-4 text-subtext lg:flex-row lg:items-center lg:justify-between">
                <p class="font-mono text-tag uppercase">&copy; ${escapeHtml(site.year)} ${escapeHtml(site.copyrightOwner)}. All rights reserved.</p>
                <div class="flex items-center gap-6 font-mono text-tag uppercase">
                    ${site.socialLinks.map((link) => `<a href="${escapeHtml(link.href)}" class="transition hover:text-ink">${escapeHtml(link.label)}</a>`).join('\n                    ')}
                </div>
            </div>
        </footer>`;
}

export { renderMetaTags };



