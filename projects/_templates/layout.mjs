import sharedSidebarTemplate from '../../shared/sidebar-template.js';
import { absoluteUrl, escapeHtml, resolveAssetPath, resolveProjectLink } from './template-utils.mjs';

const { renderSidebar, renderSidebarMobileMenuButton } = sharedSidebarTemplate;

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

function getProjectNavItems(project, options = {}) {
    const includeTail = options.includeTail ?? project.customTemplate !== 'ludo-bento';
    const items = project.sections
        .filter((section) => section.navLabel)
        .map((section) => ({ id: section.id, label: section.navLabel }));

    if (includeTail) {
        items.push({ id: 'more-projects', label: 'More' });
    }

    return items;
}

function getProjectSidebarCopy(project) {
    const heroSection = project.sections.find((section) => section.type === 'hero');
    const roles = ['Designer', 'UX', 'Graphic'];
    const summaryLines = Array.isArray(heroSection?.summary)
        ? heroSection.summary.map((line) => String(line).trim()).filter(Boolean)
        : [];
    const brief = summaryLines[0] || project.seo?.description || '';

    return {
        roles,
        brief
    };
}

function renderSectionPills(project) {
    const pillItems = getProjectNavItems(project);

    const pills = pillItems.map((item, index) => {
        const activeClass = index === 0 ? ' is-active' : '';
        return `<a href="#${escapeHtml(item.id)}" class="section-pill${activeClass}" data-section="${escapeHtml(item.id)}" data-section-nav-link>${escapeHtml(item.label)}</a>`;
    }).join('\n                ');

    return `
        <div id="section-pills" class="section-pill-bar" aria-hidden="true">
            <div class="section-pill-bar__inner">
                ${pills}
            </div>
        </div>`;
}

export function renderProjectSidebar(project, site, toRoot, options = {}) {
    const sidebarCopy = {
        ...getProjectSidebarCopy(project),
        ...(options.sidebarCopy ?? {})
    };
    const emailLink = site.socialLinks.find((entry) => entry.label?.toLowerCase() === 'email')?.href ?? 'mailto:neelanzone@gmail.com';
    const workItems = (site.moreProjects ?? []).map((entry) => ({
        href: resolveProjectLink(entry.link, project.slug, toRoot),
        label: entry.title,
        current: entry.slug === project.slug
    }));
    const sidebarNote = options.sidebarNote
        ? {
            title: options.sidebarNote.title || 'Project note',
            copy: options.sidebarNote.copy || '',
            links: Array.isArray(options.sidebarNote.links) ? options.sidebarNote.links : [],
            navAriaLabel: options.sidebarNote.navAriaLabel || options.sidebarNote.title || 'Project navigation',
            open: options.sidebarNote.open ?? false
        }
        : null;

    const sidebarMarkup = renderSidebar({
        sidebarId: 'project-sidebar',
        extraClassName: 'project-sidebar',
        rootDataAttribute: 'data-project-sidebar',
        toggleDataAttribute: 'data-project-sidebar-toggle',
        ariaLabel: `${escapeHtml(project.title)} section navigation`,
        introOrder: Array.isArray(options.sidebarIntroOrder) && options.sidebarIntroOrder.length
            ? options.sidebarIntroOrder
            : undefined,
        roles: sidebarCopy.roles,
        projectSection: {
            title: project.title,
            brief: sidebarCopy.brief,
            open: true
        },
        birdsSection: sidebarNote,
        portfolioSection: {
            title: 'Cabinet of Curiosities',
            brief: 'A home for projects, musings, and a little soul.',
            open: false
        },
        index: {
            ariaLabel: 'Portfolio navigation',
            aboutHref: `${toRoot}index.html#about`,
            galleryHref: `${toRoot}index.html#gallery`,
            workItems,
            embedInPortfolio: true
        },
        footer: {
            title: 'Neel Banerjee',
            taglineHtml: options.footerTaglineHtml || 'Drawn to systems,<br>obsessed with play',
            logoHref: options.footerLogoHref || `${toRoot}index.html`,
            logoLabel: 'Back to homepage',
            logoSrc: resolveAssetPath('Assets/identity-motion-active-sidebar.gif', toRoot),
            logoAlt: 'neel Logo',
            emailHref: emailLink,
            contactLabel: 'Get in touch'
        }
    });

    return `${sidebarMarkup}${renderSidebarMobileMenuButton({
        controlsId: 'project-sidebar',
        toggleDataAttribute: 'data-project-sidebar-toggle',
        extraClassName: 'project-sidebar-mobile-menu',
        ariaLabel: 'Expand sidebar'
    })}`;
}
export function renderHeader(project, site, toRoot) {
    return renderSectionPills(project);
}

