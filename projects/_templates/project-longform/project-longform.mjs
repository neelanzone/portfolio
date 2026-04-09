import { renderFooterBlock, renderMetaTags, renderProjectSidebar } from '../layout.mjs';
import { escapeHtml, resolveAssetPath, resolveProjectLink } from '../template-utils.mjs';
import { getArtifactPreset } from './presets.mjs';

const expansionIconDark = 'Assets/Icons/expansion-arrow-button-dark.svg';
const expansionIconLight = 'Assets/Icons/expansion-arrow-button-light.svg';
const collapseIconDark = 'Assets/Icons/collapse-arrow-button-dark.svg';
const collapseIconLight = 'Assets/Icons/collapse-arrow-button-light.svg';
const leftArrowIconDark = 'Assets/Icons/left-arrow-button-dark.svg';
const leftArrowIconLight = 'Assets/Icons/left-arrow-button-light.svg';
const rightArrowIconDark = 'Assets/Icons/right-arrow-button-dark.svg';
const rightArrowIconLight = 'Assets/Icons/right-arrow-button-light.svg';

function getLongformConfig(project) {
    return project.templateContent?.longform ?? project.templateContent ?? {};
}

function getSidebarCopy(project, config) {
    const hero = config.hero ?? {};
    const tags = Array.isArray(hero.tags) ? hero.tags.filter(Boolean) : [];
    const tabs = Array.isArray(hero.tabs) ? hero.tabs.filter(Boolean) : [];
    const brief = hero.paragraph || tabs[0]?.body || project.seo?.description || '';

    return {
        roles: tags.slice(0, 3),
        brief
    };
}

function getSidebarNavigationItems(config, blocks) {
    const configuredItems = Array.isArray(config.sidebar?.navigationItems)
        ? config.sidebar.navigationItems.filter((item) => item?.label && item?.href)
        : [];

    if (configuredItems.length) {
        return configuredItems.map((item) => ({
            label: item.label,
            href: item.href,
            sectionNav: item.sectionNav !== false
        }));
    }

    const items = [];
    const heroAnchorId = config.hero?.anchorId || 'project-brief';
    const expansionBlock = blocks.find((block) => block?.type === 'expansion-panels') ?? null;
    const firstProcessPanel = Array.isArray(expansionBlock?.items)
        ? expansionBlock.items.find((panel) => panel?.id)
        : null;
    const artifactBlock = blocks.find((block) => block?.type === 'artifact-rail') ?? null;
    const prototypeBlock = blocks.find((block) => block?.type === 'snackbar-stack') ?? null;

    if (heroAnchorId) {
        items.push({ label: 'Project Brief', href: `#${heroAnchorId}`, sectionNav: true });
    }

    if (firstProcessPanel?.id || expansionBlock?.id) {
        items.push({ label: 'Process', href: `#${firstProcessPanel?.id || expansionBlock.id}`, sectionNav: true });
    }

    if (artifactBlock?.id) {
        items.push({ label: 'Artifacts', href: `#${artifactBlock.id}`, sectionNav: true });
    }

    if (prototypeBlock?.id) {
        items.push({ label: 'Prototype', href: `#${prototypeBlock.id}`, sectionNav: true });
    }

    return items;
}

function resolvePageAssetPath(assetPath, toRoot) {
    if (!assetPath) {
        return '';
    }

    if (/^(?:https?:)?\/\//i.test(assetPath) || assetPath.startsWith('./') || assetPath.startsWith('../') || assetPath.startsWith('/')) {
        return assetPath;
    }

    return resolveAssetPath(assetPath, toRoot);
}

function renderThemeToggle() {
    return `
        <button class="project-theme-toggle project-longform__theme-toggle" data-theme-toggle aria-label="Toggle theme">
            <span class="project-theme-toggle__cap" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="moon-icon">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="sun-icon">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            </span>
        </button>`;
}

function renderProjectTopbar(project, site, toRoot) {
    const projectLinks = Array.isArray(site.moreProjects)
        ? site.moreProjects.filter((entry) => entry?.slug && entry.slug !== project.slug)
        : [];
    const navLinks = [
        {
            title: 'Home',
            href: `${toRoot}${(site.homeHref || 'index.html').replace(/^\.\//, '')}`,
            ariaLabel: 'Open home page'
        },
        ...projectLinks.map((entry) => ({
            title: entry.title,
            href: resolveProjectLink(entry.link, project.slug, toRoot),
            ariaLabel: `Open ${entry.title} project page`
        }))
    ];

    const pillsMarkup = navLinks.map((entry) => `
            <a class="project-longform__project-pill" href="${escapeHtml(entry.href)}" aria-label="${escapeHtml(entry.ariaLabel)}" data-project-topbar-pill>
                <span class="project-longform__project-pill-label">${escapeHtml(entry.title)}</span>
            </a>`).join('');

    return `
        <div class="project-longform__topbar${navLinks.length ? '' : ' project-longform__topbar--toggle-only'}" data-project-topbar>
            <div class="project-longform__topbar-inner">
                ${navLinks.length ? `
                    <div class="project-longform__topbar-affordance" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <nav class="project-longform__project-pillbar" aria-label="Project page navigation">
                        ${pillsMarkup}
                    </nav>` : ''}
                ${renderThemeToggle()}
            </div>
        </div>`;
}

function renderHeroTabs(tabs) {
    const normalizedTabs = Array.isArray(tabs) ? tabs.filter((tab) => tab?.id && tab?.label && tab?.body) : [];

    if (!normalizedTabs.length) {
        return '';
    }

    const buttons = normalizedTabs.map((tab, index) => `
        <button
            class="ludo-bento__hero-tab${index === 0 ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            aria-controls="ludo-hero-panel-${escapeHtml(tab.id)}"
            id="ludo-hero-tab-${escapeHtml(tab.id)}"
            data-ludo-hero-tab="${escapeHtml(tab.id)}"
        >${escapeHtml(tab.label)}</button>`).join('');

    const panels = normalizedTabs.map((tab, index) => `
        <div
            class="ludo-bento__hero-panel-body${index === 0 ? ' is-active' : ''}"
            id="ludo-hero-panel-${escapeHtml(tab.id)}"
            role="tabpanel"
            aria-labelledby="ludo-hero-tab-${escapeHtml(tab.id)}"
            ${index === 0 ? '' : 'hidden'}
            data-ludo-hero-panel="${escapeHtml(tab.id)}"
        >
            <p class="ludo-bento__hero-summary">${escapeHtml(tab.body)}</p>
        </div>`).join('');

    return `
        <div class="ludo-bento__hero-tabs" role="tablist" aria-label="Project summary tabs">${buttons}
        </div>
        <div class="ludo-bento__hero-panels">${panels}
        </div>`;
}

