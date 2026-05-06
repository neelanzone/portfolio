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
                class="home-sidebar__menu"
                type="button"
                data-home-sidebar-toggle
                aria-controls="home-sidebar"
                aria-expanded="false"
                aria-label="Expand sidebar"
            >
                <span class="home-sidebar__menu-icon" aria-hidden="true"></span>
            </button>
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
                <div class="home-sidebar__page home-sidebar__page--portfolio">
                    <p class="home-sidebar__page-title">Cabinet of Curiosities</p>
                    <div class="home-sidebar__page-copy">
                        <p class="home-sidebar__page-brief">A home for projects, musings, and a little soul.</p>
                    </div>
                </div>
                <details class="home-sidebar__page home-sidebar__page--birds home-sidebar__page-group" data-home-birds-group>
                    <summary class="home-sidebar__page-title home-sidebar__page-title--toggle">Murmurations</summary>
                    <div class="home-sidebar__page-richtext">
                        <p>Like a philharmonic orchestra across the evening sky, murmurations are one of nature&rsquo;s masterpieces. All that beauty and motion, held together by each starling following only six or seven nearest neighbours.</p>
                    </div>
                    <p class="home-sidebar__page-citation">
                        Sources: <a href="https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1002894" target="_blank" rel="noreferrer">PLOS Computational Biology</a> and <a href="https://www.princeton.edu/news/2013/02/07/birds-feather-track-seven-neighbors-flock-together" target="_blank" rel="noreferrer">Princeton</a>.
                    </p>
                    <div class="home-sidebar__video">
                        <iframe
                            src="https://www.youtube.com/embed/V4f_1_r80RY?rel=0&modestbranding=1&playsinline=1&controls=1&fs=1"
                            title="Murmuration reference video"
                            loading="lazy"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                            allowfullscreen
                        ></iframe>
                    </div>
                </details>
                <div class="home-sidebar__index-block">

                    <nav class="home-sidebar__index" aria-label="Section index">
                        <a class="home-sidebar__index-link" href="#about" data-home-about-link>About</a>
                        <details class="home-sidebar__index-section home-sidebar__index-section--work home-sidebar__index-group">
                            <summary class="home-sidebar__index-link home-sidebar__index-link--toggle">Work</summary>
                            <div class="home-sidebar__index-submenu">
                                <a class="home-sidebar__index-sublink" href="projects/ludo-cards/index.html">Ludo Cards</a>
                                <a class="home-sidebar__index-sublink" href="projects/managed-asset-search/index.html">Asset Manager</a>
                                <a class="home-sidebar__index-sublink" href="projects/venture-hub/index.html">Venture Hub</a>
                                <a class="home-sidebar__index-sublink" href="projects/qualitative-reports-at-scale/index.html">Qualitative Reports at Scale</a>
                            </div>
                        </details>
                        <a class="home-sidebar__index-link" href="#gallery" data-home-gallery-link>Gallery</a>
                    </nav>
                </div>
            </div>
            <div class="home-sidebar__bottom">
                <div class="home-sidebar__meta">
                    <div class="home-sidebar__meta-copy">
                        <span class="home-sidebar__title">Nilanjan Banerjee</span>
                        <p class="home-sidebar__tagline">
                            <span>Drawn to systems,</span>
                            <span>obsessed with play.</span>
                        </p>
                    </div>
                </div>
                <a class="home-sidebar__contact" href="mailto:neelanzone@gmail.com"><span class="home-sidebar__contact-label">Get in touch</span></a>
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
        </div>
    </nav>
`;

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
                    <span class="mobile-submenu-type">Game Design / Personal</span>
                </a>
                <a href="../managed-asset-search/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Asset Manager</span>
                    <span class="mobile-submenu-type">UX / Internal Tool / Total Environment</span>
                </a>
                <a href="../venture-hub/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Venture Hub</span>
                    <span class="mobile-submenu-type">UX / Product Design / Concept</span>
                </a>
                <a href="../qualitative-reports-at-scale/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Qualitative Reports at Scale</span>
                    <span class="mobile-submenu-type">UX / Internal Tool / StartupYou</span>
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








































