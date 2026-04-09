import { renderFooterBlock, renderMetaTags, renderProjectSidebar } from '../layout.mjs';
import { escapeHtml, resolveAssetPath, resolveProjectLink } from '../template-utils.mjs';

const leftArrowIconDark = 'Assets/Icons/left-arrow-button-dark.svg';
const leftArrowIconLight = 'Assets/Icons/left-arrow-button-light.svg';
const rightArrowIconDark = 'Assets/Icons/right-arrow-button-dark.svg';
const rightArrowIconLight = 'Assets/Icons/right-arrow-button-light.svg';
const assetVideo = 'Assets/DAM-TE.mp4';

const heroTabs = [
    {
        id: 'problem',
        label: 'Problem',
        summary: 'Graphic assets were scattered across online and offline mediums, making them difficult to share, download, and actually discover when teams needed them fast.'
    },
    {
        id: 'approach',
        label: 'Approach',
        summary: 'The concept reorganizes discovery around a system map for business domains, then pairs it with a stricter metadata tree so users can browse by relationship before they even type a query.'
    },
    {
        id: 'outcome',
        label: 'Outcome',
        summary: 'A calmer search experience with clearer project branches, reusable metadata patterns, and faster onboarding for anyone entering the library for the first time.'
    }
];

const storyCards = [
    {
        text: 'I need to know whether the brochure already exists before I ask three different teams for it.',
        attribution: 'Marketing lead'
    },
    {
        text: 'When I onboard to a new project, I should be able to browse its asset universe without learning hidden folder rules first.',
        attribution: 'New team member'
    },
    {
        text: 'I want to filter by project, asset type, and approval stage in one pass instead of opening file after file.',
        attribution: 'Sales and brochures'
    },
    {
        text: 'If metadata is strong, I should discover related assets even when I do not remember the exact project name.',
        attribution: 'Cross-functional search'
    }
];

const videoFrames = [
    {
        caption: 'Searching across mixed libraries',
        type: 'youtube',
        videoId: 'jNkDPHw7K7k',
        modifier: ''
    },
    {
        caption: 'Uploading with structured metadata',
        type: 'youtube',
        videoId: 'hsx1RTGIdws',
        modifier: ' asset-search__video-frame--alt'
    },
    {
        caption: 'Filters surface the right asset faster',
        type: 'local',
        rate: '0.76',
        startAt: '11.4',
        modifier: ' asset-search__video-frame--muted',
        src: assetVideo
    }
];

const outcomeColumns = [
    {
        title: 'Easier Access',
        body: 'What used to take tracking down people with the relevant files now becomes one asynchronous scan across searchable systems, making favorites easier to filter.'
    },
    {
        title: 'Faster Turnaround',
        body: 'Delivery pipelines stop getting blocked by missing references or hidden assets, so sales folders can be pulled faster and project campaigns keep moving.'
    },
    {
        title: 'Faster Onboarding',
        body: 'For a new employee, understanding project libraries, accessing brochures, or marketing material now takes weeks less because the structure explains itself.'
    }
];

function getSiblingProjects(project, site) {
    const projectEntries = site.moreProjects.filter((entry) => entry?.link?.type === 'project');
    const currentIndex = projectEntries.findIndex((entry) => entry.slug === project.slug);

    if (currentIndex === -1 || projectEntries.length < 2) {
        return { previous: null, next: null };
    }

    return {
        previous: projectEntries[(currentIndex - 1 + projectEntries.length) % projectEntries.length],
        next: projectEntries[(currentIndex + 1) % projectEntries.length]
    };
}

function renderProjectArrow(entry, direction, currentSlug, toRoot) {
    if (!entry) {
        return '<div class="ludo-bento__nav-arrow ludo-bento__nav-arrow--empty" aria-hidden="true"></div>';
    }

    const href = resolveProjectLink(entry.link, currentSlug, toRoot);
    const label = direction === 'previous' ? 'Prev. Project' : 'Next Project';
    const darkIcon = direction === 'previous' ? leftArrowIconDark : rightArrowIconDark;
    const lightIcon = direction === 'previous' ? leftArrowIconLight : rightArrowIconLight;

    return `
        <a class="ludo-bento__nav-arrow" href="${escapeHtml(href)}" aria-label="${escapeHtml(label)}: ${escapeHtml(entry.title)}">
            <span class="ludo-bento__nav-arrow-ring" aria-hidden="true">
                <img class="ludo-bento__nav-arrow-icon ludo-bento__nav-arrow-icon--dark" src="${escapeHtml(resolveAssetPath(darkIcon, toRoot))}" alt="" loading="lazy" decoding="async">
                <img class="ludo-bento__nav-arrow-icon ludo-bento__nav-arrow-icon--light" src="${escapeHtml(resolveAssetPath(lightIcon, toRoot))}" alt="" loading="lazy" decoding="async">
            </span>
            <span class="ludo-bento__nav-arrow-label">${escapeHtml(label)}</span>
            <span class="ludo-bento__nav-arrow-title">${escapeHtml(entry.title)}</span>
        </a>`;
}

