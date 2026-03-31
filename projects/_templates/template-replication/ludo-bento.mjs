import { renderFooterBlock, renderMetaTags } from '../layout.mjs';
import { escapeHtml, resolveAssetPath, resolveProjectLink } from '../template-utils.mjs';

const expansionIconDark = 'Assets/Icons/expansion-arrow-button-dark.svg';
const expansionIconLight = 'Assets/Icons/expansion-arrow-button-light.svg';
const collapseIconDark = 'Assets/Icons/collapse-arrow-button-dark.svg';
const collapseIconLight = 'Assets/Icons/collapse-arrow-button-light.svg';
const leftArrowIconDark = 'Assets/Icons/left-arrow-button-dark.svg';
const leftArrowIconLight = 'Assets/Icons/left-arrow-button-light.svg';
const rightArrowIconDark = 'Assets/Icons/right-arrow-button-dark.svg';
const rightArrowIconLight = 'Assets/Icons/right-arrow-button-light.svg';

const heroTabs = [
    {
        id: 'problem',
        label: 'Problem',
        summary: 'Classic Ludo often leaves too much to chance, which elevates tension before the dice roll but limits tactical depth and player agency.'
    },
    {
        id: 'approach',
        label: 'Approach',
        summary: 'RPG mechanics, narrative framing, and deck-based abilities were layered onto the familiar loop so each turn could reward foresight instead of a single lucky throw.'
    },
    {
        id: 'outcome',
        label: 'Outcome',
        summary: 'Intentional, immersive play rooted in decision making, tradeoff acknowledgement, and player agency.'
    }
];

const quoteCards = [
    {
        text: 'I do not feel like I have control over the board, you roll a dice and choose which token to move. That is all.',
        attribution: 'anonymous - 28 years old'
    },
    {
        text: "It's frustrating to wait for a 1 or 6 to get my pawn out, feels like I'm losing before the game even begins.",
        attribution: 'playtester, age 12'
    },
    {
        text: "when someone takes out my token right before the safe passage to the finish, I'm helpless.",
        attribution: 'anonymous, age 11'
    },
    {
        text: "I'd love a reason to care about which pawn to move, not just which one is safest",
        attribution: 'playtester, age 29'
    }
];

const narrativeTerrains = [
    { label: 'Mountains', tone: 'sun' },
    { label: 'Oceans', tone: 'sea' },
    { label: 'Valleys', tone: 'leaf' },
    { label: 'Sky', tone: 'gold' }
];

const boardGameStats = [
    { src: 'Assets/Icons/armor-1.png', label: 'Armour' },
    { src: 'Assets/Icons/weapons-1.png', label: 'Weapons' },
    { src: 'Assets/Icons/hitpoints-1.png', label: 'Hitpoints' }
];

const developmentPhases = [
    { phase: 'Phase 01', text: 'Remote Multiplayer' },
    { phase: 'Phase 02', text: 'Characters' },
    { phase: 'Phase 03', text: 'Traps & Events' }
];

const developmentTimeline = [
    { phase: 'Phase 01', title: 'Remote Multiplayer', status: 'Live', tone: 'live' },
    { phase: 'Phase 02', title: 'Characters', status: 'In Progress', tone: 'progress' },
    { phase: 'Phase 03', title: 'Traps & Events', status: 'TBD', tone: 'tbd' }
];

