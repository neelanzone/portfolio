document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const homeSidebar = document.querySelector('[data-home-sidebar]');
    const homeSidebarToggleButtons = Array.from(document.querySelectorAll('[data-home-sidebar-toggle]'));
    const homeSidebarBrief = document.querySelector('.home-sidebar__page-brief');
    const mobileViewportMedia = window.matchMedia('(max-width: 767px)');

    /* ─── localStorage helpers ───────────────────────── */
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
        } catch {}
    };

    /* ─── Sidebar collapse state ─────────────────────── */
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
    };

    homeSidebarToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applySidebarCollapsedPreference(!document.body.classList.contains('home-alt--sidebar-collapsed'));
            document.body.classList.add('home-alt--sidebar-transitioning');
            setTimeout(() => {
                document.body.classList.remove('home-alt--sidebar-transitioning');
            }, 500);
        });
    });

    /* ─── Mobile brief line break ────────────────────── */
    const syncMobileSidebarBriefLineBreak = () => {
        if (!homeSidebarBrief) return;

        const canonicalBrief = 'A home for projects, musings, and a little soul.';
        const normalizedText = homeSidebarBrief.textContent.replace(/\s+/g, ' ').trim();
        if (normalizedText !== canonicalBrief) return;

        if (mobileViewportMedia.matches) {
            homeSidebarBrief.innerHTML = 'A home for projects, musings,<br class="home-sidebar__brief-break"> and a little soul.';
        } else {
            homeSidebarBrief.textContent = canonicalBrief;
        }
    };

    syncMobileSidebarBriefLineBreak();
    mobileViewportMedia.addEventListener('change', syncMobileSidebarBriefLineBreak);

    /* ─── Boot sequence ──────────────────────────────── */
    const finishBootSequence = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.remove('home-alt--booting');
            });
        });
    };

    /* ─── Initialise ─────────────────────────────────── */
    applySidebarCollapsedPreference(getStoredSidebarCollapsed());
    finishBootSequence();

    /* ─── Theme toggle button ────────────────────────── */
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = root.classList.contains('dark-theme');
            root.classList.toggle('light-theme', isDark);
            root.classList.toggle('dark-theme', !isDark);
            try { localStorage.setItem('theme', isDark ? 'light' : 'dark'); } catch {}
        });
    }

    /* ─── Stars ──────────────────────────────────────── */
    const starsEl = document.getElementById('stars');

    function makeStars(count, sizeRange, opHiRange, opLoRange, durRange, bright = false) {
        for (let i = 0; i < count; i++) {
            const s   = document.createElement('div');
            s.className = 'star' + (bright ? ' bright' : '');
            const sz  = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            const hi  = (opHiRange[0] + Math.random() * (opHiRange[1] - opHiRange[0])).toFixed(2);
            const lo  = (opLoRange[0] + Math.random() * (opLoRange[1] - opLoRange[0])).toFixed(2);
            const dur = (durRange[0]  + Math.random() * (durRange[1] - durRange[0])).toFixed(2);
            const del = (Math.random() * 8).toFixed(2);
            s.style.cssText = `
                left:${(Math.random() * 100).toFixed(2)}%;
                top:${(Math.random() * 100).toFixed(2)}%;
                width:${sz.toFixed(2)}px; height:${sz.toFixed(2)}px;
                --hi:${hi}; --lo:${lo}; --dur:${dur}s; --del:${del}s;
            `;
            starsEl.appendChild(s);
        }
    }

    makeStars(220, [0.6, 1.4], [0.5, 0.85], [0.05, 0.2], [2.5, 6]);
    makeStars(60,  [1.2, 2.2], [0.7, 0.95], [0.1,  0.3], [2,   5]);
    makeStars(18,  [2,   3.2], [0.85, 1],   [0.2,  0.45],[3,   7], true);

    /* ─── Shooting star ──────────────────────────────── */
    function fireShooter() {
        setTimeout(fireShooter, 6000 + Math.random() * 10000);
        if (!root.classList.contains('dark-theme')) return;

        const el       = document.createElement('div');
        el.className   = 'shooter';
        const angleDeg = 125 + Math.random() * 25;
        const dist     = 220 + Math.random() * 180;
        const dur      = (0.5 + Math.random() * 0.3).toFixed(2);

        el.style.cssText = `
            left:${65 + Math.random() * 30}vw;
            top:${Math.random() * 22}vh;
            --angle:${angleDeg}deg; --dist:${dist}px; --shoot-dur:${dur}s;
        `;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }

    setTimeout(fireShooter, 2000 + Math.random() * 3000);

    /* ─── Sidebar index scroll thumb ────────────────────── */
    const indexBlock    = document.querySelector('.home-sidebar__index-block');
    const scrollThumb   = document.getElementById('sidebar-scrollbar');
    const sidebarToggle = document.querySelector('.home-sidebar__toggle');

    function updateScrollThumb() {
        if (!indexBlock || !scrollThumb) return;

        const isCollapsed  = document.body.classList.contains('home-alt--sidebar-collapsed');
        const isScrollable = indexBlock.scrollHeight > indexBlock.clientHeight + 1;

        if (sidebarToggle) {
            sidebarToggle.classList.toggle('is-scrolling', !isCollapsed && isScrollable);
        }

        if (isCollapsed || !isScrollable || !sidebarToggle) {
            scrollThumb.style.opacity = '0';
            return;
        }

        // Handlebar track: ::before is 12.5vh tall, centred at 50% of viewport height
        const vh       = window.innerHeight;
        const trackTop = vh * 0.4375;   // 50vh - 6.25vh
        const trackH   = vh * 0.125;    // 12.5vh

        // Horizontal centre of the toggle button
        const toggleRect = sidebarToggle.getBoundingClientRect();
        const thumbLeft  = (toggleRect.left + toggleRect.right) / 2 - 1.5;

        const thumbH    = Math.max(16, trackH * (indexBlock.clientHeight / indexBlock.scrollHeight));
        const maxScroll = indexBlock.scrollHeight - indexBlock.clientHeight;
        const ratio     = maxScroll > 0 ? indexBlock.scrollTop / maxScroll : 0;
        const thumbTop  = trackTop + ratio * (trackH - thumbH);

        scrollThumb.style.left   = thumbLeft + 'px';
        scrollThumb.style.top    = thumbTop  + 'px';
        scrollThumb.style.height = thumbH    + 'px';
        scrollThumb.style.opacity = '1';
    }

    if (indexBlock) {
        indexBlock.addEventListener('scroll', updateScrollThumb, { passive: true });
        // toggle doesn't bubble — wire up each <details> directly
        indexBlock.querySelectorAll('details').forEach(d => {
            d.addEventListener('toggle', () => {
                if (d.open) {
                    requestAnimationFrame(() => {
                        const dRect     = d.getBoundingClientRect();
                        const blockRect = indexBlock.getBoundingClientRect();
                        if (dRect.bottom > blockRect.bottom) {
                            indexBlock.scrollBy({ top: dRect.bottom - blockRect.bottom + 8, behavior: 'smooth' });
                        }
                        updateScrollThumb();
                    });
                } else {
                    updateScrollThumb();
                }
            }, { passive: true });
        });
    }
    window.addEventListener('resize', updateScrollThumb, { passive: true });

    // While cursor is inside the sidebar and the list is scrollable,
    // keep all wheel scroll inside the list — don't let it reach the page.
    if (homeSidebar && indexBlock) {
        const SIDEBAR_SCROLL_BUFFER = 32; // px beyond sidebar right edge
        window.addEventListener('wheel', (e) => {
            if (indexBlock.scrollHeight <= indexBlock.clientHeight + 1) return;
            const sidebarRight = homeSidebar.getBoundingClientRect().right;
            if (e.clientX > sidebarRight + SIDEBAR_SCROLL_BUFFER) return;
            const atTop    = indexBlock.scrollTop <= 0;
            const atBottom = indexBlock.scrollTop >= indexBlock.scrollHeight - indexBlock.clientHeight - 1;
            if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) return;
            e.preventDefault();
            indexBlock.scrollTop += e.deltaY;
            updateScrollThumb();
        }, { passive: false });
    }

    // Immediately hide thumb when collapsing; refresh after transition
    homeSidebarToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (scrollThumb && document.body.classList.contains('home-alt--sidebar-collapsed')) {
                scrollThumb.style.opacity = '0';
            }
            setTimeout(updateScrollThumb, 400);
        });
    });

    // ─── Handlebar drag-to-scroll ──────────────────────────
    let isDraggingHandle = false;

    if (sidebarToggle) {
        // Intercept the collapse click when a drag just occurred
        sidebarToggle.addEventListener('click', (e) => {
            if (isDraggingHandle) e.stopImmediatePropagation();
        }, { capture: true });

        sidebarToggle.addEventListener('pointerdown', (e) => {
            if (!indexBlock || indexBlock.scrollHeight <= indexBlock.clientHeight + 1) return;

            const startY      = e.clientY;
            const startScroll = indexBlock.scrollTop;
            const trackH      = window.innerHeight * 0.125;
            const scrollRange = indexBlock.scrollHeight - indexBlock.clientHeight;
            const THRESHOLD   = 5;
            let   dragActive  = false;

            const onMove = (me) => {
                const dy = me.clientY - startY;
                if (!dragActive && Math.abs(dy) > THRESHOLD) {
                    dragActive       = true;
                    isDraggingHandle = true;
                    sidebarToggle.classList.add('is-dragging');
                }
                if (dragActive) {
                    indexBlock.scrollTop = Math.max(0, Math.min(scrollRange, startScroll + (dy / trackH) * scrollRange));
                    updateScrollThumb();
                }
            };

            const onUp = () => {
                sidebarToggle.removeEventListener('pointermove', onMove);
                sidebarToggle.releasePointerCapture(e.pointerId);
                sidebarToggle.classList.remove('is-dragging');
                setTimeout(() => { isDraggingHandle = false; }, 0);
            };

            sidebarToggle.setPointerCapture(e.pointerId);
            sidebarToggle.addEventListener('pointermove', onMove, { passive: true });
            sidebarToggle.addEventListener('pointerup',     onUp, { once: true });
            sidebarToggle.addEventListener('pointercancel', onUp, { once: true });
        });
    }

    updateScrollThumb();

    /* ─── Work reveal ───────────────────────────────────── */
    const workSection  = document.querySelector('.work-section');
    const workFrame    = document.querySelector('.work-frame');
    const workMask     = document.querySelector('.work-img-mask');
    const workPanel    = document.querySelector('.work-panel');
    const feedStrip    = document.getElementById('feed-strip');
    const feedTrack    = document.getElementById('feed-rail-track');
    const feedCards    = feedStrip ? Array.from(feedStrip.querySelectorAll('.feed-card')) : [];
    const navFeatured  = document.querySelector('.home-navbar__navlink[href="#featured"]');
    const navFeed      = Array.from(document.querySelectorAll('.home-navbar__navlink')).find(el => el.textContent.trim() === 'FEED') || null;
    const navHome      = Array.from(document.querySelectorAll('.home-navbar__navlink')).find(el => el.textContent.trim() === 'HOME') || null;
    const navDropdown  = document.getElementById('nav-dropdown');
    const ACT = 'home-navbar__navlink--active';
    let feedActive = false;
    let navLocked  = false;
    let _navLockTimer = null;

    function getNavSection(link) {
        return link?.dataset.navSection || link?.textContent.trim().toLowerCase() || '';
    }

    function getScrollNavActive() {
        if (!workSection) return navHome;
        const viewportFocus = window.scrollY + window.innerHeight * 0.5;
        const workTop = workSection.offsetTop;
        if (viewportFocus < workTop) return navHome;

        const total = Math.max(1, workSection.offsetHeight - window.innerHeight);
        const workProgress = Math.max(0, Math.min(1, (window.scrollY - workTop) / total));
        return workProgress >= 0.75 ? navFeed : navFeatured;
    }

    function _unlockNav() {
        navLocked = false;
        clearTimeout(_navLockTimer);
        window.removeEventListener('scrollend', _unlockNav);
        setNavActive(getScrollNavActive());
    }
    function lockNav(activeEl) {
        navLocked = true;
        setNavActive(activeEl);
        clearTimeout(_navLockTimer);
        window.removeEventListener('scrollend', _unlockNav);
        window.addEventListener('scrollend', _unlockNav);
        _navLockTimer = setTimeout(_unlockNav, 4000);
    }
    function setNavActive(active) {
        const activeSection = getNavSection(active);
        [navHome, navFeatured, navFeed].forEach(el => {
            if (!el) return;
            const isActive = getNavSection(el) === activeSection;
            el.classList.toggle(ACT, isActive);
            if (isActive) el.setAttribute('aria-current', 'page');
            else el.removeAttribute('aria-current');
        });
        syncNavDropdownActive(activeSection);
    }
    const workSlide0   = document.querySelector('.work-slide[data-slide="0"]');
    const workSlide1   = document.querySelector('.work-slide[data-slide="1"]');
    const workSlide2   = document.querySelector('.work-slide[data-slide="2"]');
    const panelSlide0  = document.querySelector('.work-panel-slide[data-slide="0"]');
    const panelSlide1  = document.querySelector('.work-panel-slide[data-slide="1"]');
    const panelSlide2  = document.querySelector('.work-panel-slide[data-slide="2"]');
    const workPanelCount = workPanel ? workPanel.querySelector('.work-panel__count') : null;
    const workPanelCountCurrent = workPanelCount ? workPanelCount.querySelector('.work-panel__count-current') : null;
    const ctaEl0       = panelSlide0 ? panelSlide0.querySelector('.work-panel__cta')   : null;
    const ctaEl1       = panelSlide1 ? panelSlide1.querySelector('.work-panel__cta')   : null;
    const ctaEl2       = panelSlide2 ? panelSlide2.querySelector('.work-panel__cta')   : null;

    if (workSection && workFrame && workMask && workPanel) {
        function ss(t) { return t * t * (3 - 2 * t); }
        function phase(p, a, b) { return ss(Math.max(0, Math.min(1, (p - a) / (b - a)))); }

        function animateCounter(el, target, suffix) {
            const duration  = 700;
            const startTime = performance.now();
            function tick(now) {
                const t     = Math.min(1, (now - startTime) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(eased * target) + (suffix || '');
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        function fireCounters(slideEl) {
            slideEl.querySelectorAll('.work-panel__data-num[data-target]').forEach(el => {
                animateCounter(el, parseInt(el.dataset.target, 10), el.dataset.suffix || '');
            });
        }

        let currentWorkPanelCount = 1;
        function setWorkPanelCount(nextCount) {
            if (!workPanelCountCurrent || nextCount === currentWorkPanelCount) return;
            currentWorkPanelCount = nextCount;
            workPanelCountCurrent.getAnimations?.().forEach(anim => anim.cancel());
            if (!workPanelCountCurrent.animate) {
                workPanelCountCurrent.textContent = nextCount;
                if (workPanelCount) workPanelCount.setAttribute('aria-label', `Project ${nextCount} of 3`);
                return;
            }
            const out = workPanelCountCurrent.animate([
                { opacity: 1, transform: 'rotateX(0deg)' },
                { opacity: 0.2, transform: 'rotateX(-90deg)' },
            ], { duration: 120, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
            out.onfinish = () => {
                workPanelCountCurrent.textContent = nextCount;
                if (workPanelCount) workPanelCount.setAttribute('aria-label', `Project ${nextCount} of 3`);
                workPanelCountCurrent.animate([
                    { opacity: 0.2, transform: 'rotateX(90deg)' },
                    { opacity: 1, transform: 'rotateX(0deg)' },
                ], { duration: 180, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' });
            };
        }

        const nums0          = panelSlide0 ? Array.from(panelSlide0.querySelectorAll('.work-panel__data-num[data-target]')) : [];
        const slideChildren0 = panelSlide0 ? Array.from(panelSlide0.querySelector('.work-panel__inner').children) : [];
        const slideChildren1 = panelSlide1 ? Array.from(panelSlide1.querySelector('.work-panel__inner').children) : [];
        const slideChildren2 = panelSlide2 ? Array.from(panelSlide2.querySelector('.work-panel__inner').children) : [];
        let _counter1Fired   = false;
        let _counter2Fired   = false;

        if (workSlide1) workSlide1.style.clipPath = 'inset(100% 0 0 0)';
        if (workSlide2) workSlide2.style.clipPath = 'inset(100% 0 0 0)';

        let cardNaturalX    = null;
        let introCardNaturalX = null;
        let cardMediaWidths = [];
        let cardMediaWraps  = [];
        let card0Width      = 0;
        let railOverflow    = 0;
        let feedScrollX     = 0;
        let feedRailActive  = false;
        let feedDots        = null;
        let feedNavArrows   = null;
        let hoveredCardIdx  = -1;
        let feedHoverActive = false;
        let _rtX = 0, _rtY = 0, _rtScrollX0 = 0, _rtAxis = null, _rtPanning = false;
        let _rtVelHistory = [];
        let _panGen = 0;
        let _railEntryTime  = 0;    // timestamp of last enterRailMode call
        const FEED_CHROME_TRIGGER_RATIO = 0.40;
        const RAIL_ENTRY_INPUT_LOCK = 700;
        const RAIL_WHEEL_DELTA_LIMIT = 80;

        function ensureFeedDots() {
            if (feedDots || !feedStrip?.parentElement) return feedDots;

            feedDots = document.createElement('div');
            feedDots.className = 'feed-dots';
            feedCards.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'feed-dot';
                dot.setAttribute('aria-label', `Feed item ${i + 1}`);
                dot.addEventListener('click', () => panFeedTo(centeredX(i), true));
                feedDots.appendChild(dot);
            });
            feedDots.style.opacity = '0';
            feedDots.style.pointerEvents = 'none';
            feedStrip.parentElement.appendChild(feedDots);
            return feedDots;
        }

        function makeSvgChevron(dir) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 20 20');
            svg.setAttribute('fill', 'none');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', dir === 'left'
                ? 'M13 4L7 10L13 16'
                : 'M7 4L13 10L7 16');
            path.setAttribute('stroke', 'white');
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
            return svg;
        }

        function ensureFeedArrows() {
            if (feedNavArrows || !feedStrip?.parentElement) return;

            feedNavArrows = document.createElement('div');
            feedNavArrows.className = 'feed-nav-arrows';

            const prev = document.createElement('button');
            prev.className = 'feed-nav-arrow feed-nav-arrow--prev';
            prev.setAttribute('aria-label', 'Previous');
            prev.appendChild(makeSvgChevron('left'));
            prev.addEventListener('click', () => navigateFeed(-1));

            const next = document.createElement('button');
            next.className = 'feed-nav-arrow feed-nav-arrow--next';
            next.setAttribute('aria-label', 'Next');
            next.appendChild(makeSvgChevron('right'));
            next.addEventListener('click', () => navigateFeed(1));

            feedNavArrows.appendChild(prev);
            feedNavArrows.appendChild(next);
            feedNavArrows.style.opacity = '0';
            feedNavArrows.style.pointerEvents = 'none';
            feedStrip.parentElement.appendChild(feedNavArrows);
        }

        function setFeedChromeOpacity(opacity, enableDots) {
            const value = Math.max(0, Math.min(1, opacity));
            feedCards.forEach(card => {
                const cap = card.querySelector('.feed-card__caption');
                if (cap) cap.style.opacity = value;
            });
            if (feedDots) {
                const dotsEnabled = enableDots && value > 0;
                feedDots.style.opacity = value;
                feedDots.style.pointerEvents = dotsEnabled ? 'auto' : 'none';
                Array.from(feedDots.children).forEach(dot => {
                    dot.style.pointerEvents = dotsEnabled ? 'auto' : 'none';
                });
            }
            if (feedNavArrows) {
                const arrowsEnabled = enableDots && value > 0;
                feedNavArrows.style.opacity = value;
                feedNavArrows.style.pointerEvents = arrowsEnabled ? 'auto' : 'none';
            }
        }

        function getFeedChromeOpacity(feedOffsetX) {
            const introX = introCardNaturalX || cardNaturalX;
            if (!introX || !introX.length) return 0;
            const firstCardLeft = introX[0] + feedOffsetX;
            const triggerX = window.innerWidth * FEED_CHROME_TRIGGER_RATIO;
            return firstCardLeft <= triggerX ? 1 : 0;
        }

        function setFeedHoverActive(active) {
            feedHoverActive = active;
            feedStrip.classList.toggle('is-feed-hover-active', active);
            feedCards.forEach(card => {
                card.style.pointerEvents = active ? 'auto' : 'none';
            });
            if (!active && hoveredCardIdx !== -1) {
                feedCards[hoveredCardIdx]?.classList.remove('feed-card--hovered');
                hoveredCardIdx = -1;
                updateDots();
            }
        }

        // Detect portrait layout mode (panel renders below image instead of beside it)
        const portraitMQ = window.matchMedia('(orientation: portrait)');

        function getLayoutScale() {
            return parseFloat(getComputedStyle(document.documentElement)
                .getPropertyValue('--layout-scale').trim()) || 1;
        }

        function updateWork() {
            const scrolled = -workSection.getBoundingClientRect().top;
            const total    = workSection.offsetHeight - window.innerHeight;
            const p        = Math.max(0, Math.min(1, scrolled / total));
            const pAnim    = Math.max(0, Math.min(1, scrolled / (total * 0.65)));

            const S           = getLayoutScale();
            const isPortrait  = portraitMQ.matches;

            // ── Layout constants (portrait vs landscape) ──────────────
            const FRAME_W    = isPortrait ? workFrame.offsetWidth : 550 * S;
            const MASK_H_MIN = isPortrait ? Math.round(FRAME_W * (window.innerWidth < 768 ? 0.54 : 0.58)) : Math.round(200 * S);
            const MASK_H_MAX = isPortrait ? Math.round(FRAME_W * (window.innerWidth < 768 ? 0.76 : 0.80)) : Math.round(550 * S);
            const PANEL_W_MAX = isPortrait ? FRAME_W : Math.round(532 * S);
            // portrait: panel grows in height below the image
            const PANEL_H_MAX = isPortrait ? Math.round(FRAME_W * (window.innerWidth < 768 ? 0.68 : 0.60)) : 0;
            // overlap correction: panel left = 530*S, frame = 550*S → 20*S overlap
            const PANEL_OVERLAP = 20 * S;

            // Phase 1: mask height (3%–26%)
            const maskH = MASK_H_MIN + phase(pAnim, 0.03, 0.26) * (MASK_H_MAX - MASK_H_MIN);
            workMask.style.height = maskH + 'px';
            workMask.style.width  = isPortrait ? '100%' : '';

            // Phase 2: panel (30%–56%)
            const panelProgress = phase(pAnim, 0.30, 0.56);
            let panelW = 0;
            if (isPortrait) {
                const panelH = panelProgress * PANEL_H_MAX;
                workPanel.style.left   = '0';
                workPanel.style.width  = FRAME_W + 'px';
                workPanel.style.height = panelH + 'px';
                workPanel.style.top    = maskH + 'px';
                panelW = FRAME_W; // used for centreX in landscape formula below (overridden)
            } else {
                panelW = panelProgress * PANEL_W_MAX;
                workPanel.style.width  = panelW + 'px';
                workPanel.style.left   = '';
                workPanel.style.top    = '';
                workPanel.style.height = '';
            }

            // Phase 3a: scale down centred in viewport (65%–75%)
            const scaleT    = phase(p, 0.65, 0.75);
            const minScale  = isPortrait ? (200 / 550) : (200 / 550);
            const exitScale = 1 - scaleT * (1 - minScale);

            // Phase 3b: exit left (75%–90%)
            const moveT = phase(p, 0.75, 0.90);

            if (isPortrait) {
                // Portrait: combined content (image+panel) is taller than the frame's layout height.
                // Shift frame UP by half the panel height so the combined block is centred vertically.
                const panelH   = panelProgress * PANEL_H_MAX;
                const centreY  = -(panelH / 2) * exitScale;
                const exitX    = -moveT * window.innerWidth * 0.85;
                workFrame.style.transform = `translateX(${exitX.toFixed(2)}px) translateY(${centreY.toFixed(2)}px) scale(${exitScale})`;
            } else {
                // Landscape: combined content (image+panel) extends to the right of viewport centre.
                // panel left = 530*S inside a 550*S frame → overlap = 20*S
                const centreX = -((panelW - PANEL_OVERLAP) / 2) * exitScale;
                const exitX   = centreX - moveT * window.innerWidth * 0.70;
                workFrame.style.transform = `translateX(${exitX.toFixed(2)}px) scale(${exitScale})`;
            }

            // Phase 4: stack slides in from right placing cards right-to-left (75%–92%),
            //          then interactive rail mode takes over.
            if (feedStrip) {
                const feedT = phase(p, 0.75, 0.92);
                if (feedT === 0) {
                    feedActive = false;
                    exitRailMode();
                    feedStrip.style.transform = `translateX(${window.innerWidth}px)`;
                    if (feedTrack) feedTrack.style.transform = '';
                    cardNaturalX    = null;
                    introCardNaturalX = null;
                    cardMediaWidths = [];
                    card0Width      = 0;
                    railOverflow    = 0;
                    cardMediaWraps.forEach(w => { if (w) w.style.clipPath = ''; });
                    cardMediaWraps  = [];
                    feedCards.forEach(c => {
                        c.style.transform     = '';
                        c.style.zIndex        = '';
                        c.style.pointerEvents = 'none';
                    });
                    setFeedChromeOpacity(0, false);
                    setFeedHoverActive(false);
                } else {
                    feedActive = true;
                    if (!navLocked) setNavActive(navFeed);
                    if (!cardNaturalX) {
                        feedStrip.style.transform = 'translateX(0)';
                        cardMediaWraps  = feedCards.map(c => c.querySelector('.feed-card__media-wrap'));
                        cardNaturalX    = cardMediaWraps.map(w => w ? w.getBoundingClientRect().left : 0);
                        introCardNaturalX = cardNaturalX.slice();
                        cardMediaWidths = cardMediaWraps.map(w => w?.offsetWidth || 0);
                        card0Width = cardMediaWidths[0] || 0;
                        railOverflow = feedTrack
                            ? Math.max(0, feedTrack.offsetWidth - window.innerWidth)
                            : 0;
                        feedCards.forEach((card, i) => { card.style.zIndex = feedCards.length - i; });
                    }

                    if (feedT < 1) {
                        const feedOffsetX = (1 - feedT) * window.innerWidth;
                        const feedChromeOpacity = getFeedChromeOpacity(feedOffsetX);
                        if (feedRailActive) {
                            if (feedChromeOpacity < 1) {
                                // Scrolling upward before the 40% handoff should return
                                // control to the scroll-driven intro instead of staying latched.
                                exitRailMode();
                                cardNaturalX = introCardNaturalX ? introCardNaturalX.slice() : null;
                                feedStrip.style.transform = `translateX(${feedOffsetX.toFixed(2)}px)`;
                                if (feedTrack) feedTrack.style.transform = '';
                                feedCards.forEach((card, i) => {
                                    card.style.transform     = '';
                                    card.style.pointerEvents = 'auto';
                                    const wrap = cardMediaWraps[i];
                                    if (wrap) wrap.style.clipPath = '';
                                });
                                ensureFeedDots();
                                setFeedChromeOpacity(feedChromeOpacity, false);
                                setFeedHoverActive(true);
                                updateDots();
                            } else {
                                // Once the rail is live, keep it latched. The scroll intro
                                // only owns the handoff; side-scroll owns movement after that.
                                feedStrip.style.transform = 'translateX(0)';
                                setFeedChromeOpacity(1, true);
                                setFeedHoverActive(true);
                                updateDots();
                            }
                        } else {
                            if (feedChromeOpacity >= 1) {
                                // Dots are visible — hand off to rail immediately instead of
                                // waiting for feedT to reach 1
                                const triggerX = window.innerWidth * FEED_CHROME_TRIGGER_RATIO;
                                const introFirstLeft = introCardNaturalX
                                    ? introCardNaturalX[0] + feedOffsetX
                                    : triggerX;
                                const handoffFirstLeft = Math.max(introFirstLeft, triggerX);
                                feedCards.forEach((card, i) => {
                                    card.style.transform     = '';
                                    card.style.pointerEvents = 'auto';
                                    if (cardMediaWraps[i]) cardMediaWraps[i].style.clipPath = '';
                                });
                                enterRailMode(handoffFirstLeft);
                            } else {
                                feedStrip.style.transform = `translateX(${feedOffsetX.toFixed(2)}px)`;
                                if (feedTrack) feedTrack.style.transform = '';
                                feedCards.forEach((card, i) => {
                                    card.style.transform     = '';
                                    card.style.pointerEvents = 'auto';
                                    const wrap = cardMediaWraps[i];
                                    if (wrap) wrap.style.clipPath = '';
                                });
                                ensureFeedDots();
                                setFeedChromeOpacity(feedChromeOpacity, false);
                                setFeedHoverActive(true);
                                updateDots();
                            }
                        }
                    } else {
                        // Stacking complete — hand off to interactive rail
                        feedCards.forEach((card, i) => {
                            card.style.transform     = '';
                            card.style.pointerEvents = 'auto';
                            if (cardMediaWraps[i]) cardMediaWraps[i].style.clipPath = '';
                        });
                        if (!feedRailActive) {
                            enterRailMode();
                        }
                        // feedRailActive: rail controller owns feedTrack.style.transform
                    }
                }
            }

            // Count + CTA 0: fade in during expansion tail (46%–56%), fade out before exit (63%–69%)
            {
                const cFadeIn  = phase(pAnim, 0.46, 0.56);
                if (workPanelCount) workPanelCount.style.opacity = cFadeIn;
                if (ctaEl0) ctaEl0.style.opacity = cFadeIn * (1 - phase(pAnim, 0.63, 0.69));
            }

            // Slide 0 counters — scroll-driven, linear track (30%–51%)
            const expansionT = Math.max(0, Math.min(1, (pAnim - 0.30) / (0.51 - 0.30)));
            nums0.forEach(el => {
                el.textContent = Math.round(expansionT * parseInt(el.dataset.target, 10)) + (el.dataset.suffix || '');
            });

            // Wipe 1→2 (60%–80%)
            const wipe  = phase(pAnim, 0.60, 0.80);
            // Wipe 2→3 (83%–97%)
            const wipe2 = phase(pAnim, 0.83, 0.97);
            setWorkPanelCount(pAnim >= 0.91 ? 3 : pAnim >= 0.70 ? 2 : 1);

            if (workSlide0) workSlide0.style.clipPath = `inset(0 0 ${wipe * 100}% 0)`;
            if (workSlide1) workSlide1.style.clipPath = wipe < 1
                ? `inset(${(1 - wipe) * 100}% 0 0 0)`
                : `inset(0 0 ${wipe2 * 100}% 0)`;
            if (workSlide2) workSlide2.style.clipPath = `inset(${(1 - wipe2) * 100}% 0 0 0)`;

            const Y = 28;

            // Slide 0 exit (63%–71%)
            slideChildren0.forEach((el, i) => {
                const t = phase(pAnim, 0.63 + i * 0.012, 0.66 + i * 0.012);
                el.style.opacity   = 1 - t;
                el.style.transform = `translateY(${-t * Y}px)`;
                el.style.clipPath  = `inset(0 0 ${t * 100}% 0)`;
            });

            // Slide 1 entry (70%–78%) then exit (85%–91%)
            slideChildren1.forEach((el, i) => {
                const tIn  = phase(pAnim, 0.70 + i * 0.012, 0.73 + i * 0.012);
                const tOut = phase(pAnim, 0.85 + i * 0.012, 0.88 + i * 0.012);
                el.style.opacity   = tIn * (1 - tOut);
                el.style.transform = `translateY(${(1 - tIn) * -Y - tOut * Y}px)`;
                el.style.clipPath  = `inset(0 0 ${Math.max(1 - tIn, tOut) * 100}% 0)`;
            });

            // Slide 2 entry (91%–98%)
            slideChildren2.forEach((el, i) => {
                const t = phase(pAnim, 0.91 + i * 0.012, 0.94 + i * 0.012);
                el.style.opacity   = t;
                el.style.transform = `translateY(${(1 - t) * -Y}px)`;
                el.style.clipPath  = `inset(0 0 ${(1 - t) * 100}% 0)`;
            });

            // Count + CTA 1: entry then fade out on 2→3
            {
                const tIn  = phase(pAnim, 0.772, 0.802);
                const tOut = phase(pAnim, 0.85, 0.91);
                const op   = tIn * (1 - tOut);
                const ty   = `translateY(${(1 - tIn) * -Y}px)`;
                const cp   = `inset(0 0 ${(1 - tIn) * 100}% 0)`;
                if (ctaEl1)   { ctaEl1.style.opacity   = op; ctaEl1.style.transform   = ty; ctaEl1.style.clipPath   = cp; }
            }

            // Count + CTA 2: entry with last slide 2 child
            {
                const t  = phase(pAnim, 0.958, 0.988);
                const op = t;
                const ty = `translateY(${(1 - t) * -Y}px)`;
                const cp = `inset(0 0 ${(1 - t) * 100}% 0)`;
                if (ctaEl2)   { ctaEl2.style.opacity   = op; ctaEl2.style.transform   = ty; ctaEl2.style.clipPath   = cp; }
            }

            // Pointer events
            if (panelSlide1) panelSlide1.style.pointerEvents = phase(pAnim, 0.70, 0.73) > 0.5 ? 'auto' : 'none';
            if (panelSlide2) panelSlide2.style.pointerEvents = phase(pAnim, 0.91, 0.94) > 0.5 ? 'auto' : 'none';

            // Counter slide 1
            if (!_counter1Fired && phase(pAnim, 0.70, 0.73) > 0 && panelSlide1) {
                _counter1Fired = true;
                fireCounters(panelSlide1);
            }
            if (phase(pAnim, 0.70, 0.73) === 0) _counter1Fired = false;

            // Counter slide 2
            if (!_counter2Fired && phase(pAnim, 0.91, 0.94) > 0 && panelSlide2) {
                _counter2Fired = true;
                fireCounters(panelSlide2);
            }
            if (phase(pAnim, 0.91, 0.94) === 0) _counter2Fired = false;
        }

        /* ─── Feed rail controller ───────────────────────────── */

        function centeredX(i) {
            return cardNaturalX[i] + (cardMediaWidths[i] || 0) / 2 - window.innerWidth / 2;
        }

        function closestCardIndex() {
            if (!cardNaturalX) return 0;
            let best = 0, minDist = Infinity;
            cardNaturalX.forEach((_, i) => {
                const d = Math.abs(centeredX(i) - feedScrollX);
                if (d < minDist) { minDist = d; best = i; }
            });
            return best;
        }

        function updateDots() {
            if (!feedDots || !cardNaturalX || hoveredCardIdx !== -1) return;
            const activeIdx = closestCardIndex();
            Array.from(feedDots.children).forEach((dot, i) =>
                dot.classList.toggle('feed-dot--active', i === activeIdx));
        }

        function panFeedTo(targetX, animate, duration, onComplete) {
            const lo = cardNaturalX?.length ? centeredX(0) : 0;
            const hi = cardNaturalX?.length ? centeredX(cardNaturalX.length - 1) : railOverflow;
            const clamp = Math.max(lo, Math.min(hi, targetX));
            const gen = ++_panGen;
            if (!animate) {
                feedScrollX = clamp;
                if (feedTrack) feedTrack.style.transform = `translateX(${-feedScrollX}px)`;
                updateDots();
                if (onComplete) onComplete();
                return;
            }
            const dur = duration || 380;
            const start = feedScrollX, t0 = performance.now();
            (function tick(now) {
                if (_panGen !== gen) return;
                const t = Math.min(1, (now - t0) / dur);
                feedScrollX = start + (clamp - start) * (1 - Math.pow(1 - t, 3));
                if (feedTrack) feedTrack.style.transform = `translateX(${-feedScrollX}px)`;
                updateDots();
                if (t < 1) requestAnimationFrame(tick);
                else if (onComplete) onComplete();
            })(t0);
        }


        let _wheelSnapTimer = null;

        function scheduleWheelSnap() {
            if (_wheelSnapTimer) clearTimeout(_wheelSnapTimer);
            _wheelSnapTimer = setTimeout(() => {
                _wheelSnapTimer = null;
                if (!feedRailActive || !cardNaturalX) return;
                const snapX = centeredX(closestCardIndex());
                panFeedTo(snapX, true);
            }, 150);
        }

        function onRailWheel(e) {
            // Block inertial frames from entry scroll gesture
            if (performance.now() - _railEntryTime < RAIL_ENTRY_INPUT_LOCK) {
                e.preventDefault();
                return;
            }

            const absX = Math.abs(e.deltaX);
            const absY = Math.abs(e.deltaY);
            const isH = absX > Math.max(4, absY * 1.15);

            if (!isH) return;

            e.preventDefault();
            const deltaX = Math.max(-RAIL_WHEEL_DELTA_LIMIT, Math.min(RAIL_WHEEL_DELTA_LIMIT, e.deltaX));
            panFeedTo(feedScrollX + deltaX, false);
            scheduleWheelSnap();
        }

        function onRailTouchStart(e) {
            _rtX = e.touches[0].clientX;
            _rtY = e.touches[0].clientY;
            _rtScrollX0 = feedScrollX;
            _rtAxis = null;
            _rtPanning = false;
            _rtVelHistory = [{ x: e.touches[0].clientX, t: performance.now() }];
            _panGen++; // cancel any in-flight snap animation
        }

        function onRailTouchMove(e) {
            const touch = e.touches[0];
            const dx = touch.clientX - _rtX;
            const dy = touch.clientY - _rtY;
            if (!_rtAxis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
                _rtAxis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
            }
            if (_rtAxis === 'h') {
                e.preventDefault();
                _rtPanning = true;
                panFeedTo(_rtScrollX0 - dx, false);
                const now = performance.now();
                _rtVelHistory.push({ x: touch.clientX, t: now });
                // keep only last 80ms
                while (_rtVelHistory.length > 1 && now - _rtVelHistory[0].t > 80) _rtVelHistory.shift();
            }
        }

        function onRailTouchEnd(e) {
            if (!_rtPanning) return;

            const snapPoints = cardNaturalX
                ? cardNaturalX.map((_, i) => centeredX(i))
                : [0];

            let vel = 0;
            if (_rtVelHistory.length >= 2) {
                const a = _rtVelHistory[0], b = _rtVelHistory[_rtVelHistory.length - 1];
                const dt = b.t - a.t;
                if (dt > 5) vel = -(b.x - a.x) / dt;
            }
            const projected = feedScrollX + vel * 320;

            const snapTarget = snapPoints.reduce((best, pt) =>
                Math.abs(pt - projected) < Math.abs(best - projected) ? pt : best, snapPoints[0]);
            const dist = Math.abs(snapTarget - feedScrollX);
            const dur  = Math.max(280, Math.min(600, dist * 0.9));
            panFeedTo(snapTarget, true, dur);
        }

        function navigateFeed(dir) {
            if (!feedRailActive || !cardNaturalX || !cardMediaWidths) return;
            const n = cardNaturalX.length;
            const next = Math.max(0, Math.min(n - 1, closestCardIndex() + dir));
            panFeedTo(centeredX(next), true);
        }

        function onRailKeyDown(e) {
            if (!feedRailActive) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); navigateFeed(1); }
            else if (e.key === 'ArrowLeft')  { e.preventDefault(); navigateFeed(-1); }
        }

        function enterRailMode(handoffFirstCardLeft) {
            if (feedRailActive) return;
            feedRailActive = true;
            _railEntryTime = performance.now();

            // Capture the first card's current screen position before the rail
            // swaps into clone mode, so the handoff doesn't visually jump.
            const stripMatch = feedStrip.style.transform.match(/translateX\(([^)]+)px\)/);
            const priorStripOffsetX = stripMatch ? parseFloat(stripMatch[1]) : 0;
            const firstCardWrap = feedCards[0]?.querySelector('.feed-card__media-wrap') || feedCards[0];
            const measuredFirstCardLeft = firstCardWrap
                ? firstCardWrap.getBoundingClientRect().left
                : ((introCardNaturalX && introCardNaturalX[0]) || 0) + priorStripOffsetX;
            const priorFirstCardLeft = Number.isFinite(handoffFirstCardLeft)
                ? handoffFirstCardLeft
                : measuredFirstCardLeft;

            feedStrip.style.transform = 'translateX(0)';
            feedStrip.classList.add('is-rail-active');
            if (feedTrack) feedTrack.style.transform = 'translateX(0)';

            setFeedChromeOpacity(1, false);
            if (feedTrack) feedTrack.getBoundingClientRect(); // force reflow

            // Measure card positions with zero transform applied
            const cardRects = feedCards.map(c => c.getBoundingClientRect());
            cardNaturalX    = cardRects.map(r => r.left);
            cardMediaWidths = cardRects.map(r => r.width);

            feedScrollX = cardNaturalX[0] - priorFirstCardLeft;
            railOverflow = feedTrack ? Math.max(0, feedTrack.scrollWidth - window.innerWidth) : 0;
            if (feedTrack) feedTrack.style.transform = `translateX(${-feedScrollX}px)`;

            setFeedHoverActive(true);
            ensureFeedDots();
            ensureFeedArrows();
            setFeedChromeOpacity(1, true);
            updateDots();
            window.addEventListener('wheel', onRailWheel, { passive: false });
            document.addEventListener('keydown', onRailKeyDown);
            feedStrip.addEventListener('touchstart', onRailTouchStart, { passive: true });
            feedStrip.addEventListener('touchmove',  onRailTouchMove,  { passive: false });
            feedStrip.addEventListener('touchend',   onRailTouchEnd,   { passive: true });
        }

        function exitRailMode() {
            if (!feedRailActive) return;
            feedRailActive = false;
            feedStrip.classList.remove('is-rail-active');
            if (_wheelSnapTimer) { clearTimeout(_wheelSnapTimer); _wheelSnapTimer = null; }
            window.removeEventListener('wheel', onRailWheel);
            document.removeEventListener('keydown', onRailKeyDown);
            feedStrip.removeEventListener('touchstart', onRailTouchStart);
            feedStrip.removeEventListener('touchmove',  onRailTouchMove);
            feedStrip.removeEventListener('touchend',   onRailTouchEnd);

            cardNaturalX = null;

            if (feedDots) {
                feedDots.style.opacity = '0';
                feedDots.style.pointerEvents = 'none';
            }
            if (feedNavArrows) {
                feedNavArrows.style.opacity = '0';
                feedNavArrows.style.pointerEvents = 'none';
            }
            setFeedHoverActive(false);
        }

        // Hover: dot highlight once feed cards begin entering.
        feedCards.forEach((card, i) => {
            card.addEventListener('mouseenter', () => {
                if (!feedHoverActive) return;
                hoveredCardIdx = i;
                card.classList.add('feed-card--hovered');
                if (feedDots) {
                    Array.from(feedDots.children).forEach((dot, j) =>
                        dot.classList.toggle('feed-dot--active', j === i));
                }
            });
            card.addEventListener('mouseleave', () => {
                hoveredCardIdx = -1;
                card.classList.remove('feed-card--hovered');
                if (feedHoverActive) updateDots();
            });
        });

        window.addEventListener('scroll', updateWork, { passive: true });
        updateWork();

        if (navFeed) {
            navFeed.addEventListener('click', e => {
                e.preventDefault();
                feedActive = true;
                lockNav(navFeed);
                const target = workSection.offsetTop + 0.93 * (workSection.offsetHeight - window.innerHeight);
                window.scrollTo({ top: target, behavior: 'smooth' });
            });
        }
        if (navHome) {
            navHome.addEventListener('click', e => {
                e.preventDefault();
                feedActive = false;
                lockNav(navHome);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    /* ─── Nav burger (mobile portrait: HOME / FEATURED / FEED) ── */
    // Route the bottom sheet links through the same handlers as the desktop nav.
    if (navDropdown) {
        navDropdown.querySelectorAll('.nav-dropdown__link').forEach(link => {
            link.addEventListener('click', e => {
                const section = getNavSection(link);
                const target = [navHome, navFeatured, navFeed].find(nav => getNavSection(nav) === section);
                if (!target) return;
                e.preventDefault();
                target.click();
            });
        });
    }

    // Keep active state in sync with the main nav active state
    function syncNavDropdownActive(activeSection) {
        if (!navDropdown) return;
        if (typeof activeSection !== 'string') {
            activeSection = getNavSection(document.querySelector('.home-navbar__navlink--active'));
        }
        navDropdown.querySelectorAll('.nav-dropdown__link').forEach(link => {
            const isActive = getNavSection(link) === activeSection;
            link.classList.toggle('nav-dropdown__link--active', isActive);
            if (isActive) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    window.addEventListener('scroll', () => syncNavDropdownActive(), { passive: true });
    syncNavDropdownActive();

    /* ─── Burger menu (mobile portrait) ────────────────────── */
    const burgerBtn     = document.getElementById('navbar-burger');
    const burgerModal   = document.getElementById('burger-modal');
    const burgerClose   = document.getElementById('burger-modal-close');
    const burgerBackdrop = document.getElementById('burger-modal-backdrop');

    function openBurger() {
        if (!burgerModal || !burgerBtn) return;
        burgerModal.classList.add('is-open');
        burgerBtn.classList.add('is-open');
        burgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeBurger() {
        if (!burgerModal || !burgerBtn) return;
        burgerModal.classList.remove('is-open');
        burgerBtn.classList.remove('is-open');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (burgerBtn)      burgerBtn.addEventListener('click', openBurger);
    if (burgerClose)    burgerClose.addEventListener('click', closeBurger);
    if (burgerBackdrop) burgerBackdrop.addEventListener('click', closeBurger);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBurger(); });

    /* ─── Magic letter hover cards ───────────────────────── */
    const magicCard = document.getElementById('magic-cursor-card');
    const magicImg  = document.getElementById('magic-cursor-img');
    const MAGIC_SRCS = [
        '/homepage/assets/magic-hover/1report-hover-magic.png',
        '/homepage/assets/magic-hover/2maari-hover-magic.jpg',
        '/homepage/assets/magic-hover/3passion-hover-magic.png',
        '/homepage/assets/magic-hover/4hiroshima-hover-magic.png',
        '/homepage/assets/magic-hover/5Don-hover-magic-crop.gif',
    ];
    if (magicCard && magicImg) {
        document.querySelectorAll('.magic-letter').forEach((letter, i) => {
            letter.addEventListener('mouseenter', () => {
                magicImg.src = MAGIC_SRCS[i];
                magicCard.style.opacity = '1';
            });
            letter.addEventListener('mouseleave', () => {
                magicCard.style.opacity = '0';
            });
            letter.addEventListener('mousemove', e => {
                magicCard.style.left = e.clientX + 'px';
                magicCard.style.top  = e.clientY + 'px';
            });
        });
    }

    /* ─── Sticker ring ───────────────────────────────────── */
    const stickerRing = document.querySelector('.sticker-ring');
    if (stickerRing) {
        // Clockwise angle from 12 o'clock for each tag's visual centre (unrotated)
        const TAG_ANGLES = {
            HOME:     0,
            UX:      51.44,
            PRODUCT: 115.72,
            GRAPHICS: 205.71,
            MOTION:  291.45,
        };

        let totalRotation = 0;

        function rotateTo(naturalAngle) {
            // Clockwise rotation that puts this tag at the top:
            // visual_angle = naturalAngle + R ≡ 0 (mod 360) → R = (360 - naturalAngle) % 360
            let target = (360 - naturalAngle) % 360;
            // Always spin clockwise — advance past the current total if needed
            while (target <= totalRotation) target += 360;
            totalRotation = target;
            stickerRing.style.transform = `rotate(${totalRotation}deg)`;
        }

        stickerRing.querySelectorAll('.sticker-tag').forEach(tagEl => {
            tagEl.addEventListener('click', () => {
                // Toggle off if already selected
                if (tagEl.classList.contains('sticker-tag--selected')) {
                    tagEl.classList.remove('sticker-tag--selected');
                    stickerRing.classList.remove('sticker-ring--has-selection');
                    return;
                }
                stickerRing.querySelectorAll('.sticker-tag').forEach(t =>
                    t.classList.remove('sticker-tag--selected')
                );
                tagEl.classList.add('sticker-tag--selected');
                stickerRing.classList.add('sticker-ring--has-selection');

                const naturalAngle = TAG_ANGLES[tagEl.dataset.tag];
                const visualAngle = ((naturalAngle + totalRotation) % 360 + 360) % 360;
                if (visualAngle > 0.5) rotateTo(naturalAngle);
            });
        });
    }

    /* ─── Identity modal ─────────────────────────────────── */
    const identityLink  = document.querySelector('.home-navbar__identity');
    const identityModal = document.getElementById('identity-modal');
    const identityClose = document.getElementById('identity-modal-close');

    function openIdentityModal() {
        if (identityModal) identityModal.classList.add('is-visible');
        if (identityLink) identityLink.classList.add('is-active');
    }

    function closeIdentityModal() {
        if (identityModal) identityModal.classList.remove('is-visible');
        if (identityLink) identityLink.classList.remove('is-active');
    }

    openIdentityModal();

    if (identityLink) {
        identityLink.addEventListener('mouseenter', openIdentityModal);
        identityLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (identityLink.classList.contains('is-active')) {
                closeIdentityModal();
            } else {
                openIdentityModal();
            }
        });
    }

    if (identityClose) {
        identityClose.addEventListener('click', closeIdentityModal);
    }

    /* ─── Resume lightbox component ─────────────────────── */
    window.ResumeModal = (function () {
        const modal    = document.getElementById('resume-modal');
        const closeBtn = document.getElementById('resume-modal-close');

        function open()  { if (modal) modal.classList.add('is-open'); }
        function close() { if (modal) modal.classList.remove('is-open'); }

        if (closeBtn) closeBtn.addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

        return { open, close };
    }());

    /* ─── Identity modal expand group ───────────────────── */
    const resumeToggle  = document.getElementById('identity-resume-toggle');
    const expandGroup   = resumeToggle && resumeToggle.closest('.identity-modal__expand-group');

    if (resumeToggle && expandGroup) {
        resumeToggle.addEventListener('click', () => {
            const expanded = expandGroup.classList.toggle('is-expanded');
            resumeToggle.setAttribute('aria-expanded', expanded);
        });
    }

    /* ─── Featured project list accordion ───────────────── */
    const projList = document.getElementById('proj-list');
    if (projList) {
        function animateProjCounter(el) {
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            if (isNaN(target)) return;
            const dur = 700, t0 = performance.now();
            (function tick(now) {
                const t = Math.min(1, (now - t0) / dur);
                const v = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(v * target) + suffix;
                if (t < 1) requestAnimationFrame(tick);
            })(t0);
        }

        projList.querySelectorAll('.proj-list__item').forEach(item => {
            const header = item.querySelector('.proj-list__header');
            if (!header) return;
            let countersFired = item.classList.contains('is-open');
            if (countersFired) {
                item.querySelectorAll('.proj-list__data-num[data-target]').forEach(animateProjCounter);
            }
            header.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');
                projList.querySelectorAll('.proj-list__item.is-open').forEach(open => {
                    open.classList.remove('is-open');
                    const h = open.querySelector('.proj-list__header');
                    if (h) h.setAttribute('aria-expanded', 'false');
                });
                if (!isOpen) {
                    item.classList.add('is-open');
                    header.setAttribute('aria-expanded', 'true');
                    if (!countersFired) {
                        countersFired = true;
                        item.querySelectorAll('.proj-list__data-num[data-target]').forEach(animateProjCounter);
                    }
                }
            });
        });
    }

    /* ─── Nav: featured + feed scroll targets ────────────── */
    const featuredSectionEl = document.getElementById('featured');
    const feedSectionEl     = document.getElementById('feed-section');

    if (navFeatured && featuredSectionEl) {
        navFeatured.addEventListener('click', e => {
            e.preventDefault();
            lockNav(navFeatured);
            featuredSectionEl.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (navFeed && feedSectionEl) {
        navFeed.addEventListener('click', e => {
            e.preventDefault();
            lockNav(navFeed);
            feedSectionEl.scrollIntoView({ behavior: 'smooth' });
        });
    }

    /* ─── Nav active state for new section layout ────────── */
    function getNavSectionForScroll() {
        if (!featuredSectionEl) return navHome;
        const sy = window.scrollY;
        const vpMid = sy + window.innerHeight * 0.5;
        if (vpMid < featuredSectionEl.offsetTop + 80) return navHome;
        if (feedSectionEl && vpMid >= feedSectionEl.offsetTop - 80) return navFeed;
        return navFeatured;
    }

    window.addEventListener('scroll', () => {
        if (navLocked) return;
        setNavActive(getNavSectionForScroll());
    }, { passive: true });
    setNavActive(getNavSectionForScroll());

    /* ─── Hero fade on scroll ────────────────────────────── */
    const heroStack  = document.querySelector('.hero-stack');
    const heroStage  = document.querySelector('.home-hero-stage');
    const cloudLayers = document.querySelectorAll('.cloud-layer');
    if (heroStack) {
        const fadeOver    = window.innerHeight * 0.6;
        const heroChildren = Array.from(heroStack.children);
        let _heroVisible = true;

        function updateHeroOpacity() {
            const sy = window.scrollY;
            const opacity = Math.max(0, 1 - sy / fadeOver);
            heroChildren.forEach(el => { el.style.opacity = opacity; });
            heroStack.style.visibility    = opacity === 0 ? 'hidden' : 'visible';
            heroStack.style.pointerEvents = opacity === 0 ? 'none' : '';
            cloudLayers.forEach(l => l.style.transform = `translateY(${-sy}px)`);
            if (starsEl) starsEl.style.transform = `translateY(${-sy}px)`;

            const atTop = window.scrollY === 0;
            if (!atTop && _heroVisible) {
                _heroVisible = false;
                closeIdentityModal();
                if (window._birdManager) {
                    window._birdManager.flyAllAway();
                    window._birdManager.setEnabled(false);
                }
            } else if (atTop && !_heroVisible) {
                _heroVisible = true;
                if (window._birdManager) window._birdManager.setEnabled(true);
            }
        }

        window.addEventListener('scroll', updateHeroOpacity, { passive: true });
        updateHeroOpacity();

        // ── Navbar scroll-active state ──────────────────
        const navCenterLinks  = Array.from(document.querySelectorAll('.home-navbar__center .home-navbar__navlink'));
        const navFeaturedLink = document.querySelector('.home-navbar__navlink[href="#featured"]');
        const featuredSection = document.getElementById('featured');

        if (navCenterLinks.length && navFeaturedLink && featuredSection) {
            function updateNavActive() {
                if (navLocked) return;
                setNavActive(getScrollNavActive());
            }

            window.addEventListener('scroll', updateNavActive, { passive: true });
            updateNavActive();

            // Slow scroll to pAnim=0.56 (first project panel fully open): scrolled = 0.56*0.65*total = 0.364*total
            navFeaturedLink.addEventListener('click', (e) => {
                e.preventDefault();
                feedActive = false;
                lockNav(navFeaturedLink);
                const total  = featuredSection.offsetHeight - window.innerHeight;
                const target = featuredSection.getBoundingClientRect().top + window.scrollY + 0.364 * total;
                const start  = window.scrollY;
                const dist   = target - start;
                const dur    = 1400;
                const t0     = performance.now();
                function step(now) {
                    const t    = Math.min(1, (now - t0) / dur);
                    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    window.scrollTo(0, start + dist * ease);
                    if (t < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
        }

        if (heroStage) {
            new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        heroChildren.forEach(el => { el.style.opacity = '0'; });
                        heroStack.style.visibility    = 'hidden';
                        heroStack.style.pointerEvents = 'none';
                    } else {
                        updateHeroOpacity();
                    }
                });
            }, { threshold: 0 }).observe(heroStage);
        }
    }
});