function renderHeroTabs() {
    const buttons = heroTabs.map((tab, index) => `
        <button
            class="ludo-bento__hero-tab${index === 0 ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            aria-controls="asset-search-hero-panel-${escapeHtml(tab.id)}"
            id="asset-search-hero-tab-${escapeHtml(tab.id)}"
            data-ludo-hero-tab="${escapeHtml(tab.id)}"
        >${escapeHtml(tab.label)}</button>`).join('');

    const panels = heroTabs.map((tab, index) => `
        <div
            class="ludo-bento__hero-panel-body${index === 0 ? ' is-active' : ''}"
            id="asset-search-hero-panel-${escapeHtml(tab.id)}"
            role="tabpanel"
            aria-labelledby="asset-search-hero-tab-${escapeHtml(tab.id)}"
            ${index === 0 ? '' : 'hidden'}
            data-ludo-hero-panel="${escapeHtml(tab.id)}"
        >
            <p class="ludo-bento__hero-summary">${escapeHtml(tab.summary)}</p>
        </div>`).join('');

    return `
        <div class="ludo-bento__hero-tabs" role="tablist" aria-label="Asset Search project summary tabs">${buttons}
        </div>
        <div class="ludo-bento__hero-panels">${panels}
        </div>`;
}

function renderQuoteStack() {
    const firstQuote = storyCards[0];

    return `
        <button class="ludo-bento__quote-stack" type="button" data-ludo-quote-stack data-active-quote="0" aria-label="Show next asset search story">
            ${storyCards.map((quote, index) => `
                <span hidden data-ludo-quote-source data-ludo-quote-index="${index}" data-ludo-quote-source-text="${escapeHtml(quote.text)}" data-ludo-quote-source-meta="${escapeHtml(quote.attribution)}"></span>`).join('')}
            <span class="ludo-bento__quote-deck">
                <span class="ludo-bento__quote-layer ludo-bento__quote-layer--third" aria-hidden="true"></span>
                <span class="ludo-bento__quote-layer ludo-bento__quote-layer--second" aria-hidden="true"></span>
                <span class="ludo-bento__quote-card">
                    <span class="ludo-bento__quote-text" data-ludo-quote-current-text>${escapeHtml(firstQuote.text)}</span>
                    <span class="ludo-bento__quote-footer">
                        <span class="ludo-bento__quote-meta" data-ludo-quote-current-meta>${escapeHtml(firstQuote.attribution)}</span>
                        <span class="ludo-bento__quote-count" data-ludo-quote-current-count>1/${storyCards.length}</span>
                    </span>
                </span>
            </span>
        </button>`;
}