function resolveConstraintBody(project, hero) {
    const heroConstraint = typeof hero?.constraintBody === 'string'
        ? hero.constraintBody.trim()
        : (typeof hero?.constraint === 'string' ? hero.constraint.trim() : '');

    return heroConstraint || 'Constraint details can be added here as the project brief evolves.';
}

function ensureConstraintTab(project, hero) {
    const tabs = Array.isArray(hero?.tabs) ? hero.tabs.filter((tab) => tab?.id && tab?.label && tab?.body) : [];
    if (!tabs.length) {
        return tabs;
    }
    const hasConstraint = tabs.some((tab) => {
        const id = String(tab.id || '').trim().toLowerCase();
        const label = String(tab.label || '').trim().toLowerCase();
        return id === 'constraint' || label === 'constraint';
    });
    if (hasConstraint) {
        return tabs;
    }
    const constraintTab = {
        id: 'constraint',
        label: 'Constraint',
        body: resolveConstraintBody(project, hero)
    };
    const outcomeIndex = tabs.findIndex((tab) => {
        const id = String(tab.id || '').trim().toLowerCase();
        const label = String(tab.label || '').trim().toLowerCase();
        return id === 'outcome' || label === 'outcome';
    });
    if (outcomeIndex >= 0) {
        return [...tabs.slice(0, outcomeIndex + 1), constraintTab, ...tabs.slice(outcomeIndex + 1)];
    }
    return [...tabs, constraintTab];
}
function renderQuoteStack(quotes) {
    const normalizedQuotes = Array.isArray(quotes) ? quotes.filter((quote) => quote?.text) : [];

    if (!normalizedQuotes.length) {
        return '';
    }

    const firstQuote = normalizedQuotes[0];

    return `
        <button class="ludo-bento__quote-stack project-longform__quote-stack" type="button" data-ludo-quote-stack data-active-quote="0" aria-label="Show next user story">
            ${normalizedQuotes.map((quote, index) => `
                <span hidden data-ludo-quote-source data-ludo-quote-index="${index}" data-ludo-quote-source-text="${escapeHtml(quote.text)}" data-ludo-quote-source-meta="${escapeHtml(quote.attribution || '')}"></span>`).join('')}
            <span class="ludo-bento__quote-deck">
                <span class="ludo-bento__quote-layer ludo-bento__quote-layer--third" aria-hidden="true"></span>
                <span class="ludo-bento__quote-layer ludo-bento__quote-layer--second" aria-hidden="true"></span>
                <span class="ludo-bento__quote-card">
                    <span class="ludo-bento__quote-text" data-ludo-quote-current-text>${escapeHtml(firstQuote.text)}</span>
                    <span class="ludo-bento__quote-footer">
                        <span class="ludo-bento__quote-meta" data-ludo-quote-current-meta>${escapeHtml(firstQuote.attribution || '')}</span>
                        <span class="ludo-bento__quote-count" data-ludo-quote-current-count>1/${normalizedQuotes.length}</span>
                    </span>
                </span>
            </span>
        </button>`;
}

function renderTopfoldVisual(visual, modifier, toRoot, targetId = '') {
    if (!visual?.src) {
        return '';
    }

    const href = targetId ? `#${escapeHtml(targetId)}` : '';
    const tag = href ? 'a' : 'figure';
    const hrefAttr = href ? ` href="${href}"` : '';
    const label = visual.linkLabel || 'Jump to the cards section';
    const labelAttr = href ? ` aria-label="${escapeHtml(label)}"` : '';

    return `
        <${tag} class="project-longform__visual project-longform__visual--${escapeHtml(modifier)}"${hrefAttr}${labelAttr}>
            <img src="${escapeHtml(resolveAssetPath(visual.src, toRoot))}" alt="${escapeHtml(visual.alt || '')}" loading="lazy" decoding="async">
        </${tag}>`;
}

function renderFeatureMediaElement(media, toRoot) {
    if (!media?.src) {
        return '';
    }

    if (media.kind === 'video') {
        return `
            <video autoplay muted loop playsinline${media.poster ? ` poster="${escapeHtml(resolveAssetPath(media.poster, toRoot))}"` : ''}>
                <source src="${escapeHtml(resolveAssetPath(media.src, toRoot))}" type="video/mp4">
            </video>`;
    }

    if (media.kind === 'youtube' || media.kind === 'iframe') {
        return `
            <iframe
                src="${escapeHtml(media.src)}"
                title="${escapeHtml(media.title || media.alt || 'Embedded project demo')}"
                loading="lazy"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
            ></iframe>`;
    }

    return `<img src="${escapeHtml(resolveAssetPath(media.src, toRoot))}" alt="${escapeHtml(media.alt || '')}" loading="lazy" decoding="async">`;
}

