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

function renderSectionPills(project) {
    const pillItems = project.sections
        .filter((section) => section.navLabel)
        .map((section) => ({ id: section.id, label: section.navLabel }));

    pillItems.push({ id: 'more-projects', label: 'More' });

    const pills = pillItems.map((item, index) => {
        const activeClass = index === 0 ? ' is-active' : '';
        return `<a href="#${escapeHtml(item.id)}" class="section-pill${activeClass}" data-section="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`;
    }).join('\n                ');

    return `
        <div id="section-pills" class="section-pill-bar" aria-hidden="true">
            <div class="section-pill-bar__inner">
                ${pills}
            </div>
        </div>`;
}

export function renderHeader(project, site, toRoot) {
    return `
    <div data-navbar-mount data-navbar-variant="project" data-to-root="${escapeHtml(toRoot)}"></div>
${renderSectionPills(project)}`;
}

function splitCardMeta(entry) {
    const raw = String(entry.type ?? '').trim();
    const parts = raw.split(',');
    const dateLabel = parts.length > 1 ? parts.pop().trim() : '';

    const explicitLabelsBySlug = {
        'ludo-cards': ['Game Design'],
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
                                const pills = `<div class="project-carousel-card__pills"><div class="project-carousel-card__pill-group">${typePills}</div>${dateLabel ? `<span class="project-carousel-card__pill project-carousel-card__pill--date">${escapeHtml(dateLabel)}</span>` : ''}</div>`;
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

export function renderFooterBlock(site, toRoot) {
    return `
        <footer class="project-tail-footer border-t border-rule/80 mt-4 pt-4 lg:mt-5 lg:pt-5">
            <div class="mx-auto flex max-w-[70rem] justify-center text-subtext">
                <div class="flex items-center gap-[1.15rem]">
                    <a href="https://x.com/Neelanzone" class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-rule/80 bg-[rgba(255,255,255,0.02)] transition hover:-translate-y-0.5 hover:border-ink" target="_blank" rel="noreferrer" aria-label="X"><img src="${escapeHtml(resolveAssetPath('Assets/social/x.svg', toRoot))}" alt="" class="h-[1.35rem] w-[1.35rem] opacity-80 grayscale"></a>
                    <a href="https://github.com/neelanzone" class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-rule/80 bg-[rgba(255,255,255,0.02)] transition hover:-translate-y-0.5 hover:border-ink" target="_blank" rel="noreferrer" aria-label="GitHub"><img src="${escapeHtml(resolveAssetPath('Assets/social/github.svg', toRoot))}" alt="" class="h-[1.35rem] w-[1.35rem] opacity-80 grayscale"></a>
                    <a href="https://www.linkedin.com/in/neelanzone/" class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-rule/80 bg-[rgba(255,255,255,0.02)] transition hover:-translate-y-0.5 hover:border-ink" target="_blank" rel="noreferrer" aria-label="LinkedIn"><img src="${escapeHtml(resolveAssetPath('Assets/social/linkedin.svg', toRoot))}" alt="" class="h-[1.35rem] w-[1.35rem] opacity-80 grayscale"></a>
                    <a href="mailto:neelanzone@gmail.com" class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-rule/80 bg-[rgba(255,255,255,0.02)] transition hover:-translate-y-0.5 hover:border-ink" aria-label="Email"><img src="${escapeHtml(resolveAssetPath('Assets/social/mail.svg', toRoot))}" alt="" class="h-[1.35rem] w-[1.35rem] opacity-80 grayscale"></a>
                </div>
            </div>
        </footer>`;
}

export { renderMetaTags };