function buildYouTubeEmbedUrl(videoId, options = {}) {
    const {
        autoplay = false,
        controls = true,
        loop = false,
        muted = false
    } = options;
    const params = [
        'rel=0',
        'modestbranding=1',
        'playsinline=1',
        'iv_load_policy=3',
        `autoplay=${autoplay ? '1' : '0'}`,
        `controls=${controls ? '1' : '0'}`
    ];

    if (muted) {
        params.push('mute=1');
    }

    if (loop) {
        params.push('loop=1');
        params.push(`playlist=${encodeURIComponent(videoId)}`);
    }

    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.join('&')}`;
}

function renderVideoFrames(toRoot) {
    return videoFrames.map((frame) => {
        const title = `${frame.caption} demo`;
        const buttonData = frame.type === 'youtube'
            ? `data-asset-video-provider="youtube" data-asset-video-id="${escapeHtml(frame.videoId)}"`
            : `data-asset-video-provider="local" data-asset-video-src="${escapeHtml(resolveAssetPath(frame.src, toRoot))}"`;

        const mediaMarkup = frame.type === 'youtube'
            ? `<iframe
                class="asset-search__video-media asset-search__video-media--embed"
                src="${escapeHtml(buildYouTubeEmbedUrl(frame.videoId, { autoplay: true, controls: false, loop: true, muted: true }))}"
                title="${escapeHtml(title)} preview"
                loading="eager"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowfullscreen
                tabindex="-1"
            ></iframe>`
            : `<video class="asset-search__video-media" autoplay muted loop playsinline preload="auto" data-asset-video-rate="${escapeHtml(frame.rate)}" data-asset-video-start="${escapeHtml(frame.startAt)}">
                <source src="${escapeHtml(resolveAssetPath(frame.src, toRoot))}" type="video/mp4">
            </video>`;

        return `
        <figure class="ludo-bento__video-frame asset-search__video-frame${frame.modifier}">
            ${mediaMarkup}
            <button class="asset-search__video-link" type="button" ${buttonData} data-asset-video-title="${escapeHtml(title)}" aria-label="Expand video for ${escapeHtml(frame.caption)}" data-asset-video-expand>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M8 3H3v5"></path>
                    <path d="M3 3l7 7"></path>
                    <path d="M16 3h5v5"></path>
                    <path d="M21 3l-7 7"></path>
                    <path d="M8 21H3v-5"></path>
                    <path d="M3 21l7-7"></path>
                    <path d="M16 21h5v-5"></path>
                    <path d="M21 21l-7-7"></path>
                </svg>
            </button>
            <figcaption class="asset-search__video-caption">${escapeHtml(frame.caption)}</figcaption>
        </figure>`;
    }).join('');
}

function renderOutcomeCards() {
    return outcomeColumns.map((card) => `
        <article class="ludo-bento__cta-card asset-search__cta-card">
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.body)}</p>
        </article>`).join('');
}

function renderSectionPills() {
    return `
        <div id="section-pills" class="section-pill-bar" aria-hidden="true">
            <div class="section-pill-bar__inner">
                <a href="#overview" class="section-pill is-active" data-section="overview" data-section-nav-link>Overview</a>
                <a href="#maps" class="section-pill" data-section="maps" data-section-nav-link>Maps</a>
                <a href="#impact" class="section-pill" data-section="impact" data-section-nav-link>Impact</a>
            </div>
        </div>`;
}

export function renderAssetSearchBentoPage(project, site) {
    const toRoot = '../../';
    const metaTags = renderMetaTags(project, site);
    const { previous, next } = getSiblingProjects(project, site);
    const themeBootScript = `<script>(function(){try{var storedTheme=localStorage.getItem('theme');var themeClass=storedTheme==='light'?'light-theme':'dark-theme';document.documentElement.classList.remove('light-theme','dark-theme');document.documentElement.classList.add(themeClass);}catch(error){document.documentElement.classList.add('dark-theme');}})();</script>`;

    return `<!DOCTYPE html>
<html lang="en" class="dark-theme">
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
    <link rel="stylesheet" href="./asset-search.css">
</head>
<body class="project-page project-page--sidebar-layout template-ludo-bento theme-art overflow-x-hidden bg-canvas font-body text-ink antialiased selection:bg-accent selection:text-white">
${renderSectionPills()}
    <div class="project-page-layout">