function renderFeatureMedia(media, toRoot) {
    if (!media?.src) {
        return '';
    }

    const slides = [media].concat(Array.isArray(media.slides) ? media.slides.filter((slide) => slide?.src) : []);

    if (slides.length > 1) {
        return `
        <section class="project-longform__feature project-longform__feature--carousel" data-project-feature-carousel data-active-slide="0" aria-label="Project media carousel">
            <div class="project-longform__feature-slides">
                ${slides.map((slide, index) => `<figure class="project-longform__feature-slide${index === 0 ? ' is-active' : ''}${slide.caption ? ' has-caption' : ''}" data-project-feature-slide="${index}"${index === 0 ? '' : ' hidden'}>
                    ${renderFeatureMediaElement(slide, toRoot)}
                    ${slide.caption ? `<figcaption class="project-longform__feature-caption">${escapeHtml(slide.caption)}</figcaption>` : ''}
                </figure>`).join('')}
            </div>
            <div class="project-longform__feature-dots" role="tablist" aria-label="Feature media navigation">
                ${slides.map((slide, index) => `<button class="project-longform__feature-dot${index === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-label="Show media ${index + 1}" data-project-feature-dot="${index}"><span aria-hidden="true"></span></button>`).join('')}
            </div>
        </section>`;
    }

    return `
        <figure class="project-longform__feature${media.caption ? ' has-caption' : ''}">
            ${renderFeatureMediaElement(media, toRoot)}
            ${media.caption ? `<figcaption class="project-longform__feature-caption">${escapeHtml(media.caption)}</figcaption>` : ''}
        </figure>`;
}

function renderExpandButton(toRoot) {
    return `
        <span class="ludo-bento__expand-button" aria-hidden="true">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--expand-dark" src="${escapeHtml(resolveAssetPath(expansionIconDark, toRoot))}" alt="" loading="lazy" decoding="async">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--expand-light" src="${escapeHtml(resolveAssetPath(expansionIconLight, toRoot))}" alt="" loading="lazy" decoding="async">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--collapse-dark" src="${escapeHtml(resolveAssetPath(collapseIconDark, toRoot))}" alt="" loading="lazy" decoding="async">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--collapse-light" src="${escapeHtml(resolveAssetPath(collapseIconLight, toRoot))}" alt="" loading="lazy" decoding="async">
        </span>`;
}

function renderInfoTimelineColumn(column) {
    const timeline = Array.isArray(column?.timeline) ? column.timeline : [];

    return `
        <div class="ludo-bento__timeline">
            ${timeline.map((item, index) => `
                <div class="ludo-bento__timeline-item">
                    <span class="ludo-bento__timeline-rail" aria-hidden="true">
                        <span class="ludo-bento__timeline-dot ludo-bento__timeline-dot--${escapeHtml(item.tone || 'live')}"></span>
                        ${index === timeline.length - 1 ? '' : '<span class="ludo-bento__timeline-line"></span>'}
                    </span>
                    <span class="ludo-bento__timeline-copy">
                        <span class="ludo-bento__timeline-phase">${escapeHtml(item.phase || '')}</span>
                        <strong class="ludo-bento__timeline-title">${escapeHtml(item.title || '')}</strong>
                        <span class="ludo-bento__timeline-status"><span class="ludo-bento__timeline-status-dot ludo-bento__timeline-status-dot--${escapeHtml(item.tone || 'live')}" aria-hidden="true"></span>${escapeHtml(item.status || '')}</span>
                    </span>
                </div>`).join('')}
        </div>`;
}

function renderInfoCardSupport(panel, toRoot) {
    const support = panel?.support;
    if (!support?.kind) {
        return '';
    }

    const classes = ['ludo-bento__info-card-support'];
    classes.push(support.placement === 'pinned' ? 'ludo-bento__info-card-support--pinned' : 'ludo-bento__info-card-support--flow');

    if (support.kind === 'legend') {
        const items = Array.isArray(support.items) ? support.items : [];
        return `
            <div class="${classes.join(' ')} ludo-bento__legend-grid">
                ${items.map((item) => `
                    <span class="ludo-bento__legend-item">
                        <span class="ludo-bento__legend-dot ludo-bento__legend-dot--${escapeHtml(item.tone || 'gold')}"></span>
                        ${escapeHtml(item.label || '')}
                    </span>`).join('')}
            </div>`;
    }

    if (support.kind === 'stats') {
        const items = Array.isArray(support.items) ? support.items : [];
        return `
            <div class="${classes.join(' ')} ludo-bento__stat-grid">
                ${items.map((item) => `
                    <span class="ludo-bento__stat-item">
                        <span class="ludo-bento__stat-icon-frame" aria-hidden="true">
                            <img src="${escapeHtml(resolveAssetPath(item.src, toRoot))}" alt="" loading="lazy" decoding="async">
                        </span>
                        <span>${escapeHtml(item.label || '')}</span>
                    </span>`).join('')}
            </div>`;
    }

    if (support.kind === 'timeline') {
        return `
            <div class="${classes.join(' ')} ludo-bento__development-support">
                <div class="ludo-bento__development-block">
                    ${support.title ? `<h3 class="ludo-bento__support-heading">${escapeHtml(support.title)}</h3>` : ''}
                    ${renderInfoTimelineColumn({ timeline: support.items || [] })}
                </div>
            </div>`;
    }

    if (support.kind === 'pill-list') {
        const items = Array.isArray(support.items) ? support.items : [];
        return `
            <div class="${classes.join(' ')} project-longform__support-pills">
                ${items.map((item) => `<span class="project-longform__support-pill">${escapeHtml(item.label || item || '')}</span>`).join('')}
            </div>`;
    }

    return '';
}

function renderInfoCardExpandedColumns(panel) {
    const columns = Array.isArray(panel?.expandedColumns) ? panel.expandedColumns : [];
    if (!columns.length) {
        return '';
    }

    return `
        <div class="ludo-bento__info-card-expanded">
            ${columns.map((column) => `
                <div class="ludo-bento__info-column">
                    <h3>${escapeHtml(column.title || '')}</h3>
                    ${column.type === 'timeline'
                        ? renderInfoTimelineColumn(column)
                        : `<p>${escapeHtml(column.body || '')}</p>`}
                </div>`).join('')}
        </div>`;
}

function renderInfoCard(panel, toRoot) {
    return `
        <article class="ludo-bento__info-card"${panel.id ? ` id="${escapeHtml(panel.id)}"` : ''} data-ludo-info-card data-ludo-info-origin="${escapeHtml(panel.origin || 'left')}" data-active="false" data-expanded-content="false" tabindex="0" role="button" aria-expanded="false" aria-label="Expand section card: ${escapeHtml(panel.ariaLabel || panel.title || '')}">
            <div class="ludo-bento__info-card-shell">
                <div class="ludo-bento__info-card-main">
                    <div class="ludo-bento__info-card-copy">
                        <h2>${escapeHtml(panel.title || '')}</h2>
                        <p>${escapeHtml(panel.body || '')}</p>
                        ${renderInfoCardSupport(panel, toRoot)}
                    </div>
                </div>
                ${renderInfoCardExpandedColumns(panel)}
            </div>
            ${renderExpandButton(toRoot)}
        </article>`;
}

function resolveRailCards(group) {
    if (group?.preset) {
        return getArtifactPreset(group.preset);
    }

    return Array.isArray(group?.cards) ? group.cards : [];
}

function renderArtifactCard(card, groupId, index, toRoot) {
    const primarySrc = resolveAssetPath(card.src, toRoot);
    const secondarySrc = resolveAssetPath(card.secondarySrc || card.altSrc || card.src, toRoot);
    const roleLabel = card.roleLabel || card.role || '';
    const name = card.name || card.title || '';

    return `
        <button
            class="ludo-bento__card-frame"
            type="button"
            data-ludo-card-trigger
            data-ludo-card-group="${escapeHtml(groupId)}"
            data-ludo-card-index="${escapeHtml(String(index))}"
            data-ludo-card-id="${escapeHtml(card.id || `${groupId}-${index}`)}"
            data-ludo-card-title="${escapeHtml(card.title || name)}"
            data-ludo-card-name="${escapeHtml(name)}"
            data-ludo-card-role="${escapeHtml(roleLabel)}"
            data-ludo-card-body="${escapeHtml(card.body || '')}"
            data-ludo-card-flat="${escapeHtml(primarySrc)}"
            data-ludo-card-stylised="${escapeHtml(secondarySrc)}"
            aria-label="Open ${escapeHtml(card.title || name || 'artifact')} in fullscreen viewer"
        >
            <img src="${escapeHtml(primarySrc)}" alt="${escapeHtml(card.alt || card.title || name || 'Project artifact')}" loading="lazy" decoding="async" draggable="false">
        </button>`;
}

function renderCardGroups(block, toRoot) {
    const groups = Array.isArray(block?.groups) ? block.groups : [];
    const buttons = groups.map((group, index) => `
        <button
            class="ludo-bento__rail-tab${index === 0 ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            aria-controls="ludo-card-group-${escapeHtml(group.id)}"
            id="ludo-card-tab-${escapeHtml(group.id)}"
            data-ludo-card-tab="${escapeHtml(group.id)}"
        >${escapeHtml(group.label || group.id || '')}</button>`).join('');

    const panels = groups.map((group, index) => {
        const cards = resolveRailCards(group);
        const cardsMarkup = cards.length
            ? cards.map((card, cardIndex) => renderArtifactCard(card, group.id, cardIndex, toRoot)).join('')
            : `<p class="ludo-bento__card-empty">${escapeHtml(group.emptyText || 'Artifacts in this lane are still being wired in.')}</p>`;

        return `
            <div
                class="ludo-bento__card-group${index === 0 ? ' is-active' : ''}"
                id="ludo-card-group-${escapeHtml(group.id)}"
                role="tabpanel"
                aria-labelledby="ludo-card-tab-${escapeHtml(group.id)}"
                ${index === 0 ? '' : 'hidden'}
                data-ludo-card-panel="${escapeHtml(group.id)}"
            >
                <div class="ludo-bento__card-strip${cards.length ? '' : ' is-empty'}" tabindex="0" aria-label="${escapeHtml(group.label || group.id || '')} image strip">
                    ${cardsMarkup}
                </div>
            </div>`;
    }).join('');

    return `
        <section class="project-longform__section project-longform__section--artifact" id="${escapeHtml(block.id || 'artifact-rail')}">
            ${block.title ? `<div class="project-longform__section-heading"><p>${escapeHtml(block.title)}</p></div>` : ''}
            <div class="ludo-bento__rail-card">
                <div class="ludo-bento__rail-header">
                    <div class="ludo-bento__rail-tabs" role="tablist" aria-label="${escapeHtml(block.ariaLabel || 'Project artifact groups')}">${buttons}
                    </div>
                </div>
                <div class="ludo-bento__rail-panels">${panels}
                </div>
            </div>
        </section>`;
}

function renderCardLightbox(block, toRoot) {
    const lightbox = block?.lightbox ?? {};
    const primaryLabel = lightbox.primaryLabel || 'Flat';
    const secondaryLabel = lightbox.secondaryLabel || 'Stylised';
    const detailNameTitle = lightbox.detailNameTitle || 'Character name';
    const detailRoleTitle = lightbox.detailRoleTitle || 'Character class';

    return `
    <div class="ludo-bento__lightbox" data-ludo-lightbox hidden aria-hidden="true">
        <section class="ludo-bento__lightbox-shell" role="dialog" aria-modal="true" aria-label="${escapeHtml(lightbox.ariaLabel || 'Fullscreen artifact viewer')}">
            <div class="ludo-bento__lightbox-handle" data-ludo-lightbox-handle aria-hidden="true"></div>
            <button class="ludo-bento__lightbox-close" type="button" data-ludo-lightbox-close aria-label="Close fullscreen artifact viewer">X</button>
            <button class="ludo-bento__lightbox-nav ludo-bento__lightbox-nav--prev" type="button" data-ludo-lightbox-prev aria-label="View previous artifact">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--dark" src="${escapeHtml(resolveAssetPath(leftArrowIconDark, toRoot))}" alt="" loading="lazy" decoding="async">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--light" src="${escapeHtml(resolveAssetPath(leftArrowIconLight, toRoot))}" alt="" loading="lazy" decoding="async">
            </button>
            <button class="ludo-bento__lightbox-nav ludo-bento__lightbox-nav--next" type="button" data-ludo-lightbox-next aria-label="View next artifact">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--dark" src="${escapeHtml(resolveAssetPath(rightArrowIconDark, toRoot))}" alt="" loading="lazy" decoding="async">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--light" src="${escapeHtml(resolveAssetPath(rightArrowIconLight, toRoot))}" alt="" loading="lazy" decoding="async">
            </button>
            <div class="ludo-bento__lightbox-stage">
                <div class="ludo-bento__lightbox-pills" aria-hidden="true">
                    <p class="ludo-bento__lightbox-pill" data-ludo-lightbox-role></p>
                    <p class="ludo-bento__lightbox-pill" data-ludo-lightbox-count></p>
                </div>
                <aside class="ludo-bento__lightbox-side ludo-bento__lightbox-side--left" aria-live="polite">
                    <h3 class="ludo-bento__lightbox-side-title" data-ludo-lightbox-copy-title>${escapeHtml(primaryLabel)}</h3>
                    <p class="ludo-bento__lightbox-side-copy" data-ludo-lightbox-copy-body></p>
                </aside>
                <aside class="ludo-bento__lightbox-side ludo-bento__lightbox-side--right" aria-live="polite">
                    <div class="ludo-bento__lightbox-side-row">
                        <h3 class="ludo-bento__lightbox-side-title" data-ludo-lightbox-detail-name-title>${escapeHtml(detailNameTitle)}</h3>
                        <p class="ludo-bento__lightbox-side-copy" data-ludo-lightbox-detail-name-body></p>
                    </div>
                    <div class="ludo-bento__lightbox-side-row">
                        <h3 class="ludo-bento__lightbox-side-title" data-ludo-lightbox-detail-class-title>${escapeHtml(detailRoleTitle)}</h3>
                        <p class="ludo-bento__lightbox-side-copy" data-ludo-lightbox-detail-class-body></p>
                    </div>
                </aside>
                <div class="ludo-bento__lightbox-canvas" data-ludo-lightbox-canvas></div>
                <div class="ludo-bento__lightbox-versions" role="tablist" aria-label="Artifact versions">
                    <button class="ludo-bento__lightbox-version is-active" type="button" data-ludo-lightbox-version="flat" aria-pressed="true">${escapeHtml(primaryLabel)}</button>
                    <button class="ludo-bento__lightbox-version" type="button" data-ludo-lightbox-version="stylised" aria-pressed="false">${escapeHtml(secondaryLabel)}</button>
                </div>
            </div>
        </section>
    </div>`;
}

function renderExpansionPanels(block, toRoot) {
    const panels = Array.isArray(block?.items) ? block.items : [];

    return `
        <section class="project-longform__section project-longform__section--panels" id="${escapeHtml(block.id || 'details')}">
            ${block.title ? `<div class="project-longform__section-heading"><p>${escapeHtml(block.title)}</p></div>` : ''}
            <section class="ludo-bento__top-grid project-longform__expansion-grid" data-ludo-info-stack data-ludo-info-enhanced="false" data-ready="false" data-active-card="none">
                ${panels.map((panel) => renderInfoCard(panel, toRoot)).join('')}
            </section>
        </section>`;
}

function renderSnackbarStack(block, options = {}) {
    const items = Array.isArray(block?.items) ? block.items : [];
    const idAttr = options.includeId === false ? '' : ` id="${escapeHtml(block.id || 'next-layers')}"`;

    return `
        <section class="project-longform__section project-longform__section--snackbars"${idAttr}>
            ${block.title ? `<div class="project-longform__section-heading"><p>${escapeHtml(block.title)}</p></div>` : ''}
            <div class="project-longform__snackbar-stack">
                ${items.map((item) => {
                    const tag = item.href ? 'a' : 'article';
                    const hrefAttr = item.href ? ` href="${escapeHtml(item.href)}"` : '';
                    const targetAttr = item.href && /^https?:/i.test(item.href) ? ' target="_blank" rel="noreferrer"' : '';
                    return `<${tag} class="project-longform__snackbar"${hrefAttr}${targetAttr}>
                        <div class="project-longform__snackbar-copy">
                            <h3>${escapeHtml(item.title || '')}</h3>
                            <p>${escapeHtml(item.body || '')}</p>
                        </div>
                        ${item.cta ? `<span class="project-longform__snackbar-pill">${escapeHtml(item.cta)}</span>` : ''}
                    </${tag}>`;
                }).join('')}
            </div>
        </section>`;
}

function renderAssetMapStage(block, options = {}) {
    const items = Array.isArray(block?.items) ? block.items : [];
    const idAttr = options.includeId === false ? '' : ` id="${escapeHtml(block.id || 'process')}"`;
    const showFooterControls = block.showZoom !== false || block.showReset !== false;
    const initialMap = block?.defaultMap || items[0]?.mapKey || 'after';
    const initialItem = items.find((item) => (item?.mapKey || 'after') === initialMap) || items[0] || null;

    return `
        <section class="project-longform__section project-longform__section--map-stage"${idAttr}>
            ${block.title ? `<div class="project-longform__section-heading"><p>${escapeHtml(block.title)}</p></div>` : ''}
            <div class="project-longform__map-shell">
                <article class="ludo-bento__info-card asset-search__map-card project-longform__map-card">
                    <div class="asset-search__map-shell">
                        <div class="asset-search__map-stage" data-asset-map-stage="inline" data-asset-map-default="${escapeHtml(initialMap)}" aria-label="${escapeHtml(block.ariaLabel || 'Interactive asset map preview')}">
                            <div class="asset-search__map-overlay">
                                <div class="asset-search__map-toggle-group" role="group" aria-label="${escapeHtml(block.toggleAriaLabel || 'Map mode')}">
                                    <button class="asset-search__map-toggle${initialMap === 'before' ? ' is-active' : ''}" type="button" data-asset-map-toggle="before" aria-pressed="${initialMap === 'before' ? 'true' : 'false'}">Before DAM</button>
                                    <button class="asset-search__map-toggle${initialMap === 'after' ? ' is-active' : ''}" type="button" data-asset-map-toggle="after" aria-pressed="${initialMap === 'after' ? 'true' : 'false'}">After DAM</button>
                                    <button class="asset-search__map-toggle${initialMap === 'information' ? ' is-active' : ''}" type="button" data-asset-map-toggle="information" aria-pressed="${initialMap === 'information' ? 'true' : 'false'}">Information architecture</button>
                                </div>
                            </div>
                            ${showFooterControls ? `<div class="asset-search__map-footer-controls">
                                ${block.showZoom === false ? '' : `<label class="asset-search__map-zoom" aria-label="Zoom map view">
                                    <span class="asset-search__map-zoom-glyph" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M15.5 15.5 21 21"></path>
                                            <circle cx="10.5" cy="10.5" r="5.75"></circle>
                                        </svg>
                                    </span>
                                    <input class="asset-search__map-zoom-input" type="range" min="0" max="100" value="56" data-asset-map-zoom aria-label="Zoom visualization">
                                </label>`}
                                ${block.showReset === false ? '' : `<button class="asset-search__map-icon-button asset-search__map-reset" type="button" data-asset-map-reset aria-label="Reset map view">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <path d="M20 7v5h-5"></path>
                                        <path d="M20 12a8 8 0 1 1-2.35-5.66L20 7"></path>
                                    </svg>
                                </button>`}
                            </div>` : ''}
                        </div>
                    </div>
                </article>
                ${items.length ? `<div class="project-longform__map-explanations" data-asset-map-copy-panel>
                    <article class="ludo-bento__cta-card asset-search__cta-card project-longform__map-copy-shell" data-asset-map-copy-shell data-active-map="${escapeHtml(initialItem?.mapKey || initialMap)}">
                        <h3 class="project-longform__map-copy-title" data-asset-map-copy-title>${escapeHtml(initialItem?.label || initialItem?.title || '')}</h3>
                        <p class="project-longform__map-copy-body" data-asset-map-copy-body>${escapeHtml(initialItem?.body || '')}</p>
                        <div class="project-longform__map-copy-sources" hidden>${items.map((item) => `<span data-asset-map-copy-source="${escapeHtml(item?.mapKey || 'after')}" data-asset-map-copy-source-title="${escapeHtml(item?.label || item?.title || '')}" data-asset-map-copy-source-body="${escapeHtml(item?.body || '')}"></span>`).join('')}</div>
                    </article>
                </div>` : ''}
            </div>
        </section>`;
}

function renderLongformBlock(block, toRoot, options = {}) {
    if (block?.type === 'expansion-panels') {
        return renderExpansionPanels(block, toRoot);
    }

    if (block?.type === 'artifact-rail') {
        return renderCardGroups(block, toRoot);
    }

    if (block?.type === 'asset-map-stage') {
        return renderAssetMapStage(block, options);
    }

    if (block?.type === 'snackbar-stack') {
        return renderSnackbarStack(block, options);
    }

    return '';
}

function getLegacyMobileLeadMedia(project, hero) {
    const legacyHeroSection = Array.isArray(project.sections)
        ? project.sections.find((section) => section?.type === 'hero')
        : null;
    const sectionMedia = legacyHeroSection?.media;

    if (sectionMedia?.src) {
        return sectionMedia;
    }

    return hero.featureMedia?.src ? hero.featureMedia : null;
}

function renderLegacyMobileLeadMedia(media, toRoot) {
    if (!media?.src) {
        return '';
    }

    if (media.kind === 'youtube' || media.kind === 'iframe') {
        return `
            <iframe
                src="${escapeHtml(media.src)}"
                title="${escapeHtml(media.title || media.alt || 'Embedded project demo')}"
                loading="lazy"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
            ></iframe>`;
    }

    if (media.kind === 'video' || /\.mp4($|\?)/i.test(media.src)) {
        return `
            <video autoplay muted loop playsinline${media.poster ? ` poster="${escapeHtml(resolveAssetPath(media.poster, toRoot))}"` : ''}>
                <source src="${escapeHtml(resolveAssetPath(media.src, toRoot))}" type="video/mp4">
            </video>`;
    }

    return `<img src="${escapeHtml(resolveAssetPath(media.src, toRoot))}" alt="${escapeHtml(media.alt || '')}" loading="lazy" decoding="async">`;
}

function renderLegacyMobileArtifacts(block, toRoot) {
    const groups = Array.isArray(block?.groups) ? block.groups : [];

    if (!groups.length) {
        return '';
    }

    const tabs = groups.map((group, index) => `
        <button class="ludo-mobile__artifacts-tab${index === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" data-ludo-mobile-artifact-tab="${escapeHtml(group.id || '')}">${escapeHtml(group.mobileLabel || group.label || group.id || '')}</button>`).join('');

    const panels = groups.map((group, index) => {
        const cards = resolveRailCards(group);
        const cardsMarkup = cards.length
            ? `<div class="ludo-mobile__card-strip" aria-label="${escapeHtml(group.label || group.id || '')}">${cards.map((card, cardIndex) => {
                const src = resolveAssetPath(card.src, toRoot);
                const name = card.name || card.title || 'artifact';
                return `<button class="ludo-mobile__card-thumb" type="button" data-ludo-mobile-card-trigger data-ludo-card-group="${escapeHtml(group.id || '')}" data-ludo-card-index="${escapeHtml(String(cardIndex))}" aria-label="Open ${escapeHtml(name)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(card.alt || card.title || name)}" loading="lazy" decoding="async" draggable="false"></button>`;
            }).join('')}</div>`
            : `<p class="ludo-mobile__card-empty">${escapeHtml(group.emptyText || 'Artifacts in this lane are still being wired in.')}</p>`;

        return `
            <div class="ludo-mobile__artifacts-panel" data-ludo-mobile-artifact-panel="${escapeHtml(group.id || '')}"${index === 0 ? '' : ' hidden'}>
                ${cardsMarkup}
            </div>`;
    }).join('');

    return `
        <div class="ludo-mobile__artifacts">
            <div class="ludo-mobile__artifacts-tabs" role="tablist" aria-label="Project artifact groups">
                ${tabs}
            </div>
            <div class="ludo-mobile__artifacts-panels">
                ${panels}
            </div>
        </div>`;
}

function renderLegacyMobilePillSections(sections) {
    const normalizedSections = Array.isArray(sections)
        ? sections
            .map((section) => ({
                label: section?.label || '',
                items: Array.isArray(section?.items)
                    ? section.items.filter((item) => item?.title || item?.body)
                    : []
            }))
            .filter((section) => section.items.length)
        : [];

    if (!normalizedSections.length) {
        return '';
    }

    let pillIndex = 0;

    return normalizedSections.map((section) => `
                            <div class="ludo-mobile__journey">
                                <p class="ludo-mobile__section-label">${escapeHtml(section.label)}</p>
                                <div class="ludo-mobile__pills">
                                    ${section.items.map((item, index) => {
                                        const currentIndex = pillIndex++;
                                        return `<button class="ludo-mobile__pill" type="button" data-ludo-mobile-pill="${escapeHtml(String(currentIndex))}" data-m-pill-phase="${escapeHtml(String(index + 1).padStart(2, '0'))}" data-m-pill-title="${escapeHtml(item.title || '')}" data-m-pill-body="${escapeHtml(item.body || '')}">
                                            <span class="ludo-mobile__pill-left"><span class="ludo-mobile__pill-num">${escapeHtml(String(index + 1).padStart(2, '0'))}</span><span class="ludo-mobile__pill-title">${escapeHtml(item.title || '')}</span></span>
                                            <span class="ludo-mobile__pill-arrow" aria-hidden="true">&#8599;</span>
                                        </button>`;
                                    }).join('')}
                                </div>
                            </div>`).join('');
}

function renderLegacyMobileLayout(project, hero, blocks, artifactBlock, toRoot) {
    const tabs = Array.isArray(hero.tabs) ? hero.tabs.filter((tab) => tab?.id && tab?.label && tab?.body) : [];
    const quotes = Array.isArray(hero.quotes) ? hero.quotes.filter((quote) => quote?.text) : [];
    const expansionBlock = blocks.find((block) => block?.type === 'expansion-panels') ?? null;
    const journeyItems = Array.isArray(expansionBlock?.items) ? expansionBlock.items.filter((item) => item?.title || item?.body) : [];
    const leadMedia = getLegacyMobileLeadMedia(project, hero);
    const firstQuote = quotes[0] ?? null;
    const mobileSections = [];

    if (!artifactBlock) {
        mobileSections.push(...blocks
            .filter((block) => block?.type === 'asset-map-stage')
            .map((block) => ({
                label: block.mobileLabel || block.title || 'Process',
                items: (Array.isArray(block.items) ? block.items : [])
                    .filter((item) => item?.title || item?.label || item?.body)
                    .map((item) => ({
                        title: item.title || item.label || '',
                        body: item.body || ''
                    }))
            }))
            .filter((section) => section.items.length));
    }

    if (journeyItems.length) {
        mobileSections.push({
            label: expansionBlock?.mobileLabel || expansionBlock?.title || 'How it was made',
            items: journeyItems.map((item) => ({
                title: item.title || item.ariaLabel || '',
                body: item.body || ''
            }))
        });
    }

    if (!artifactBlock) {
        mobileSections.push(...blocks
            .filter((block) => block?.type === 'snackbar-stack')
            .map((block) => ({
                label: block.mobileLabel || block.title || 'Outcome',
                items: (Array.isArray(block.items) ? block.items : [])
                    .filter((item) => item?.title || item?.label || item?.body)
                    .map((item) => ({
                        title: item.title || item.label || '',
                        body: item.body || ''
                    }))
            }))
            .filter((section) => section.items.length));
    }
    const hasMobileDrawer = mobileSections.length > 0;

    return `
                <div class="ludo-mobile">
                    ${leadMedia ? `<div class="ludo-mobile__video-frame">${renderLegacyMobileLeadMedia(leadMedia, toRoot)}</div>` : ''}
                    <div class="ludo-mobile__body">
                        <header class="ludo-mobile__header">
                            <h1 class="ludo-mobile__title">${escapeHtml(hero.title || project.title)}</h1>
                            ${(Array.isArray(hero.tags) ? hero.tags : []).length ? `<div class="ludo-mobile__tags">${(Array.isArray(hero.tags) ? hero.tags : []).map((tag) => `<span class="ludo-mobile__tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                        </header>
                        ${tabs.length ? `
                            <div class="ludo-mobile__pao">
                                <div class="ludo-mobile__pao-tablist" role="tablist" aria-label="Project summary">
                                    ${tabs.map((tab, index) => `<button class="ludo-mobile__pao-tab${index === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" data-ludo-mobile-pao="${escapeHtml(tab.id)}" data-ludo-mobile-summary="${escapeHtml(tab.body)}">${escapeHtml(tab.label)}</button>`).join('')}
                                </div>
                                <p class="ludo-mobile__pao-text" data-ludo-mobile-pao-text>${escapeHtml(tabs[0].body)}</p>
                            </div>` : ''}
                        ${firstQuote ? `
                            <button class="ludo-mobile__quote" type="button" data-ludo-mobile-quote data-active-quote="0" aria-label="Show next user story">
                                ${quotes.map((quote) => `<span hidden data-ludo-mobile-quote-source data-m-quote-text="${escapeHtml(quote.text)}" data-m-quote-meta="${escapeHtml(quote.attribution || '')}"></span>`).join('')}
                                <span class="ludo-mobile__quote-deck">
                                    <span class="ludo-mobile__quote-layer ludo-mobile__quote-layer--third" aria-hidden="true"></span>
                                    <span class="ludo-mobile__quote-layer ludo-mobile__quote-layer--second" aria-hidden="true"></span>
                                    <span class="ludo-mobile__quote-card">
                                        <span class="ludo-mobile__quote-text" data-ludo-mobile-quote-text>${escapeHtml(firstQuote.text)}</span>
                                        <span class="ludo-mobile__quote-footer">
                                            <span class="ludo-mobile__quote-meta" data-ludo-mobile-quote-meta>${escapeHtml(firstQuote.attribution || '')}</span>
                                            <span class="ludo-mobile__quote-count" data-ludo-mobile-quote-count>1/${quotes.length}</span>
                                        </span>
                                    </span>
                                </span>
                            </button>` : ''}
                        ${renderLegacyMobileArtifacts(artifactBlock, toRoot)}
                        ${renderLegacyMobilePillSections(mobileSections)}
                    </div>
                    ${hasMobileDrawer ? `
                        <div class="ludo-mobile__drawer-overlay" data-ludo-mobile-overlay hidden>
                            <div class="ludo-mobile__drawer" role="dialog" aria-modal="true" aria-label="Section detail">
                                <div class="ludo-mobile__drawer-handle" data-ludo-mobile-close role="button" aria-label="Close" tabindex="0"></div>
                                <p class="ludo-mobile__drawer-phase" data-ludo-mobile-drawer-phase></p>
                                <h2 class="ludo-mobile__drawer-title" data-ludo-mobile-drawer-title></h2>
                                <p class="ludo-mobile__drawer-body" data-ludo-mobile-drawer-body></p>
                            </div>
                        </div>` : ''}
                </div>`;
}

export function renderProjectLongformPage(project, site) {
    const toRoot = '../../';
    const config = getLongformConfig(project);
    const hero = config.hero ?? {};
    const heroTabs = ensureConstraintTab(project, hero);
    const heroWithTabs = { ...hero, tabs: heroTabs };
    const blocks = Array.isArray(config.blocks) ? config.blocks : [];
    const artifactBlock = blocks.find((block) => block?.type === 'artifact-rail') ?? null;
    const topfoldVisualTargetId = artifactBlock?.id || '';
    const themeClass = `theme-${project.theme}`;
    const metaTags = renderMetaTags(project, site);
    const themeBootScript = `<script>(function(){try{var storedTheme=localStorage.getItem('theme');var themeClass=storedTheme==='dark'?'dark-theme':'light-theme';document.documentElement.classList.remove('light-theme','dark-theme');document.documentElement.classList.add(themeClass);}catch(error){document.documentElement.classList.add('light-theme');}})();</script>`;
    const sidebarCopy = getSidebarCopy(project, config);
    const sidebarNavigationItems = getSidebarNavigationItems(config, blocks);
    const sidebarNote = config.sidebar?.note || sidebarNavigationItems.length || config.sidebar?.noteTitle
        ? {
            title: config.sidebar?.noteTitle || 'Navigation',
            copy: config.sidebar?.note || '',
            links: sidebarNavigationItems,
            navAriaLabel: config.sidebar?.navigationAriaLabel || `${project.title} section navigation`,
            open: config.sidebar?.noteOpen ?? (sidebarNavigationItems.length > 0)
        }
        : null;
    const extraStylesMarkup = (Array.isArray(config.extraStyles) ? config.extraStyles : [])
        .map((href) => resolvePageAssetPath(href, toRoot))
        .filter(Boolean)
        .map((href) => `    <link rel="stylesheet" href="${escapeHtml(href)}">`)
        .join('\n');
    const extraScriptsMarkup = (Array.isArray(config.extraScripts) ? config.extraScripts : [])
        .map((src) => resolvePageAssetPath(src, toRoot))
        .filter(Boolean)
        .map((src) => `    <script src="${escapeHtml(src)}" defer></script>`)
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en" class="light-theme">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${metaTags}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Merriweather:wght@400;700;900&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,600;1,6..12,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    ${themeBootScript}
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="../_shared/tailwind-config.js"></script>
    <link rel="stylesheet" href="../_shared/project-reference.css">
    <link rel="stylesheet" href="../_shared/project-system.css">
    <link rel="stylesheet" href="../_shared/project-sidebar-mobile-component.css">
    <link rel="stylesheet" href="../_templates/template-replication/ludo-bento.css">
    <link rel="stylesheet" href="../_templates/project-longform/project-longform.css">
${extraStylesMarkup ? `${extraStylesMarkup}
` : ``}</head>
<body class="project-page project-page--sidebar-layout template-project-longform ${escapeHtml(themeClass)} overflow-x-hidden bg-canvas font-body text-ink antialiased selection:bg-accent selection:text-white">
    <div class="project-page-layout">
${renderProjectSidebar(project, site, toRoot, {
    sidebarCopy,
    sidebarNote,
    sidebarIntroOrder: ['portfolioSection', 'index', 'projectSection', 'birdsSection'],
    footerLogoHref: '#project-topfold'
})}
        <div class="project-page-layout__main">
            <main class="project-longform-stage">
                ${renderProjectTopbar(project, site, toRoot)}
                <div class="project-longform__shell">
                    <section class="project-longform__topfold" id="project-topfold" aria-label="${escapeHtml(hero.title || project.title)} top fold">
                        ${renderTopfoldVisual(hero.leftVisual, 'left', toRoot, topfoldVisualTargetId)}
                        ${renderTopfoldVisual(hero.rightVisual, 'right', toRoot, topfoldVisualTargetId)}
                        <section class="project-longform__hero" id="${escapeHtml(hero.anchorId || 'project-brief')}">
                            <div class="ludo-bento__hero-content project-longform__hero-content">
                                <header class="project-longform__hero-header">
                                    <h1>${escapeHtml(hero.title || project.title)}</h1>
                                    <div class="project-longform__hero-tags">
                                        ${(Array.isArray(hero.tags) ? hero.tags : []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
                                    </div>
                                </header>
                                ${renderHeroTabs(heroTabs)}
                                ${renderQuoteStack(hero.quotes)}
                            </div>
                        </section>
                        ${renderFeatureMedia(hero.featureMedia, toRoot)}
                    </section>
                    <div class="project-longform__body">
                        ${blocks.map((block) => renderLongformBlock(block, toRoot)).join('\n')}
                    </div>
                </div>
                ${renderLegacyMobileLayout(project, heroWithTabs, blocks, artifactBlock, toRoot)}
                ${renderFooterBlock(site, toRoot, { copy: config.footer?.copy })}
            </main>
        </div>
    </div>
    ${artifactBlock ? renderCardLightbox(artifactBlock, toRoot) : ''}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>
    <script src="../_shared/project-page.js" defer></script>
    <script src="../_templates/project-longform/project-longform.js" defer></script>
    <script src="../_templates/template-replication/ludo-bento.js" defer></script>
${extraScriptsMarkup ? `${extraScriptsMarkup}
` : ``}</body>
</html>`;
}


