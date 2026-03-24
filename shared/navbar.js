(function () {
    const mounts = Array.from(document.querySelectorAll('[data-navbar-mount]'));

    if (!mounts.length) {
        return;
    }

    const homeThemeToggle = (extraClasses = '') => `
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
    <nav class="navbar">
        <div class="logo">
            <a href="#hero" style="display:block; position:relative; width:90px; height:90px; overflow:hidden;">
                <img class="logo-default" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain;" src="Assets/identity-motion-active.gif" alt="neel Logo">
                <img class="logo-hover" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain;" src="Assets/identity-motion-hover.gif" alt="neel Logo">
            </a>
        </div>
        <ul class="nav-links">
            <li><a href="#work-anchor">Work</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
        <div class="nav-actions">
${homeThemeToggle()}
        </div>
        <div class="mobile-nav-actions">
${homeThemeToggle('mobile-theme-toggle')}
            <button class="menu-toggle" id="menu-toggle" aria-label="Open navigation menu" aria-controls="mobile-menu" aria-expanded="false">
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
                <a href="#work-anchor" class="mobile-menu-work-link">Work</a>
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
                <a href="projects/ludo-reimagined/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Ludo Reimagined</span>
                    <span class="mobile-submenu-type">Game Design</span>
                </a>
                <a href="projects/managed-asset-search/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Managed Asset Search</span>
                    <span class="mobile-submenu-type">Information Architecture</span>
                </a>
                <a href="projects/venture-hub/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Venture Hub</span>
                    <span class="mobile-submenu-type">UX/UI &amp; System Design</span>
                </a>
            </div>
        </div>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
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
${homeThemeToggle()}
        </div>
        <div class="mobile-nav-actions">
${homeThemeToggle('mobile-theme-toggle')}
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
                <a href="../ludo-reimagined/index.html" class="mobile-submenu-link">
                    <span class="mobile-submenu-title">Ludo Reimagined</span>
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
        <a href="${homeHref}#contact">Contact</a>
    </div>`;
    };

    mounts.forEach((mount) => {
        const variant = mount.dataset.navbarVariant || (document.body.classList.contains('project-page') ? 'project' : 'home');
        const toRoot = mount.dataset.toRoot || '';
        mount.outerHTML = variant === 'project' ? renderProjectNavbar(toRoot) : renderHomeNavbar();
    });
})();