${renderProjectSidebar(project, site, toRoot, { includeTail: false })}
        <div class="project-page-layout__main">
            <main class="ludo-bento-stage">
                <button class="ludo-bento__theme-toggle project-theme-toggle" data-theme-toggle aria-label="Toggle theme">
                    <span class="project-theme-toggle__cap" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="moon-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="sun-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    </span>
                </button>
                <div class="ludo-bento asset-search-bento" aria-label="Asset Search bento layout">
                    <div class="ludo-bento__video-row">
                        ${renderVideoFrames(toRoot)}
                    </div>
                    <div class="ludo-bento__topfold">
                        <section class="ludo-bento__hero-card asset-search__hero" id="overview">
                            <div class="ludo-bento__hero-content">
                                <header class="ludo-bento__hero-header">
                                    <h1>Asset Search</h1>
                                    <div class="ludo-bento__hero-tags">
                                        <span>Taxonomy</span>
                                        <span>Information Architecture</span>
                                    </div>
                                </header>
                                ${renderHeroTabs()}
                                <div class="asset-search__story-stack">
                                    ${renderQuoteStack()}
                                </div>
                            </div>
                        </section>
                        <section class="ludo-bento__top-grid asset-search__map-grid" id="maps">
                            <article class="ludo-bento__info-card asset-search__map-card">
                                <div class="asset-search__map-shell">
                                    <div class="asset-search__map-stage" data-asset-map-stage="inline" aria-label="Interactive asset map preview">
                                        <div class="asset-search__map-overlay">
                                            <div class="asset-search__map-toggle-group" role="group" aria-label="Map mode">
                                                <button class="asset-search__map-toggle" type="button" data-asset-map-toggle="before" aria-pressed="false">Before DAM</button>
                                                <button class="asset-search__map-toggle is-active" type="button" data-asset-map-toggle="after" aria-pressed="true">After DAM</button>
                                                <button class="asset-search__map-toggle" type="button" data-asset-map-toggle="information" aria-pressed="false">Information architecture</button>
                                            </div>
                                            <div class="asset-search__map-action-stack">
                                                <button class="asset-search__map-toggle asset-search__map-reset" type="button" data-asset-map-reset>Reset</button>
                                                <button class="asset-search__expand-button" type="button" data-asset-map-expand aria-label="Expand map to fullscreen">
                                                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                        <path d="M8 3H3v5"></path><path d="M3 3l7 7"></path><path d="M16 3h5v5"></path><path d="M21 3l-7 7"></path><path d="M8 21H3v-5"></path><path d="M3 21l7-7"></path><path d="M16 21h5v-5"></path><path d="M21 21l-7-7"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </section>
                    </div>
                    <section class="ludo-bento__actions-row" id="impact">
                        ${renderProjectArrow(previous, 'previous', project.slug, toRoot)}
                        <div class="ludo-bento__actions-grid">
                            ${renderOutcomeCards()}
                        </div>
                        ${renderProjectArrow(next, 'next', project.slug, toRoot)}
                    </section>
                </div>
            </main>
            ${renderFooterBlock(site, toRoot)}
        </div>
    </div>
    <div class="asset-search__modal" id="asset-search-map-modal" hidden>
        <div class="asset-search__modal-shell" role="dialog" aria-modal="true" aria-label="Expanded asset map">
            <div class="asset-search__modal-stage">
                <div class="asset-search__map-stage" data-asset-map-stage="modal" aria-label="Expanded asset map preview">
                    <div class="asset-search__map-overlay">
                        <div class="asset-search__map-toggle-group" role="group" aria-label="Fullscreen map mode">
                            <button class="asset-search__map-toggle" type="button" data-asset-map-toggle="before" aria-pressed="false">Before DAM</button>
                            <button class="asset-search__map-toggle is-active" type="button" data-asset-map-toggle="after" aria-pressed="true">After DAM</button>
                            <button class="asset-search__map-toggle" type="button" data-asset-map-toggle="information" aria-pressed="false">Information architecture</button>
                        </div>
                        <div class="asset-search__map-action-stack">
                            <button class="asset-search__map-toggle asset-search__map-reset" type="button" data-asset-map-reset>Reset</button>
                            <button class="asset-search__expand-button asset-search__modal-dismiss" type="button" data-asset-map-close aria-label="Close fullscreen map">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M6 6l12 12"></path>
                                    <path d="M18 6L6 18"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="asset-search__video-modal" id="asset-search-video-modal" hidden>
        <div class="asset-search__video-modal-shell" role="dialog" aria-modal="true" aria-labelledby="asset-search-video-modal-title">
            <div class="asset-search__map-header asset-search__video-modal-header">
                <div>
                    <p class="asset-search__map-kicker">Fullscreen playback</p>
                    <h2 class="asset-search__map-title" id="asset-search-video-modal-title" data-asset-video-modal-title>Asset Search video</h2>
                    <p class="asset-search__map-copy" data-asset-video-modal-copy>Playback opens inside a fullscreen lightbox so the demo stays in context.</p>
                </div>
                <button class="asset-search__map-toggle asset-search__modal-close" type="button" data-asset-video-close>Close</button>
            </div>
            <div class="asset-search__video-modal-stage" data-asset-video-modal-stage aria-live="polite"></div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>
    <script src="../_shared/project-page.js" defer></script>
    <script src="../_templates/template-replication/ludo-bento.js" defer></script>
    <script src="./asset-search.js" defer></script>
</body>
</html>`;
}