const infoCards = [
    {
        id: 'narrative-design',
        origin: 'left',
        ariaLabel: 'Narrative Design',
        titleHtml: 'Narrative<br>Design',
        body: 'The building blocks of a basic story - the hero\'s journey, factions, spatial context - already exist in Classic Ludo. We just never saw it that way. We rolled dice, raced pawns, and took out competition when the dice gods let us. It is nostalgic, and I felt something was missing - lore.',
        compactKind: 'legend',
        compactPlacement: 'flow',
        expandedColumns: [
            {
                title: 'Worldbuilding Hooks',
                body: 'Terrain names turned each lane into a setting cue, which helped movement feel more like traversal through regions than a color-coded sprint.'
            },
            {
                title: 'Narrative Payoff',
                body: 'That framing opened room for quests, regional hazards, and card abilities that could feel anchored to the world instead of randomly assigned to a pawn.'
            }
        ]
    },
    {
        id: 'board-game-design',
        origin: 'center',
        ariaLabel: 'Board Game Design',
        titleHtml: 'Board Game<br>Design',
        body: 'Ludo Cards was born from the idea of adding RPG elements to Classic Ludo. A familiar game gets more interesting when players can plan instead of only react.',
        compactKind: 'stats',
        compactPlacement: 'flow',
        expandedColumns: [
            {
                title: 'Placeholder 01',
                body: 'Placeholder copy for balancing combat loops, reward pacing, and how defensive tools should offset aggressive play.'
            },
            {
                title: 'Placeholder 02',
                body: 'Placeholder copy for encounter tuning, item economy, and how player decisions stay legible across longer matches.'
            }
        ]
    },
    {
        id: 'digital-development',
        origin: 'right',
        ariaLabel: 'Digital Development',
        titleHtml: 'Digital<br>Development',
        body: 'By playtesting the physical game, I realised that the characters, action cards, traps, and board events were too complex for players to keep track of. There was now a need for a digital game.',
        compactKind: 'development',
        compactPlacement: 'flow',
        expandedColumns: []
    }
];

const actionCards = [
    {
        title: 'Web App Prototype',
        body: 'Interactive prototype with remote multiplayer live.',
        cta: 'Play'
    },
    {
        title: 'Reflections',
        body: 'Notes accumulated through the journey. Challenges, constraints, workarounds.',
        cta: 'Read'
    },
    {
        title: 'Expansion Pack',
        body: 'A card expansion pack that you can download, print, and play.',
        cta: 'Download'
    }
];