function splitCardMeta(entry) {
    const raw = String(entry.type ?? '').trim();
    const parts = raw.split(',');
    const dateLabel = parts.length > 1 ? parts.pop().trim() : '';

    const explicitLabelsBySlug = {
        'ludo-cards': ['Game Design', 'Personal'],
        'managed-asset-search': ['UX', 'Internal Tool', 'Total Environment'],
        'venture-hub': ['UX', 'Product Design', 'Concept'],
        'qualitative-reports-at-scale': ['UX', 'Internal Tool', 'StartupYou']
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
                        <button class="project-carousel-control prev" type="button" aria-label="Previous project">
                            <img class="project-carousel-control__icon project-carousel-control__icon--dark" src="${escapeHtml(resolveAssetPath('Assets/Icons/left-arrow-button-dark.svg', toRoot))}" alt="" aria-hidden="true">
                            <img class="project-carousel-control__icon project-carousel-control__icon--light" src="${escapeHtml(resolveAssetPath('Assets/Icons/left-arrow-button-light.svg', toRoot))}" alt="" aria-hidden="true">
                        </button>
                        <button class="project-carousel-control next" type="button" aria-label="Next project">
                            <img class="project-carousel-control__icon project-carousel-control__icon--dark" src="${escapeHtml(resolveAssetPath('Assets/Icons/right-arrow-button-dark.svg', toRoot))}" alt="" aria-hidden="true">
                            <img class="project-carousel-control__icon project-carousel-control__icon--light" src="${escapeHtml(resolveAssetPath('Assets/Icons/right-arrow-button-light.svg', toRoot))}" alt="" aria-hidden="true">
                        </button>
                        <div class="project-carousel-track">
                            ${site.moreProjects.filter((entry) => entry.slug !== project.slug).map((entry) => {
                                const href = resolveProjectLink(entry.link, project.slug, toRoot);
                                const current = entry.slug === project.slug;
                                const { typeLabels, dateLabel } = splitCardMeta(entry);
                                const description = entry.description
                                    ? `<p class="project-carousel-card__description">${escapeHtml(entry.description)}</p>`
                                    : '';
                                const typePills = typeLabels
                                    .map((label) => `<span class="project-carousel-card__pill project-carousel-card__pill--type">${escapeHtml(label)}</span>`)
                                    .join('');
                                const pills = `<div class="project-carousel-card__pills"><div class="project-carousel-card__pill-group">${typePills}</div></div>`;
                                const isVideo = entry.image.src.endsWith('.mp4') || entry.image.src.endsWith('.webm');
                                const cardMedia = isVideo
                                    ? `<video autoplay loop muted playsinline preload="none" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;"><source src="${escapeHtml(resolveAssetPath(entry.image.src, toRoot))}" type="video/mp4"></video>`
                                    : `<img src="${escapeHtml(resolveAssetPath(entry.image.src, toRoot))}" alt="${escapeHtml(entry.image.alt)}" loading="lazy" decoding="async">`;
                                return `<article class="project-carousel-card" data-project-slug="${escapeHtml(entry.slug)}"><a class="project-carousel-card__link" href="${escapeHtml(href)}"${current ? ' aria-current="page"' : ''}><div class="project-carousel-card__shell"><div class="project-carousel-card__face project-carousel-card__face--back" aria-hidden="true"></div><div class="project-carousel-card__face project-carousel-card__face--front">${pills}<div class="project-carousel-card__image">${cardMedia}</div><div class="project-carousel-card__meta"><h3 class="project-carousel-card__title">${escapeHtml(entry.title)}</h3>${description}</div></div></div></a></article>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

export function renderFooterBlock(site, toRoot, options = {}) {
    const footerCopy = options.copyHtml
        ? `<p class="project-tail-footer__copy">${options.copyHtml}</p>`
        : options.copy
            ? `<p class="project-tail-footer__copy">${escapeHtml(options.copy)}</p>`
            : '';

    return `
        <footer class="project-tail-footer">
            <div class="project-tail-footer__inner">
                ${footerCopy}
                <div class="project-tail-footer__icons">
                    <a href="https://x.com/Neelanzone" class="project-social-icon" target="_blank" rel="noreferrer" aria-label="X"><img src="${escapeHtml(resolveAssetPath('Assets/social/x.svg', toRoot))}" alt="" class="project-social-icon__img"></a>
                    <a href="https://github.com/neelanzone" class="project-social-icon" target="_blank" rel="noreferrer" aria-label="GitHub"><img src="${escapeHtml(resolveAssetPath('Assets/social/github.svg', toRoot))}" alt="" class="project-social-icon__img"></a>
                    <a href="https://www.linkedin.com/in/neelanzone/" class="project-social-icon" target="_blank" rel="noreferrer" aria-label="LinkedIn"><img src="${escapeHtml(resolveAssetPath('Assets/social/linkedin.svg', toRoot))}" alt="" class="project-social-icon__img"></a>
                    <a href="mailto:neelanzone@gmail.com" class="project-social-icon" aria-label="Email"><img src="${escapeHtml(resolveAssetPath('Assets/social/mail.svg', toRoot))}" alt="" class="project-social-icon__img"></a>
                </div>
            </div>
        </footer>`;
}

export { getProjectNavItems, renderMetaTags };














