(function () {
    const mounts = Array.from(document.querySelectorAll('[data-navbar-mount]'));

    if (!mounts.length) {
        return;
    }

    const themeToggleButton = (extraClasses = '') => `
            <button class="theme-toggle${extraClasses ? ` ${extraClasses}` : ''}" data-theme-toggle aria-label="Toggle Dark Mode">
                <span class="theme-toggle__cap" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="moon-icon">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="sun-icon">
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

    const renderHomeNavbar = () => `
    <aside class="home-sidebar" id="home-sidebar" data-home-sidebar>
        <div class="home-sidebar__top">
            <button
                class="home-sidebar__toggle"
                type="button"
                data-home-sidebar-toggle
                aria-controls="home-sidebar"
                aria-expanded="true"
                aria-label="Collapse sidebar"
            >
                <span class="home-sidebar__toggle-icon" aria-hidden="true"></span>
            </button>
        </div>
        <div class="home-sidebar__body">
            <div class="home-sidebar__intro">
                <p class="home-sidebar__roles">
                    <span>Designer</span>
                    <span class="home-sidebar__dot" aria-hidden="true">&bull;</span>
                    <span>UX</span>
                    <span class="home-sidebar__dot" aria-hidden="true">&bull;</span>
                    <span>Systems</span>
                </p>
                <details class="home-sidebar__page home-sidebar__page--portfolio home-sidebar__page-group" data-home-home-group data-home-accordion-item="home" open>
                    <summary class="home-sidebar__page-title home-sidebar__page-title--toggle">Cabinet of Curiosities</summary>
                    <p class="home-sidebar__page-brief">A home for projects, musings, and a little soul.</p>
                </details>
                <details class="home-sidebar__page home-sidebar__page--birds home-sidebar__page-group" data-home-birds-group data-home-accordion-item="murmurations">
                    <summary class="home-sidebar__page-title home-sidebar__page-title--toggle">Murmurations</summary>
                    <div class="home-sidebar__page-richtext">
                        <p>Like a philharmonic orchestra across the evening sky, murmurations are one of nature&rsquo;s masterpieces. All that beauty and motion, held together by each starling following only six or seven nearest neighbours.</p>
                    </div>
                    <p class="home-sidebar__page-citation">
                        Sources: <a href="https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1002894" target="_blank" rel="noreferrer">PLOS Computational Biology</a> and <a href="https://www.princeton.edu/news/2013/02/07/birds-feather-track-seven-neighbors-flock-together" target="_blank" rel="noreferrer">Princeton</a>.
                    </p>
                    <div class="home-sidebar__video">
                        <iframe
                            src="https://www.youtube-nocookie.com/embed/V4f_1_r80RY?rel=0"
                            title="Murmuration reference video"
                            loading="lazy"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                        ></iframe>
                    </div>
                </details>
                <div class="home-sidebar__index-block">

                    <nav class="home-sidebar__index" aria-label="Section index">
                        <a class="home-sidebar__index-link" href="#about" data-home-about-link>About</a>
                        <details class="home-sidebar__index-group" data-home-work-group data-home-accordion-item="work">
                            <summary class="home-sidebar__index-link home-sidebar__index-link--toggle" data-home-work-summary>Work</summary>
                            <div class="home-sidebar__index-submenu">
                                <a class="home-sidebar__index-sublink" href="../ludo-cards/index.html">Ludo Cards</a>
                                <a class="home-sidebar__index-sublink" href="../managed-asset-search/index.html">Managed Asset Search</a>
                                <a class="home-sidebar__index-sublink" href="../venture-hub/index.html">Venture Hub</a>
                            </div>
                        </details>
                    </nav>
                </div>
            </div>
            <div class="home-sidebar__bottom">
                <div class="home-sidebar__meta">
                    <span class="home-sidebar__title">Neel Banerjee</span>
                    <p class="home-sidebar__tagline">Drawn to systems,<br>obsessed with play</p>
                </div>
                <div class="home-sidebar__actions">
                    <a class="home-sidebar__logo" href="#hero" aria-label="Back to top">
                        <img src="Assets/identity-motion-active-sidebar.gif" alt="neel Logo">
                    </a>
                    <a class="home-sidebar__contact" href="mailto:neelanzone@gmail.com"><span class="home-sidebar__contact-label">Get in touch</span></a>
                </div>
            </div>
        </div>
    </aside>
    <nav class="navbar navbar--home">
        <div class="home-topbar">
            <button
                class="home-topbar__menu"
                type="button"
                data-home-sidebar-toggle
                aria-controls="home-sidebar"
                aria-expanded="false"
                aria-label="Expand sidebar"
            >
                <span class="home-topbar__menu-icon" aria-hidden="true"></span>
            </button>
            <div class="navbar-spacer" aria-hidden="true"></div>
            <div class="nav-actions nav-actions--home">
            <label class="entropy-control" aria-label="Adjust background order and chaos">
                <span class="entropy-control__label">Order</span>
                <input
                    class="entropy-control__slider"
                    type="range"
                    min="0"
                    max="3"
                    step="0.01"
                    value="0"
                    data-entropy-slider
                    aria-label="Adjust background order and chaos"
                >
                <span class="entropy-control__value" data-entropy-value>Chaos</span>
            </label>
            <div class="density-control" role="group" aria-label="Adjust bird density">
                <span class="density-control__label">Birds</span>
                <button
                    class="density-control__knob"
                    type="button"
                    data-density-knob
                    aria-label="Adjust bird density"
                >
                    <span class="density-control__surface" aria-hidden="true"></span>
                    <span class="density-control__indicator" aria-hidden="true"></span>
                </button>
                <span class="density-control__value" data-density-value>Lots</span>
            </div>
            <div class="sphere-control" role="group" aria-label="Adjust sun size">
                <span class="sphere-control__label">Sun</span>
                <button
                    class="sphere-control__knob"
                    type="button"
                    data-sphere-size-knob
                    aria-label="Adjust sun size"
                >
                    <span class="sphere-control__surface" aria-hidden="true"></span>
                    <span class="sphere-control__indicator" aria-hidden="true"></span>
                </button>
                <span class="sphere-control__value" data-sphere-size-value>Neutron</span>
            </div>
            <div class="murmuration-control" role="group" aria-label="Bird formation patterns">
                                <button class="murmuration-control__button" type="button" data-murmuration-style="halo" aria-pressed="false">Halo</button>
                <button class="murmuration-control__button" type="button" data-murmuration-style="ribbon" aria-pressed="false">Ribbon</button>
                <button class="murmuration-control__button" type="button" data-murmuration-style="split" aria-pressed="false">Flock</button>
            </div>
            <div class="home-topbar__center">
                <button
                    class="scene-only-toggle"
                type="button"
                data-scene-only-toggle
                aria-label="See the Birds"
                aria-pressed="false"
            >
                <span class="scene-only-toggle__switch" aria-hidden="true">
                    <span class="scene-only-toggle__switch-thumb"></span>
                    <span class="scene-only-toggle__option scene-only-toggle__option--birds">
                        <img
                            class="scene-only-toggle__switch-icon"
                            src="Assets/button-icons/skylark.png"
                            alt=""
                            width="18"
                            height="18"
                        >
                    </span>
                    <span class="scene-only-toggle__option scene-only-toggle__option--portfolio">
                        <img
                            class="scene-only-toggle__switch-icon"
                            src="Assets/button-icons/id-card.png"
                            alt=""
                            width="18"
                            height="18"
                        >
                    </span>
                </span>
                <img
                    class="scene-only-toggle__icon"
                    src="Assets/button-icons/skylark.png"
                    alt=""
                    width="20"
                    height="20"
                    aria-hidden="true"
                    data-scene-only-toggle-icon
                >
                <span class="scene-only-toggle__label" data-scene-only-toggle-label>See the Birds</span>
            </button>
            </div>
            <div class="home-topbar__end">
                <button
                    class="music-toggle"
                type="button"
                data-music-toggle
                aria-label="Play soundtrack"
                aria-pressed="false"
            >
                <span class="music-toggle__cap" aria-hidden="true">
                    <img
                        class="music-toggle__icon music-toggle__icon--on"
                        src="Assets/Icons/volume.png"
                        alt=""
                        width="18"
                        height="18"
                    >
                    <img
                        class="music-toggle__icon music-toggle__icon--off"
                        src="Assets/Icons/mute.png"
                        alt=""
                        width="18"
                        height="18"
                    >
                </span>
            </button>
                <button
                    class="murmuration-mode-toggle"
                    type="button"
                    data-murmuration-tone-toggle
                    data-tone-target="kurosawa"
                    aria-label="Toggle flock colour mode"
                    aria-pressed="false"
                >
                    <span class="murmuration-mode-toggle__icon" aria-hidden="true">
                        <span class="murmuration-mode-toggle__swatch murmuration-mode-toggle__swatch--mono"></span>
                        <span class="murmuration-mode-toggle__swatch murmuration-mode-toggle__swatch--color"></span>
                    </span>
                    <span class="murmuration-mode-toggle__label" data-murmuration-tone-label>Kurosawa</span>
                </button>
            </div>
            </div>
        </div>
    </nav>
    <div class="home-mobile-flockbar" data-mobile-birds-drawer aria-hidden="true">
        <div class="murmuration-control murmuration-control--mobile" role="group" aria-label="Bird formation patterns">
            <button class="murmuration-control__button" type="button" data-murmuration-style="halo" aria-pressed="false">Halo</button>
            <button class="murmuration-control__button" type="button" data-murmuration-style="ribbon" aria-pressed="false">Ribbon</button>
            <button class="murmuration-control__button" type="button" data-murmuration-style="split" aria-pressed="false">Flock</button>
        </div>
        <div class="home-mobile-flockbar__sheet">
            <button
                class="home-mobile-flockbar__toggle"
                type="button"
                data-mobile-birds-drawer-toggle
                aria-expanded="true"
                aria-controls="mobile-birds-drawer-content"
            >
                <span class="home-mobile-flockbar__toggle-title">Murmurations</span>
                <span class="home-mobile-flockbar__toggle-icon" aria-hidden="true"></span>
            </button>
            <div class="home-mobile-flockbar__content" id="mobile-birds-drawer-content">
                <div class="home-mobile-flockbar__body">
                    <div class="home-mobile-flockbar__text">
                        <p class="home-mobile-flockbar__copy">Like a philharmonic orchestra across the evening sky, murmurations are one of nature&rsquo;s masterpieces. All that beauty and motion, held together by each starling following only six or seven nearest neighbours.</p>
                        <p class="home-mobile-flockbar__citation">
                            Sources: <a href="https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1002894" target="_blank" rel="noreferrer">PLOS Computational Biology</a> and <a href="https://www.princeton.edu/news/2013/02/07/birds-feather-track-seven-neighbors-flock-together" target="_blank" rel="noreferrer">Princeton</a>.
                        </p>
                    </div>
                    <div class="home-mobile-flockbar__video">
                        <iframe
                            src="https://www.youtube-nocookie.com/embed/V4f_1_r80RY?rel=0"
                            title="Murmuration reference video"
                            loading="lazy"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    const renderProjectNavbar = (toRoot) => {
        const homeHref = `${toRoot}index.html`;
        return `
    <nav class="navbar">
        <div class="logo">
            <a href="${homeHref}" style="display:block; position:relative; width:90px; height:90px; overflow:hidden;" aria-label="Back to homepage">
                <img class="logo-default" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain;" src="${toRoot}Assets/identity-motion-active.gif" alt="neel Logo">
                <img class="logo-hover" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain;" src="${toRoot}Assets/identity-motion-hover.gif" alt="neel Logo">
            </a>
        </div>
        <ul class="nav-links">
            <li><a href="${homeHref}#work-anchor">Work</a></li>
            <li><a href="${homeHref}#about">About</a></li>
            <li><a href="${homeHref}#contact">Contact</a></li>
        </ul>
        <div class="nav-actions">
${themeToggleButton()}
        </div>
        <div class="mobile-nav-actions">
${themeToggleButton('mobile-theme-toggle')}
            <button class="menu-toggle" id="mobile-menu-button" aria-label="Open navigation menu" aria-controls="mobile-menu" aria-expanded="false">
                <span class="menu-toggle__cap" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>
        </div>
    </nav>
    <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
        <div class="mobile-menu-group">
            <div class="mobile-menu-work-row">
                <a href="${homeHref}#work-anchor" class="mobile-menu-work-link">Work</a>
                <button
                    class="mobile-menu-toggle"
                    id="mobile-work-toggle"
                    type="button"
                    aria-label="Toggle work projects"
                    aria-controls="mobile-work-projects"
                    aria-expanded="false"
                >
                    <span class="mobile-menu-toggle-icon" aria-hidden="true"></span>
                </button>
            </div>
            <div class="mobile-submenu" id="mobile-work-projects" aria-hidden="true">
                <a href="../ludo-cards/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Ludo Cards</span>
                    <span class="mobile-submenu-type">Game Design</span>
                </a>
                <a href="../managed-asset-search/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Managed Asset Search</span>
                    <span class="mobile-submenu-type">Information Architecture</span>
                </a>
                <a href="../venture-hub/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Venture Hub</span>
                    <span class="mobile-submenu-type">UX/UI &amp; System Design</span>
                </a>
            </div>
        </div>
        <a href="${homeHref}#about">About</a>
        <a href="mailto:neelanzone@gmail.com">Contact</a>
    </div>`;
    };

    mounts.forEach((mount) => {
        const variant = mount.dataset.navbarVariant || (document.body.classList.contains('project-page') ? 'project' : 'home');
        const toRoot = mount.dataset.toRoot || '';
        mount.outerHTML = variant === 'project' ? renderProjectNavbar(toRoot) : renderHomeNavbar();
    });
})();




































