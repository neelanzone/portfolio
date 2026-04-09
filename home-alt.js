document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const navbar = document.querySelector('.navbar');
    const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');
    const sceneOnlyToggleButton = document.querySelector('[data-scene-only-toggle]');
    const sceneOnlyToggleIcon = document.querySelector('[data-scene-only-toggle-icon]');
    const sceneOnlyToggleLabel = document.querySelector('[data-scene-only-toggle-label]');
    const homeSidebar = document.querySelector('[data-home-sidebar]');
    const homeSidebarToggleButtons = Array.from(document.querySelectorAll('[data-home-sidebar-toggle]'));
    const menuToggleButton = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    const mobileWorkToggle = document.getElementById('mobile-work-toggle');
    const mobileWorkProjects = document.getElementById('mobile-work-projects');
    const homeWorkGroup = document.querySelector('[data-home-work-group]');
    const homeWorkSummary = document.querySelector('[data-home-work-summary]');
    const homeHomeGroup = document.querySelector('[data-home-home-group]');
    const homeBirdsGroup = document.querySelector('[data-home-birds-group]');
    const homeAccordionGroups = Array.from(document.querySelectorAll('[data-home-accordion-item]'));
    const homeSidebarMeta = document.querySelector('.home-sidebar__meta');
    const homeSidebarLinks = homeSidebar ? Array.from(homeSidebar.querySelectorAll('a[href]')) : [];
    const mobileBirdsDrawer = document.querySelector('[data-mobile-birds-drawer]');
    const mobileBirdsDrawerToggle = document.querySelector('[data-mobile-birds-drawer-toggle]');
    const cursorHighlightTargets = Array.from(document.querySelectorAll('.murmuration-control__button, .murmuration-mode-toggle, .scene-only-toggle, .music-toggle, .home-sidebar__contact'));
    const footer = document.querySelector('footer');
    const homeTopbar = document.querySelector('.home-topbar');
    const desktopTopbarRevealMedia = window.matchMedia('(min-width: 768px)');

    const getStoredTheme = () => {
        try {
            return localStorage.getItem('theme');
        } catch {
            return null;
        }
    };

    const setStoredTheme = (theme) => {
        try {
            localStorage.setItem('theme', theme);
        } catch {
            // Ignore storage failures and keep the in-memory theme state only.
        }
    };

    const getStoredSceneOnly = () => false;

    const setStoredSceneOnly = () => {
        // Scene-only mode intentionally resets to the portfolio view on each load.
    };

    const getStoredSidebarCollapsed = () => {
        try {
            const stored = localStorage.getItem('home-sidebar-collapsed');
            return stored === null ? true : stored === 'true';
        } catch {
            return true;
        }
    };

    const setStoredSidebarCollapsed = (collapsed) => {
        try {
            localStorage.setItem('home-sidebar-collapsed', String(collapsed));
        } catch {
            // Ignore storage failures and keep the in-memory sidebar state only.
        }
    };

    const refreshLayout = (source = 'layout') => {
        window.dispatchEvent(new CustomEvent('home-layout-refresh', {
            detail: { source }
        }));
    };

    const setHomeTopbarRevealed = (revealed) => {
        if (!homeTopbar) {
            return;
        }

        homeTopbar.classList.toggle('is-revealed', desktopTopbarRevealMedia.matches && revealed);
    };

    const syncHomeTopbarReveal = () => {
        if (!homeTopbar) {
            return;
        }

        if (!desktopTopbarRevealMedia.matches) {
            setHomeTopbarRevealed(false);
            return;
        }

        setHomeTopbarRevealed(homeTopbar.matches(':hover') || homeTopbar.matches(':focus-within'));
    };

    const updateCursorHighlight = (target, event) => {
        const rect = target.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return;
        }

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        target.style.setProperty('--cursor-highlight-x', `${clampedX.toFixed(2)}%`);
        target.style.setProperty('--cursor-highlight-y', `${clampedY.toFixed(2)}%`);
    };

    const activateCursorHighlight = (target) => {
        target.style.setProperty('--cursor-highlight-alpha-strong', '0.72');
        target.style.setProperty('--cursor-highlight-alpha-mid', '0.36');
        target.style.setProperty('--cursor-highlight-alpha-soft', '0.12');
    };

    const resetCursorHighlight = (target) => {
        target.style.setProperty('--cursor-highlight-x', '50%');
        target.style.setProperty('--cursor-highlight-y', '50%');
        target.style.setProperty('--cursor-highlight-alpha-strong', '0');
        target.style.setProperty('--cursor-highlight-alpha-mid', '0');
        target.style.setProperty('--cursor-highlight-alpha-soft', '0');
    };

    const finishBootSequence = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.remove('home-alt--booting');
                refreshLayout('boot');
            });
        });
    };

    const syncNavbar = () => {
        if (!navbar) {
            return;
        }

        navbar.style.setProperty('--nav-bg-opacity', '1');
        navbar.classList.toggle('navbar-light', root.classList.contains('light-theme'));
    };

    const setMobileBirdsDrawerOpen = (open) => {
        if (!mobileBirdsDrawer) {
            return;
        }

        mobileBirdsDrawer.classList.toggle('is-open', open);

        if (mobileBirdsDrawerToggle) {
            mobileBirdsDrawerToggle.setAttribute('aria-expanded', String(open));
        }
    };

    const syncMobileFlockBar = () => {
        if (!mobileBirdsDrawer || !footer) {
            return;
        }

        const isCompactViewport = window.innerWidth < 768;
        const isBirdView = document.body.classList.contains('home-alt--scene-only');

        mobileBirdsDrawer.setAttribute('aria-hidden', String(!(isCompactViewport && isBirdView)));

        if (!isCompactViewport || !isBirdView) {
            mobileBirdsDrawer.style.setProperty('--home-mobile-flockbar-lift', '0px');
            setMobileBirdsDrawerOpen(false);
            return;
        }

        const footerRect = footer.getBoundingClientRect();
        const overlap = Math.max(0, window.innerHeight - footerRect.top);
        mobileBirdsDrawer.style.setProperty('--home-mobile-flockbar-lift', `${overlap}px`);
    };

    const scrollToSectionTarget = (targetId, behavior = 'smooth') => {
        if (!targetId || targetId === '#') {
            return false;
        }

        const targetElement = document.querySelector(targetId);
        if (!targetElement) {
            return false;
        }

        closeMobileMenu();

        const navOffset = navbar ? navbar.offsetHeight + 18 : 18;
        const absoluteTop = window.scrollY + targetElement.getBoundingClientRect().top;
        const destination = targetId === '#hero' ? 0 : Math.max(0, absoluteTop - navOffset);

        if (window.history?.replaceState) {
            window.history.replaceState(null, '', targetId);
        }

        window.scrollTo({
            top: destination,
            behavior
        });

        return true;
    };

    const openPortfolioAboutSection = () => {
        const finishAboutJump = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    scrollToSectionTarget('#about');
                });
            });
        };

        if (window.innerWidth < 768) {
            applySidebarCollapsedPreference(true);
        }

        if (document.body.classList.contains('home-alt--scene-only')) {
            applySceneOnlyPreference(false);
            finishAboutJump();
            return;
        }

        scrollToSectionTarget('#about');
    };

    const closeMobileMenu = () => {
        if (!menuToggleButton || !mobileMenu) {
            return;
        }

        menuToggleButton.classList.remove('is-open');
        menuToggleButton.setAttribute('aria-expanded', 'false');
        menuToggleButton.setAttribute('aria-label', 'Open navigation menu');
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');

        if (mobileWorkToggle && mobileWorkProjects) {
            mobileWorkToggle.setAttribute('aria-expanded', 'false');
            mobileWorkProjects.classList.remove('is-open');
            mobileWorkProjects.setAttribute('aria-hidden', 'true');
        }
    };

    const toggleMobileMenu = () => {
        if (!menuToggleButton || !mobileMenu) {
            return;
        }

        const isOpen = mobileMenu.classList.toggle('is-open');
        menuToggleButton.classList.toggle('is-open', isOpen);
        menuToggleButton.setAttribute('aria-expanded', String(isOpen));
        menuToggleButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    };

    const applyThemePreference = (theme) => {
        const isLight = theme === 'light';
        root.classList.remove('light-theme', 'dark-theme');
        root.classList.add(isLight ? 'light-theme' : 'dark-theme');
        setStoredTheme(isLight ? 'light' : 'dark');
        syncNavbar();
    };

    const applySidebarCollapsedPreference = (collapsed) => {
        document.body.classList.toggle('home-alt--sidebar-collapsed', collapsed);
        setStoredSidebarCollapsed(collapsed);

        if (homeSidebar) {
            homeSidebar.setAttribute('data-collapsed', String(collapsed));
        }

        homeSidebarToggleButtons.forEach((button) => {
            button.classList.toggle('is-collapsed', collapsed);
            button.setAttribute('aria-expanded', String(!collapsed));
            button.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        });

        requestAnimationFrame(() => refreshLayout('sidebar'));
    };

    const closeTopSidebarGroups = () => {
        [homeHomeGroup, homeBirdsGroup].forEach((group) => {
            if (group) {
                group.open = false;
            }
        });
    };

    const shouldCollapseTopSidebarForWork = () => {
        if (
            !homeWorkGroup
            || !homeSidebarMeta
            || document.body.classList.contains('home-alt--sidebar-collapsed')
            || !homeWorkGroup.open
        ) {
            return false;
        }

        const workSubmenu = homeWorkGroup.querySelector('.home-sidebar__index-submenu');
        if (!workSubmenu) {
            return false;
        }

        const submenuRect = workSubmenu.getBoundingClientRect();
        const metaRect = homeSidebarMeta.getBoundingClientRect();

        return submenuRect.bottom >= metaRect.top - 8;
    };

    const syncSidebarAccordionForScene = (sceneOnly) => {
        if (sceneOnly) {
            if (homeBirdsGroup) {
                homeBirdsGroup.open = true;
            }
            return;
        }

        if (homeHomeGroup) {
            homeHomeGroup.open = true;
        }
    };
    const applySceneOnlyPreference = (enabled) => {
        document.body.classList.toggle('home-alt--scene-only', enabled);
        setStoredSceneOnly(enabled);
        syncSidebarAccordionForScene(enabled);

        if (sceneOnlyToggleButton) {
            sceneOnlyToggleButton.classList.toggle('is-active', enabled);
            sceneOnlyToggleButton.setAttribute('aria-pressed', String(enabled));
            sceneOnlyToggleButton.setAttribute('aria-label', enabled ? 'Portfolio' : 'See the Birds');
        }

        if (sceneOnlyToggleLabel) {
            sceneOnlyToggleLabel.textContent = enabled ? 'Portfolio' : 'See the Birds';
        }

        if (sceneOnlyToggleIcon) {
            sceneOnlyToggleIcon.src = enabled ? 'Assets/button-icons/id-card.png' : 'Assets/button-icons/skylark.png';
        }

        if (enabled) {
            if (window.innerWidth < 768) {
                applySidebarCollapsedPreference(true);
                setMobileBirdsDrawerOpen(false);
            } else {
                applySidebarCollapsedPreference(false);
            }
        }

        window.dispatchEvent(new CustomEvent('home-scene-view', {
            detail: { sceneOnly: enabled }
        }));

        if (enabled) {
            closeMobileMenu();
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });
            requestAnimationFrame(syncMobileFlockBar);
            refreshLayout('scene-only-enter');
            return;
        }

        requestAnimationFrame(() => {
            syncMobileFlockBar();
            refreshLayout('scene-only-exit');
            requestAnimationFrame(() => refreshLayout('scene-only-exit'));
        });
    };

    applyThemePreference(window.innerWidth < 768 ? 'light' : (getStoredTheme() === 'light' ? 'light' : 'dark'));
    applySidebarCollapsedPreference(getStoredSidebarCollapsed());
    applySceneOnlyPreference(getStoredSceneOnly());
    syncMobileFlockBar();
    syncHomeTopbarReveal();
    finishBootSequence();

    themeToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const isLight = root.classList.contains('light-theme');
            applyThemePreference(isLight ? 'dark' : 'light');
        });
    });

    if (homeTopbar) {
        homeTopbar.addEventListener('mouseenter', () => {
            setHomeTopbarRevealed(true);
        });

        homeTopbar.addEventListener('mouseleave', () => {
            if (!homeTopbar.matches(':focus-within')) {
                setHomeTopbarRevealed(false);
            }
        });

        homeTopbar.addEventListener('focusin', () => {
            setHomeTopbarRevealed(true);
        });

        homeTopbar.addEventListener('focusout', () => {
            requestAnimationFrame(syncHomeTopbarReveal);
        });

        if (typeof desktopTopbarRevealMedia.addEventListener === 'function') {
            desktopTopbarRevealMedia.addEventListener('change', syncHomeTopbarReveal);
        } else if (typeof desktopTopbarRevealMedia.addListener === 'function') {
            desktopTopbarRevealMedia.addListener(syncHomeTopbarReveal);
        }
    }

    cursorHighlightTargets.forEach((target) => {
        resetCursorHighlight(target);

        target.addEventListener('pointerenter', (event) => {
            activateCursorHighlight(target);
            updateCursorHighlight(target, event);
        });

        target.addEventListener('pointermove', (event) => {
            activateCursorHighlight(target);
            updateCursorHighlight(target, event);
        });

        target.addEventListener('pointerleave', () => {
            resetCursorHighlight(target);
        });

        target.addEventListener('blur', () => {
            resetCursorHighlight(target);
        });
    });

    if (sceneOnlyToggleButton) {
        sceneOnlyToggleButton.addEventListener('click', () => {
            applySceneOnlyPreference(!document.body.classList.contains('home-alt--scene-only'));
        });
    }

    if (mobileBirdsDrawerToggle) {
        mobileBirdsDrawerToggle.addEventListener('click', () => {
            setMobileBirdsDrawerOpen(!mobileBirdsDrawer?.classList.contains('is-open'));
            requestAnimationFrame(syncMobileFlockBar);
        });
    }

    homeSidebarToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applySidebarCollapsedPreference(!document.body.classList.contains('home-alt--sidebar-collapsed'));
        });
    });

    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', toggleMobileMenu);
    }

    if (mobileWorkToggle && mobileWorkProjects) {
        mobileWorkToggle.addEventListener('click', () => {
            const isOpen = mobileWorkToggle.getAttribute('aria-expanded') === 'true';
            mobileWorkToggle.setAttribute('aria-expanded', String(!isOpen));
            mobileWorkProjects.classList.toggle('is-open', !isOpen);
            mobileWorkProjects.setAttribute('aria-hidden', String(isOpen));
        });
    }

    if (homeWorkSummary && homeWorkGroup) {
        homeWorkSummary.addEventListener('click', (event) => {
            event.preventDefault();
            const shouldOpen = !homeWorkGroup.open;
            homeWorkGroup.open = shouldOpen;

            if (!shouldOpen) {
                return;
            }

            requestAnimationFrame(() => {
                if (shouldCollapseTopSidebarForWork()) {
                    closeTopSidebarGroups();
                }
            });

            const targetElement = document.querySelector('#work-anchor') || document.querySelector('#work');
            if (!targetElement) {
                return;
            }

            const navOffset = navbar ? navbar.offsetHeight + 18 : 18;
            const absoluteTop = window.scrollY + targetElement.getBoundingClientRect().top;
            const destination = Math.max(0, absoluteTop - navOffset);

            if (window.history?.replaceState) {
                window.history.replaceState(null, '', '#work-anchor');
            }

            window.scrollTo({
                top: destination,
                behavior: 'smooth'
            });
        });
    }

    mobileMenuLinks.forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
    });

    homeSidebarLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            if (link.matches('[data-home-about-link]')) {
                event.preventDefault();
                event.stopImmediatePropagation();
                openPortfolioAboutSection();
                return;
            }

            if (window.innerWidth < 768) {
                applySidebarCollapsedPreference(true);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!mobileMenu || !menuToggleButton) {
            return;
        }

        if (
            mobileMenu.classList.contains('is-open')
            && !mobileMenu.contains(event.target)
            && !menuToggleButton.contains(event.target)
        ) {
            closeMobileMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }

        syncMobileFlockBar();
        syncHomeTopbarReveal();
    });

    window.addEventListener('scroll', syncMobileFlockBar, { passive: true });
    window.addEventListener('home-layout-refresh', syncMobileFlockBar);
    window.addEventListener('home-scene-view', syncMobileFlockBar);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || link.matches('[data-home-about-link]')) {
                return;
            }

            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') {
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (!targetElement) {
                return;
            }

            event.preventDefault();
            scrollToSectionTarget(targetId);
        });
    });

    const aboutTldrButton = document.querySelector('[data-about-tldr]');
    const aboutCopy = document.querySelector('[data-about-copy]');

    if (aboutTldrButton && aboutCopy) {
        aboutTldrButton.addEventListener('click', () => {
            const isActive = aboutTldrButton.getAttribute('aria-pressed') === 'true';
            aboutTldrButton.setAttribute('aria-pressed', String(!isActive));
            aboutCopy.classList.toggle('is-tldr', !isActive);
        });
    }

    const workCards = Array.from(document.querySelectorAll('.work-card'));

    const applyWorkCardTilt = (card, clientX, clientY, scale = 1.02) => {
        const shell = card?.querySelector('.work-card-shell');
        if (!shell) {
            return;
        }

        const rect = shell.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxTilt = 4.5;
        const rawNormalizedX = (x - centerX) / centerX;
        const rawNormalizedY = (y - centerY) / centerY;
        const normalizedX = Math.max(-0.65, Math.min(0.65, rawNormalizedX));
        const normalizedY = Math.max(-0.65, Math.min(0.65, rawNormalizedY));
        const rotateX = normalizedY * -maxTilt;
        const rotateY = normalizedX * maxTilt;
        const mouseX = (x / rect.width) * 100;
        const mouseY = (y / rect.height) * 100;

        shell.style.transition = 'transform 0.1s cubic-bezier(0.19, 1, 0.22, 1)';
        shell.style.willChange = 'transform';
        shell.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
        shell.style.setProperty('--mouse-x', `${mouseX}%`);
        shell.style.setProperty('--mouse-y', `${mouseY}%`);
    };

    const resetWorkCardTilt = (card) => {
        const shell = card?.querySelector('.work-card-shell');
        if (!shell) {
            return;
        }

        shell.style.transition = 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
        shell.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

        window.setTimeout(() => {
            shell.style.willChange = 'auto';
        }, 600);
    };

    workCards.forEach((card) => {
        const shell = card.querySelector('.work-card-shell');
        const bgImg = card.querySelector('.work-bg-image');
        if (!shell) {
            return;
        }

        card.addEventListener('mouseenter', () => {
            shell.style.transition = 'transform 0.1s cubic-bezier(0.19, 1, 0.22, 1)';
            shell.style.willChange = 'transform';
            if (bgImg) {
                bgImg.style.transition = 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
            }
        });

        card.addEventListener('mousemove', (event) => {
            applyWorkCardTilt(card, event.clientX, event.clientY, 1.02);
        });

        card.addEventListener('mouseleave', () => {
            if (bgImg) {
                bgImg.style.transition = 'none';
            }
            resetWorkCardTilt(card);
        });
    });

    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselDots = document.getElementById('carousel-dots');

    if (carouselContainer && carouselTrack) {
        const cards = Array.from(carouselTrack.querySelectorAll('.work-card'));
        let filingCards = [];
        let filingCardWidth = 0;
        let filingActiveCard = null;
        let filingActiveIdx = -1;
        let filingLastMouseX = 0;
        let filingDxAccum = 0;
        let isDesktopCarousel = false;
        let mobileDots = [];
        let touchCarouselPointerId = null;
        let touchCarouselStartX = 0;
        let touchCarouselStartY = 0;
        let touchCarouselStartScrollLeft = 0;
        let touchCarouselDragging = false;
        let suppressCarouselClickUntil = 0;

        const setMobileActiveDot = (activeIdx) => {
            if (!mobileDots.length) {
                return;
            }

            mobileDots.forEach((dot, index) => {
                dot.classList.toggle('is-active', index === activeIdx);
            });
        };

        const updateMobileActiveDot = () => {
            if (isDesktopCarousel || !filingCards.length || !carouselDots) {
                return;
            }

            const containerRect = carouselContainer.getBoundingClientRect();
            const containerCenter = containerRect.left + (containerRect.width / 2);
            let closestIdx = 0;
            let closestDistance = Infinity;

            filingCards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.left + (rect.width / 2);
                const distance = Math.abs(cardCenter - containerCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIdx = index;
                }
            });

            setMobileActiveDot(closestIdx);
        };

        const buildMobileDots = () => {
            if (!carouselDots) {
                return;
            }

            carouselDots.innerHTML = '';
            mobileDots = [];

            if (isDesktopCarousel || !filingCards.length) {
                return;
            }

            filingCards.forEach((card, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'carousel-dot';
                dot.setAttribute('aria-label', `View project ${index + 1}`);
                dot.addEventListener('click', () => {
                    const cardRect = card.getBoundingClientRect();
                    const containerRect = carouselContainer.getBoundingClientRect();
                    const delta = (cardRect.left + (cardRect.width / 2)) - (containerRect.left + (containerRect.width / 2));

                    carouselContainer.scrollTo({
                        left: carouselContainer.scrollLeft + delta,
                        behavior: 'smooth'
                    });
                });
                carouselDots.appendChild(dot);
                mobileDots.push(dot);
            });

            updateMobileActiveDot();
        };

        const endTouchCarouselGesture = (pointerId = null) => {
            if (pointerId !== null && touchCarouselPointerId !== pointerId) {
                return;
            }

            if (touchCarouselDragging) {
                suppressCarouselClickUntil = Date.now() + 350;
            }

            touchCarouselPointerId = null;
            touchCarouselDragging = false;
            carouselContainer.classList.remove('is-touch-dragging');
        };

        const applyFilingSpread = (hoveredIdx) => {
            const spreadPx = Math.round(filingCardWidth * 0.5);
            filingCards.forEach((card, index) => {
                const base = parseInt(card.dataset.baseFilingX || '0', 10);
                const shift = index < hoveredIdx ? -spreadPx : index > hoveredIdx ? spreadPx : 0;
                card.style.setProperty('--filing-x', `${base + shift}px`);
            });
        };

        const resetFilingSpread = () => {
            filingCards.forEach((card) => {
                card.style.setProperty('--filing-x', `${card.dataset.baseFilingX || 0}px`);
            });
        };

        const openFilingCard = (card, idx) => {
            if (!card || filingActiveCard === card) {
                return;
            }

            if (filingActiveCard) {
                filingActiveCard.classList.remove('is-filing-open');
            }

            filingActiveCard = card;
            filingActiveIdx = idx;
            card.classList.add('is-filing-open');
            applyFilingSpread(idx);
        };

        const closeFilingCard = () => {
            if (filingActiveCard) {
                filingActiveCard.classList.remove('is-filing-open');
            }

            filingActiveCard = null;
            filingActiveIdx = -1;
            resetFilingSpread();
        };

        const updateCarouselGeometry = () => {
            isDesktopCarousel = window.innerWidth >= 768;
            const containerRect = carouselContainer.getBoundingClientRect();

            if (!containerRect.width || !carouselContainer.offsetParent) {
                return;
            }

            if (!isDesktopCarousel) {
                carouselTrack.style.width = 'max-content';
                closeFilingCard();
                cards.forEach((card) => {
                    card.style.left = '';
                    card.style.top = '';
                    card.style.zIndex = '';
                    card.style.removeProperty('--filing-x');
                    card.style.removeProperty('--filing-tilt');
                    card.dataset.baseFilingX = '0';
                    card.style.display = card.classList.contains('title-card') ? 'none' : '';
                });
                filingCards = cards.filter((card) => !card.classList.contains('title-card'));
                filingCardWidth = filingCards[0]?.offsetWidth || 280;
                requestAnimationFrame(() => {
                    buildMobileDots();
                    updateMobileActiveDot();
                });
                return;
            }

            const cardWidth = cards[0]?.offsetWidth || 320;
            const containerWidth = carouselContainer.offsetWidth || 1000;
            const projCards = cards.filter((card) => !card.classList.contains('title-card'));
            const count = projCards.length;
            const spacing = Math.round(containerWidth / count);
            const startX = Math.round(containerWidth / 2 - ((count - 1) / 2) * spacing - cardWidth / 2);
            const midIdx = (count - 1) / 2;

            carouselTrack.style.transform = 'none';
            carouselTrack.style.width = `${containerWidth}px`;

            cards.forEach((card) => {
                if (card.classList.contains('title-card')) {
                    card.style.display = 'none';
                    return;
                }

                card.style.display = '';
            });

            projCards.forEach((card, index) => {
                card.style.left = '0';
                card.style.top = '0';
                card.style.setProperty('--filing-x', `${startX + index * spacing}px`);
                card.style.setProperty('--filing-tilt', `${(index - midIdx) * 3}deg`);
                card.style.zIndex = String(count - Math.round(Math.abs(index - midIdx)));
                card.dataset.baseFilingX = String(startX + index * spacing);
            });

            filingCards = projCards;
            filingCardWidth = cardWidth;
            closeFilingCard();
            buildMobileDots();
        };

        carouselContainer.addEventListener('mouseenter', (event) => {
            if (!isDesktopCarousel) {
                return;
            }

            const rect = carouselContainer.getBoundingClientRect();
            filingLastMouseX = event.clientX - rect.left;
            filingDxAccum = 0;
        });

        carouselContainer.addEventListener('mousemove', (event) => {
            if (!isDesktopCarousel || !filingCards.length) {
                return;
            }

            const rect = carouselContainer.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const dx = mouseX - filingLastMouseX;
            filingLastMouseX = mouseX;

            if (filingActiveCard && filingActiveIdx !== -1) {
                if ((dx > 0 && filingDxAccum < 0) || (dx < 0 && filingDxAccum > 0)) {
                    filingDxAccum = 0;
                }

                filingDxAccum += dx;
                const switchThreshold = 75;

                if (filingDxAccum >= switchThreshold) {
                    const next = filingActiveIdx + 1;
                    if (next < filingCards.length) {
                        openFilingCard(filingCards[next], next);
                    }
                    filingDxAccum = 0;
                } else if (filingDxAccum <= -switchThreshold) {
                    const prev = filingActiveIdx - 1;
                    if (prev >= 0) {
                        openFilingCard(filingCards[prev], prev);
                    }
                    filingDxAccum = 0;
                }
                return;
            }

            filingDxAccum = 0;
            let nearest = null;
            let nearestDist = Infinity;
            let nearestIdx = -1;

            filingCards.forEach((card, index) => {
                const edgeX = parseInt(card.dataset.baseFilingX || '0', 10) + filingCardWidth / 2;
                const dist = Math.abs(mouseX - edgeX);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = card;
                    nearestIdx = index;
                }
            });

            if (nearest) {
                openFilingCard(nearest, nearestIdx);
            }
        });

        carouselContainer.addEventListener('mouseleave', () => {
            if (!isDesktopCarousel) {
                return;
            }

            closeFilingCard();
            filingDxAccum = 0;
        });

        const prevButton = carouselContainer.querySelector('.carousel-control.prev');
        const nextButton = carouselContainer.querySelector('.carousel-control.next');

        prevButton?.addEventListener('click', () => {
            if (!isDesktopCarousel) {
                return;
            }

            const targetIdx = filingActiveIdx <= 0 ? 0 : filingActiveIdx - 1;
            openFilingCard(filingCards[targetIdx], targetIdx);
        });

        nextButton?.addEventListener('click', () => {
            if (!isDesktopCarousel) {
                return;
            }

            const targetIdx = filingActiveIdx < 0 ? 0 : Math.min(filingCards.length - 1, filingActiveIdx + 1);
            openFilingCard(filingCards[targetIdx], targetIdx);
        });

        carouselContainer.addEventListener('scroll', () => {
            if (!isDesktopCarousel) {
                requestAnimationFrame(updateMobileActiveDot);
            }
        }, { passive: true });

        carouselContainer.addEventListener('pointerdown', (event) => {
            if (isDesktopCarousel || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) {
                return;
            }

            touchCarouselPointerId = event.pointerId;
            touchCarouselStartX = event.clientX;
            touchCarouselStartY = event.clientY;
            touchCarouselStartScrollLeft = carouselContainer.scrollLeft;
            touchCarouselDragging = false;
        });

        carouselContainer.addEventListener('pointermove', (event) => {
            if (isDesktopCarousel || touchCarouselPointerId !== event.pointerId) {
                return;
            }

            const deltaX = event.clientX - touchCarouselStartX;
            const deltaY = event.clientY - touchCarouselStartY;

            if (!touchCarouselDragging) {
                if (Math.abs(deltaX) < 8 || Math.abs(deltaX) <= Math.abs(deltaY)) {
                    return;
                }

                touchCarouselDragging = true;
                carouselContainer.classList.add('is-touch-dragging');
            }

            carouselContainer.scrollLeft = touchCarouselStartScrollLeft - deltaX;
            requestAnimationFrame(updateMobileActiveDot);
            event.preventDefault();
        });

        carouselContainer.addEventListener('pointerup', (event) => {
            endTouchCarouselGesture(event.pointerId);
        });

        carouselContainer.addEventListener('pointercancel', (event) => {
            endTouchCarouselGesture(event.pointerId);
        });

        carouselContainer.addEventListener('click', (event) => {
            if (!isDesktopCarousel && Date.now() < suppressCarouselClickUntil) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);

        updateCarouselGeometry();
        requestAnimationFrame(updateCarouselGeometry);
        window.addEventListener('resize', updateCarouselGeometry);
        window.addEventListener('home-layout-refresh', () => {
            requestAnimationFrame(updateCarouselGeometry);
        });
    }

    const draggables = Array.from(document.querySelectorAll('.draggable'));
    const photoSelf = document.getElementById('photo-self');
    const resetTab = document.getElementById('reset-tab');

    if (!draggables.length || !photoSelf) {
        return;
    }

    const clearSelectedDraggables = () => {
        draggables.forEach((item) => item.classList.remove('is-selected'));
    };

    const resetDraggables = () => {
        draggables.forEach((item) => {
            item.classList.add('snap-back');
            item.setAttribute('style', item.dataset.initialStyle);
            window.setTimeout(() => item.classList.remove('snap-back'), 600);
        });
        clearSelectedDraggables();
    };

    let activeItem = null;
    let dragType = 'move';
    let startX = 0;
    let startY = 0;
    let startRot = 0;
    let startScale = 1;
    let rectCenter = { x: 0, y: 0 };
    let initialDist = 0;
    let initialAngle = 0;
    let gestureStart = null;
    const activePointers = new Map();

    draggables.forEach((item) => {
        item.addEventListener('pointerdown', dragStart);
        item.addEventListener('dragstart', (event) => event.preventDefault());
        item.dataset.initialStyle = item.getAttribute('style') || '';
    });

    function dragStart(event) {
        const targetItem = event.target.closest('.draggable');
        if (!targetItem || targetItem.classList.contains('snap-back')) {
            return;
        }

        event.stopPropagation();

        if (event.target.closest('.gui-layer-up')) {
            const currentZ = parseInt(window.getComputedStyle(targetItem).zIndex, 10) || 10;
            targetItem.style.zIndex = String(currentZ + 1);
            return;
        }

        if (event.target.closest('.gui-layer-down')) {
            const currentZ = parseInt(window.getComputedStyle(targetItem).zIndex, 10) || 10;
            targetItem.style.zIndex = String(Math.max(1, currentZ - 1));
            return;
        }

        const isTouchPointer = event.pointerType === 'touch' || event.pointerType === 'pen';

        if (isTouchPointer && activeItem === targetItem && !activePointers.has(event.pointerId)) {
            activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            activeItem.setPointerCapture(event.pointerId);

            if (activePointers.size >= 2) {
                const points = Array.from(activePointers.values()).slice(0, 2);
                const dx = points[1].x - points[0].x;
                const dy = points[1].y - points[0].y;
                dragType = 'gesture';
                gestureStart = {
                    angle: Math.atan2(dy, dx) * (180 / Math.PI),
                    distance: Math.hypot(dx, dy)
                };

                const style = window.getComputedStyle(activeItem);
                startRot = parseFloat(style.getPropertyValue('--rot')) || 0;
                startScale = parseFloat(style.getPropertyValue('--scale')) || 1;
                activeItem.classList.add('dragging');
                return;
            }
        }

        clearSelectedDraggables();
        targetItem.classList.add('is-selected');
        activeItem = targetItem;

        if (event.target.closest('.gui-rotate')) {
            dragType = 'rotate';
        } else if (event.target.closest('.gui-scale')) {
            dragType = 'scale';
        } else {
            dragType = 'move';
        }

        activeItem.classList.add('dragging');
        activeItem.setPointerCapture(event.pointerId);

        activePointers.clear();
        if (isTouchPointer) {
            activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }

        const style = window.getComputedStyle(activeItem);
        const currDragX = parseFloat(style.getPropertyValue('--drag-x')) || 0;
        const currDragY = parseFloat(style.getPropertyValue('--drag-y')) || 0;
        startRot = parseFloat(style.getPropertyValue('--rot')) || 0;
        startScale = parseFloat(style.getPropertyValue('--scale')) || 1;
        gestureStart = null;

        if (dragType === 'move') {
            startX = event.clientX - currDragX;
            startY = event.clientY - currDragY;
        } else {
            const rect = activeItem.getBoundingClientRect();
            rectCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

            if (dragType === 'rotate') {
                initialAngle = Math.atan2(event.clientY - rectCenter.y, event.clientX - rectCenter.x) * (180 / Math.PI);
            } else if (dragType === 'scale') {
                initialDist = Math.hypot(event.clientX - rectCenter.x, event.clientY - rectCenter.y);
            }
        }

        activeItem.addEventListener('pointermove', dragMove);
        activeItem.addEventListener('pointerup', dragEnd);
        activeItem.addEventListener('pointercancel', dragEnd);
    }

    function dragMove(event) {
        if (!activeItem) {
            return;
        }

        if (activePointers.has(event.pointerId)) {
            activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }

        if (dragType === 'move') {
            const currentX = event.clientX - startX;
            const currentY = event.clientY - startY;
            activeItem.style.setProperty('--drag-x', `${currentX}px`);
            activeItem.style.setProperty('--drag-y', `${currentY}px`);
            return;
        }

        if (dragType === 'gesture') {
            if (activePointers.size < 2 || !gestureStart) {
                return;
            }

            const points = Array.from(activePointers.values());
            const dx = points[1].x - points[0].x;
            const dy = points[1].y - points[0].y;
            const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            const currentDistance = Math.hypot(dx, dy);
            const dAngle = currentAngle - gestureStart.angle;
            let newScale = gestureStart.distance > 0 ? startScale * (currentDistance / gestureStart.distance) : startScale;
            newScale = Math.max(0.2, Math.min(newScale, 5));
            activeItem.style.setProperty('--rot', `${startRot + dAngle}deg`);
            activeItem.style.setProperty('--scale', String(newScale));
            return;
        }

        if (dragType === 'rotate') {
            const currentAngle = Math.atan2(event.clientY - rectCenter.y, event.clientX - rectCenter.x) * (180 / Math.PI);
            const dAngle = currentAngle - initialAngle;
            activeItem.style.setProperty('--rot', `${startRot + dAngle}deg`);
            return;
        }

        if (dragType === 'scale') {
            const currentDist = Math.hypot(event.clientX - rectCenter.x, event.clientY - rectCenter.y);
            const scaleFactor = initialDist > 0 ? (currentDist / initialDist) : 1;
            let newScale = startScale * scaleFactor;
            newScale = Math.max(0.2, Math.min(newScale, 5));
            activeItem.style.setProperty('--scale', String(newScale));
        }
    }

    function dragEnd(event) {
        if (!activeItem) {
            return;
        }

        activePointers.delete(event.pointerId);

        try {
            activeItem.releasePointerCapture(event.pointerId);
        } catch {
            // Ignore release errors when pointer capture is already gone.
        }

        if (dragType === 'gesture' && activePointers.size > 0) {
            return;
        }

        activeItem.classList.remove('dragging');
        activeItem.removeEventListener('pointermove', dragMove);
        activeItem.removeEventListener('pointerup', dragEnd);
        activeItem.removeEventListener('pointercancel', dragEnd);
        gestureStart = null;
        activePointers.clear();
        activeItem = null;
    }

    document.addEventListener('pointerdown', (event) => {
        if (activeItem && event.pointerType === 'touch' && activePointers.size >= 1 && !activePointers.has(event.pointerId)) {
            event.preventDefault();
            activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

            try {
                activeItem.setPointerCapture(event.pointerId);
            } catch {
                // Ignore capture errors if the pointer cannot be captured.
            }

            if (activePointers.size >= 2) {
                const points = Array.from(activePointers.values()).slice(0, 2);
                const dx = points[1].x - points[0].x;
                const dy = points[1].y - points[0].y;
                dragType = 'gesture';
                gestureStart = {
                    angle: Math.atan2(dy, dx) * (180 / Math.PI),
                    distance: Math.hypot(dx, dy)
                };

                const style = window.getComputedStyle(activeItem);
                startRot = parseFloat(style.getPropertyValue('--rot')) || 0;
                startScale = parseFloat(style.getPropertyValue('--scale')) || 1;
                activeItem.classList.add('dragging');
            }
            return;
        }

        if (!event.target.closest('.draggable')) {
            clearSelectedDraggables();
        }
    }, { passive: false });

    if (resetTab) {
        let isPulling = false;
        let pullStartY = 0;
        let pullPointerId = null;

        const onPullEnd = (clientY) => {
            if (!isPulling) {
                return;
            }

            isPulling = false;
            pullPointerId = null;
            const dy = Math.max(0, clientY - pullStartY);
            resetTab.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            resetTab.style.setProperty('--pull-y', '0px');

            if (dy > 80) {
                resetDraggables();
            }
        };

        resetTab.addEventListener('touchstart', (event) => {
            event.preventDefault();
            isPulling = true;
            pullStartY = event.touches[0].pageY;
            resetTab.style.transition = 'none';
        }, { passive: false });

        resetTab.addEventListener('touchmove', (event) => {
            if (!isPulling) {
                return;
            }

            event.preventDefault();
            const dy = Math.max(0, event.touches[0].pageY - pullStartY);
            resetTab.style.setProperty('--pull-y', `${Math.min(dy, 120)}px`);
        }, { passive: false });

        resetTab.addEventListener('touchend', (event) => {
            onPullEnd(event.changedTouches[0].pageY);
        });

        resetTab.addEventListener('touchcancel', () => {
            isPulling = false;
            resetTab.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            resetTab.style.setProperty('--pull-y', '0px');
        });

        resetTab.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'touch') {
                return;
            }

            event.preventDefault();
            isPulling = true;
            pullPointerId = event.pointerId;
            pullStartY = event.clientY;
            resetTab.style.transition = 'none';
            resetTab.setPointerCapture(event.pointerId);
        });

        resetTab.addEventListener('pointermove', (event) => {
            if (!isPulling || pullPointerId !== event.pointerId) {
                return;
            }

            const dy = Math.max(0, event.clientY - pullStartY);
            resetTab.style.setProperty('--pull-y', `${Math.min(dy, 120)}px`);
        });

        const endDesktopPull = (event) => {
            if (!isPulling || pullPointerId !== event.pointerId) {
                return;
            }

            try {
                resetTab.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore release errors if capture has already been cleared.
            }

            onPullEnd(event.clientY);
        };

        resetTab.addEventListener('pointerup', endDesktopPull);
        resetTab.addEventListener('pointercancel', endDesktopPull);
    }

    photoSelf.addEventListener('click', resetDraggables);
});