function toTitleCase(value) {
    return value
        .split('-')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

const characterRoleOrder = ['speed', 'tank', 'assassin', 'cleric', 'necromancer', 'mystic'];

const characterRoleLabels = {
    speed: 'Speedster',
    tank: 'Tank',
    assassin: 'Assassin',
    cleric: 'Cleric',
    necromancer: 'Necromancer',
    mystic: 'Mystic'
};

const characterRoleBodies = {
    speed: 'These kits are tuned for momentum, lane pressure, and fast repositioning across the board.',
    tank: 'These kits are built around endurance, threat absorption, and holding tactical space for longer.',
    assassin: 'These kits sharpen timing, precision, and opportunistic plays that punish hesitation.',
    cleric: 'These kits focus on sustain, recovery, and stabilising a match after a costly swing.',
    necromancer: 'These kits lean into attrition, lingering threat, and consequences that outlast a single turn.',
    mystic: 'These kits widen the decision space with flexible abilities, layered effects, and high agency turns.'
};

function getCharacterRoleOrder(role) {
    const order = characterRoleOrder.indexOf(role);
    return order === -1 ? characterRoleOrder.length : order;
}

function buildCharacterBody(name, roleKey, roleLabel) {
    return `${name} explores the ${roleLabel.toLowerCase()} archetype inside the Ludo RPG system. ${characterRoleBodies[roleKey] || 'This pass focuses on how the role should feel in motion, timing, and board presence.'} The fullscreen viewer pairs the flat exploration with its stylised alternate so both visual directions can be compared in motion and detail.`;
}

const characterIteration01FlatCards = [
    'character-flat-bhairava-necromancer.jpg',
    'character-flat-chemban-tank.jpg',
    'character-flat-gargi-mystic.jpg',
    'character-flat-gulbahar-speed.jpg',
    'character-flat-ilango-mystic.jpg',
    'character-flat-kabir-mystic.jpg',
    'character-flat-kali-assassin.jpg',
    'character-flat-kalya-assassin.jpg',
    'character-flat-kaveri-cleric.jpg',
    'character-flat-maari-tank.jpg',
    'character-flat-maya-assassin.jpg',
    'character-flat-nishi-necromancer.jpg',
    'character-flat-noorjehan-tank.jpg',
    'character-flat-prasanna-cleric.jpg',
    'character-flat-pratima-tank.jpg',
    'character-flat-rafi-mystic.jpg',
    'character-flat-raktim-assassin.jpg',
    'character-flat-tariq-speed.jpg',
    'character-flat-veera-speed.jpg',
    'character-flat-velan-speed.jpg'
].map((filename) => {
    const slug = filename
        .replace(/^character-flat-/, '')
        .replace(/\.[^.]+$/, '');
    const segments = slug.split('-');
    const role = segments[segments.length - 1];
    const name = toTitleCase(segments.slice(0, -1).join('-'));
    const roleLabel = characterRoleLabels[role] || toTitleCase(role);

    return {
        id: slug,
        name,
        role,
        roleLabel,
        title: `${name} / ${roleLabel}`,
        body: buildCharacterBody(name, role, roleLabel),
        src: `Assets/ludo-rpg-cards/characters-iteration-01-flat/${filename}`,
        altSrc: `Assets/ludo-rpg-cards/character-iteration-01-stylised/${filename.replace('character-flat-', 'character-stylised-')}`,
        alt: `Ludo RPG flat character card ${name} ${roleLabel}`
    };
}).sort((left, right) => {
    const roleDifference = getCharacterRoleOrder(left.role) - getCharacterRoleOrder(right.role);
    return roleDifference || left.name.localeCompare(right.name);
});

const cardGroups = [
    { id: 'characters-01', label: 'Characters Iteration 01', cards: characterIteration01FlatCards },
    { id: 'characters-02', label: 'Characters Iteration 02', cards: [] },
    { id: 'trap-cards', label: 'Trap Cards', cards: [] },
    { id: 'action-cards', label: 'Action Cards', cards: [] }
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

function renderExpandButton(toRoot) {
    return `
        <span class="ludo-bento__expand-button" aria-hidden="true">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--expand-dark" src="${escapeHtml(resolveAssetPath(expansionIconDark, toRoot))}" alt="" loading="lazy" decoding="async">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--expand-light" src="${escapeHtml(resolveAssetPath(expansionIconLight, toRoot))}" alt="" loading="lazy" decoding="async">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--collapse-dark" src="${escapeHtml(resolveAssetPath(collapseIconDark, toRoot))}" alt="" loading="lazy" decoding="async">
            <img class="ludo-bento__expand-button-icon ludo-bento__expand-button-icon--collapse-light" src="${escapeHtml(resolveAssetPath(collapseIconLight, toRoot))}" alt="" loading="lazy" decoding="async">
        </span>`;
}

function renderHeroTabs() {
    const buttons = heroTabs.map((tab, index) => `
        <button
            class="ludo-bento__hero-tab${index === 0 ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            aria-controls="ludo-hero-panel-${escapeHtml(tab.id)}"
            id="ludo-hero-tab-${escapeHtml(tab.id)}"
            data-ludo-hero-tab="${escapeHtml(tab.id)}"
        >${escapeHtml(tab.label)}</button>`).join('');

    const panels = heroTabs.map((tab, index) => `
        <div
            class="ludo-bento__hero-panel-body${index === 0 ? ' is-active' : ''}"
            id="ludo-hero-panel-${escapeHtml(tab.id)}"
            role="tabpanel"
            aria-labelledby="ludo-hero-tab-${escapeHtml(tab.id)}"
            ${index === 0 ? '' : 'hidden'}
            data-ludo-hero-panel="${escapeHtml(tab.id)}"
        >
            <p class="ludo-bento__hero-summary">${escapeHtml(tab.summary)}</p>
        </div>`).join('');

    return `
        <div class="ludo-bento__hero-tabs" role="tablist" aria-label="Ludo Cards project summary tabs">${buttons}
        </div>
        <div class="ludo-bento__hero-panels">${panels}
        </div>`;
}

function renderQuoteStack() {
    const firstQuote = quoteCards[0];

    return `
        <button class="ludo-bento__quote-stack" type="button" data-ludo-quote-stack data-active-quote="0" aria-label="Show next playtester quote">
            ${quoteCards.map((quote, index) => `
                <span hidden data-ludo-quote-source data-ludo-quote-index="${index}" data-ludo-quote-source-text="${escapeHtml(quote.text)}" data-ludo-quote-source-meta="${escapeHtml(quote.attribution)}"></span>`).join('')}
            <span class="ludo-bento__quote-deck">
                <span class="ludo-bento__quote-layer ludo-bento__quote-layer--third" aria-hidden="true"></span>
                <span class="ludo-bento__quote-layer ludo-bento__quote-layer--second" aria-hidden="true"></span>
                <span class="ludo-bento__quote-card">
                    <span class="ludo-bento__quote-text" data-ludo-quote-current-text>${escapeHtml(firstQuote.text)}</span>
                    <span class="ludo-bento__quote-footer">
                        <span class="ludo-bento__quote-meta" data-ludo-quote-current-meta>${escapeHtml(firstQuote.attribution)}</span>
                        <span class="ludo-bento__quote-count" data-ludo-quote-current-count>1/${quoteCards.length}</span>
                    </span>
                </span>
            </span>
        </button>`;
}

function renderInfoCardSupport(card, toRoot) {
    const classes = ['ludo-bento__info-card-support'];
    classes.push(card.compactPlacement === 'flow' ? 'ludo-bento__info-card-support--flow' : 'ludo-bento__info-card-support--pinned');

    if (card.hideCompactOnExpand) {
        classes.push('ludo-bento__info-card-support--hide-on-expand');
    }

    if (card.compactKind === 'legend') {
        return `
            <div class="${classes.join(' ')} ludo-bento__legend-grid">
                ${narrativeTerrains.map((item) => `
                    <span class="ludo-bento__legend-item">
                        <span class="ludo-bento__legend-dot ludo-bento__legend-dot--${escapeHtml(item.tone)}"></span>
                        ${escapeHtml(item.label)}
                    </span>`).join('')}
            </div>`;
    }

    if (card.compactKind === 'stats') {
        return `
            <div class="${classes.join(' ')} ludo-bento__stat-grid">
                ${boardGameStats.map((item) => `
                    <span class="ludo-bento__stat-item">
                        <span class="ludo-bento__stat-icon-frame" aria-hidden="true">
                            <img src="${escapeHtml(resolveAssetPath(item.src, toRoot))}" alt="" loading="lazy" decoding="async">
                        </span>
                        <span>${escapeHtml(item.label)}</span>
                    </span>`).join('')}
            </div>`;
    }

    if (card.compactKind === 'development') {
        return `
            <div class="${classes.join(' ')} ludo-bento__development-support">
                <div class="ludo-bento__development-block">
                    <h3 class="ludo-bento__support-heading">Vibe Coded Prototype</h3>
                    ${renderInfoTimelineColumn({ timeline: developmentTimeline })}
                </div>
            </div>`;
    }

    return `
        <div class="${classes.join(' ')} ludo-bento__phase-list">
            ${developmentPhases.map((item) => `
                <div class="ludo-bento__phase-item">
                    <span>${escapeHtml(item.phase)}</span>
                    <strong>${escapeHtml(item.text)}</strong>
                </div>`).join('')}
        </div>`;
}

function renderInfoTimelineColumn(column) {
    return `
        <div class="ludo-bento__timeline">
            ${column.timeline.map((item, index) => `
                <div class="ludo-bento__timeline-item">
                    <span class="ludo-bento__timeline-rail" aria-hidden="true">
                        <span class="ludo-bento__timeline-dot ludo-bento__timeline-dot--${escapeHtml(item.tone)}"></span>
                        ${index === column.timeline.length - 1 ? '' : '<span class="ludo-bento__timeline-line"></span>'}
                    </span>
                    <span class="ludo-bento__timeline-copy">
                        <span class="ludo-bento__timeline-phase">${escapeHtml(item.phase)}</span>
                        <strong class="ludo-bento__timeline-title">${escapeHtml(item.title)}</strong>
                        <span class="ludo-bento__timeline-status"><span class="ludo-bento__timeline-status-dot ludo-bento__timeline-status-dot--${escapeHtml(item.tone)}" aria-hidden="true"></span>${escapeHtml(item.status)}</span>
                    </span>
                </div>`).join('')}
        </div>`;
}

function renderInfoCardExpandedColumns(card) {
    if (!Array.isArray(card.expandedColumns) || card.expandedColumns.length === 0) {
        return '';
    }

    return `
        <div class="ludo-bento__info-card-expanded">
            ${card.expandedColumns.map((column) => `
                <div class="ludo-bento__info-column">
                    <h3>${escapeHtml(column.title)}</h3>
                    ${column.type === 'timeline'
                        ? renderInfoTimelineColumn(column)
                        : `<p>${escapeHtml(column.body)}</p>`}
                </div>`).join('')}
        </div>`;
}

function renderInfoCard(card, toRoot) {
    return `
        <article class="ludo-bento__info-card" data-ludo-info-card data-ludo-info-origin="${escapeHtml(card.origin)}" data-active="false" data-expanded-content="false" tabindex="0" role="button" aria-expanded="false" aria-label="Expand section card: ${escapeHtml(card.ariaLabel)}">
            <div class="ludo-bento__info-card-shell">
                <div class="ludo-bento__info-card-main">
                    <div class="ludo-bento__info-card-copy">
                        <h2>${card.titleHtml}</h2>
                        <p>${escapeHtml(card.body)}</p>
                        ${renderInfoCardSupport(card, toRoot)}
                    </div>
                </div>
                ${renderInfoCardExpandedColumns(card)}
            </div>
            ${renderExpandButton(toRoot)}
        </article>`;
}

function renderArtifactCard(card, groupId, index, toRoot) {
    const flatSrc = resolveAssetPath(card.src, toRoot);
    const stylisedSrc = resolveAssetPath(card.altSrc, toRoot);

    return `
        <button
            class="ludo-bento__card-frame"
            type="button"
            data-ludo-card-trigger
            data-ludo-card-group="${escapeHtml(groupId)}"
            data-ludo-card-index="${escapeHtml(String(index))}"
            data-ludo-card-id="${escapeHtml(card.id)}"
            data-ludo-card-title="${escapeHtml(card.title)}"
            data-ludo-card-name="${escapeHtml(card.name)}"
            data-ludo-card-role="${escapeHtml(card.roleLabel)}"
            data-ludo-card-body="${escapeHtml(card.body)}"
            data-ludo-card-flat="${escapeHtml(flatSrc)}"
            data-ludo-card-stylised="${escapeHtml(stylisedSrc)}"
            aria-label="Open ${escapeHtml(card.title)} in fullscreen viewer"
        >
            <img src="${escapeHtml(flatSrc)}" alt="${escapeHtml(card.alt)}" loading="lazy" decoding="async" draggable="false">
        </button>`;
}

function renderCardGroups(toRoot) {
    const buttons = cardGroups.map((group, index) => `
        <button
            class="ludo-bento__rail-tab${index === 0 ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            aria-controls="ludo-card-group-${escapeHtml(group.id)}"
            id="ludo-card-tab-${escapeHtml(group.id)}"
            data-ludo-card-tab="${escapeHtml(group.id)}"
        >${escapeHtml(group.label)}</button>`).join('');

    const groups = cardGroups.map((group, index) => {
        const cardsMarkup = group.cards.length
            ? group.cards.map((card, cardIndex) => renderArtifactCard(card, group.id, cardIndex, toRoot)).join('')
            : `<p class="ludo-bento__card-empty">Artifacts in this lane are still being wired in.</p>`;

        return `
        <div
            class="ludo-bento__card-group${index === 0 ? ' is-active' : ''}"
            id="ludo-card-group-${escapeHtml(group.id)}"
            role="tabpanel"
            aria-labelledby="ludo-card-tab-${escapeHtml(group.id)}"
            ${index === 0 ? '' : 'hidden'}
            data-ludo-card-panel="${escapeHtml(group.id)}"
        >
            <div class="ludo-bento__card-strip${group.cards.length ? '' : ' is-empty'}" tabindex="0" aria-label="${escapeHtml(group.label)} image strip">
                ${cardsMarkup}
            </div>
        </div>`;
    }).join('');

    return `
        <div class="ludo-bento__rail-header">
            <div class="ludo-bento__rail-tabs" role="tablist" aria-label="Ludo RPG asset groups">${buttons}
            </div>
        </div>
        <div class="ludo-bento__rail-panels">${groups}
        </div>`;
}

function renderCardLightbox() {
    return `
    <div class="ludo-bento__lightbox" data-ludo-lightbox hidden aria-hidden="true">
        <section class="ludo-bento__lightbox-shell" role="dialog" aria-modal="true" aria-label="Fullscreen character viewer">
            <button class="ludo-bento__lightbox-close" type="button" data-ludo-lightbox-close aria-label="Close fullscreen character viewer">X</button>
            <button class="ludo-bento__lightbox-nav ludo-bento__lightbox-nav--prev" type="button" data-ludo-lightbox-prev aria-label="View previous character card">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--dark" src="../../Assets/Icons/left-arrow-button-dark.svg" alt="" loading="lazy" decoding="async">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--light" src="../../Assets/Icons/left-arrow-button-light.svg" alt="" loading="lazy" decoding="async">
            </button>
            <button class="ludo-bento__lightbox-nav ludo-bento__lightbox-nav--next" type="button" data-ludo-lightbox-next aria-label="View next character card">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--dark" src="../../Assets/Icons/right-arrow-button-dark.svg" alt="" loading="lazy" decoding="async">
                <img class="ludo-bento__lightbox-nav-icon ludo-bento__lightbox-nav-icon--light" src="../../Assets/Icons/right-arrow-button-light.svg" alt="" loading="lazy" decoding="async">
            </button>
            <div class="ludo-bento__lightbox-stage">
                <div class="ludo-bento__lightbox-pills" aria-hidden="true">
                    <p class="ludo-bento__lightbox-pill" data-ludo-lightbox-role></p>
                    <p class="ludo-bento__lightbox-pill" data-ludo-lightbox-count></p>
                </div>
                <aside class="ludo-bento__lightbox-side ludo-bento__lightbox-side--left" aria-live="polite">
                    <h3 class="ludo-bento__lightbox-side-title" data-ludo-lightbox-copy-title>Flat</h3>
                    <p class="ludo-bento__lightbox-side-copy" data-ludo-lightbox-copy-body></p>
                </aside>
                <aside class="ludo-bento__lightbox-side ludo-bento__lightbox-side--right" aria-live="polite">
                    <div class="ludo-bento__lightbox-side-row">
                        <h3 class="ludo-bento__lightbox-side-title" data-ludo-lightbox-detail-name-title>Character name</h3>
                        <p class="ludo-bento__lightbox-side-copy" data-ludo-lightbox-detail-name-body>Placeholder copy for this character will go here.</p>
                    </div>
                    <div class="ludo-bento__lightbox-side-row">
                        <h3 class="ludo-bento__lightbox-side-title" data-ludo-lightbox-detail-class-title>Character class</h3>
                        <p class="ludo-bento__lightbox-side-copy" data-ludo-lightbox-detail-class-body>Placeholder copy for this class will go here.</p>
                    </div>
                </aside>
                <div class="ludo-bento__lightbox-canvas" data-ludo-lightbox-canvas></div>
                <div class="ludo-bento__lightbox-versions" role="tablist" aria-label="Card render styles">
                    <button class="ludo-bento__lightbox-version is-active" type="button" data-ludo-lightbox-version="flat" aria-pressed="true">Flat</button>
                    <button class="ludo-bento__lightbox-version" type="button" data-ludo-lightbox-version="stylised" aria-pressed="false">Stylised</button>
                </div>
            </div>
        </section>
    </div>`;
}
function renderActionCards() {
    return actionCards.map((card) => `
        <article class="ludo-bento__cta-card">
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.body)}</p>
            <span class="ludo-bento__cta-pill" aria-hidden="true">${escapeHtml(card.cta)}</span>
        </article>`).join('');
}

export function renderLudoBentoPage(project, site) {
    const toRoot = '../../';
    const metaTags = renderMetaTags(project, site);
    const themeClass = `theme-${project.theme}`;
    const themeBootScript = `<script>(function(){try{var storedTheme=localStorage.getItem('theme');var themeClass=storedTheme==='light'?'light-theme':'dark-theme';document.documentElement.classList.remove('light-theme','dark-theme');document.documentElement.classList.add(themeClass);}catch(error){document.documentElement.classList.add('dark-theme');}})();</script>`;
    const { previous, next } = getSiblingProjects(project, site);

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
    <link rel="stylesheet" href="../../shared/project-navbar.css">
    <link rel="stylesheet" href="../_templates/template-replication/ludo-bento.css">
</head>
<body class="project-page template-ludo-bento ${escapeHtml(themeClass)} overflow-x-hidden bg-canvas font-body text-ink antialiased selection:bg-accent selection:text-white">
    <div data-navbar-mount data-navbar-variant="project" data-to-root="${escapeHtml(toRoot)}"></div>
    <main class="ludo-bento-stage">
        <div class="ludo-bento" aria-label="Ludo Cards bento layout">
            <section class="ludo-bento__topfold">
                <article class="ludo-bento__hero-card">
                    <div class="ludo-bento__hero-content">
                        <header class="ludo-bento__hero-header">
                            <h1>Ludo Cards</h1>
                            <div class="ludo-bento__hero-tags">
                                <span>UX-UI</span>
                                <span>Game Design</span>
                            </div>
                        </header>
                        ${renderHeroTabs()}
                        ${renderQuoteStack()}
                    </div>
                </article>
                <div class="ludo-bento__top-grid" data-ludo-info-stack data-ludo-info-enhanced="false" data-ready="false" data-active-card="none">
                    ${infoCards.map((card) => renderInfoCard(card, toRoot)).join('')}
                </div>
            </section>
            <section class="ludo-bento__rail-card" id="artifacts">
                ${renderCardGroups(toRoot)}
            </section>
            <section class="ludo-bento__actions-row" id="project-links">
                ${renderProjectArrow(previous, 'previous', project.slug, toRoot)}
                <div class="ludo-bento__actions-grid">
                    ${renderActionCards()}
                </div>
                ${renderProjectArrow(next, 'next', project.slug, toRoot)}
            </section>
        </div>
    </main>
    ${renderCardLightbox()}
    ${renderFooterBlock(site, toRoot)}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>
    <script src="../../shared/navbar.js" defer></script>
    <script src="../_shared/project-page.js" defer></script>
    <script src="../_templates/template-replication/ludo-bento.js" defer></script>
</body>
</html>`;
}


















