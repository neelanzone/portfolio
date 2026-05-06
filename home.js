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
    const ACT = 'home-navbar__navlink--active';
    let feedActive = false;
    let navLocked  = false;
    let _navLockTimer = null;
    function _unlockNav() {
        navLocked = false;
        clearTimeout(_navLockTimer);
        window.removeEventListener('scrollend', _unlockNav);
        if (feedActive) {
            setNavActive(navFeed);
        } else {
            const ws = document.getElementById('featured');
            const r  = ws ? ws.getBoundingClientRect() : null;
            setNavActive(r && r.top < window.innerHeight && r.bottom > 0 ? navFeatured : navHome);
        }
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
        [navHome, navFeatured, navFeed].forEach(el => el && el.classList.remove(ACT));
        if (active) active.classList.add(ACT);
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
        let cardMediaWidths = [];
        let cardMediaWraps  = [];
        let card0Width      = 0;
        let railOverflow    = 0;
        let feedScrollX     = 0;
        let feedRailActive  = false;
        let feedDots        = null;
        let hoveredCardIdx  = -1;
        let feedHoverActive = false;
        let feedLooping     = false;
        let _rtX = 0, _rtY = 0, _rtScrollX0 = 0, _rtAxis = null, _rtPanning = false;
        let _loopTouchY = 0, _loopTouchX = 0;
        const FEED_CHROME_TRIGGER_RATIO = 0.40;
        const LOOP_SCROLL_DURATION = 1500;
        const LOOP_CLOUDS_CLASS = 'home-alt--loop-clouds';
        const LOOP_CLOUDS_FADING_CLASS = 'home-alt--loop-clouds-fading';
        const LOOP_HOME_HELD_CLASS = 'home-alt--loop-home-held';
        const LOOP_CLOUD_FADE_DURATION = 600;

        function ensureFeedDots() {
            if (feedDots || !feedStrip?.parentElement) return feedDots;

            feedDots = document.createElement('div');
            feedDots.className = 'feed-dots';
            feedCards.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'feed-dot';
                dot.setAttribute('aria-label', `Feed item ${i + 1}`);
                dot.addEventListener('click', () =>
                    panFeedTo(Math.max(0, Math.min(railOverflow, cardNaturalX[i])), true));
                feedDots.appendChild(dot);
            });
            feedDots.style.opacity = '0';
            feedDots.style.pointerEvents = 'none';
            feedStrip.parentElement.appendChild(feedDots);
            return feedDots;
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
        }

        function getFeedChromeOpacity(feedOffsetX) {
            if (!cardNaturalX || !cardNaturalX.length) return 0;
            const firstCardLeft = cardNaturalX[0] + feedOffsetX;
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
            const MASK_H_MIN = isPortrait ? Math.round(FRAME_W * (window.innerWidth < 768 ? 0.72 : 0.65)) : Math.round(200 * S);
            const MASK_H_MAX = isPortrait ? Math.round(FRAME_W * (window.innerWidth < 768 ? 1.05 : 0.95)) : Math.round(550 * S);
            const PANEL_W_MAX = isPortrait ? FRAME_W : Math.round(532 * S);
            // portrait: panel grows in height below the image
            const PANEL_H_MAX = isPortrait ? Math.round(FRAME_W * (window.innerWidth < 768 ? 0.85 : 0.75)) : 0;
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
                        cardMediaWidths = cardMediaWraps.map(w => w?.offsetWidth || 0);
                        card0Width = cardMediaWidths[0] || 0;
                        railOverflow = feedTrack
                            ? Math.max(0, feedTrack.offsetWidth - window.innerWidth)
                            : 0;
                        feedCards.forEach((card, i) => { card.style.zIndex = feedCards.length - i; });
                    }

                    if (feedT < 1) {
                        if (feedRailActive) exitRailMode();
                        const feedOffsetX = (1 - feedT) * window.innerWidth;
                        feedStrip.style.transform = `translateX(${feedOffsetX.toFixed(2)}px)`;
                        if (feedTrack) feedTrack.style.transform = '';
                        const feedChromeOpacity = getFeedChromeOpacity(feedOffsetX);
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

        function updateDots() {
            if (!feedDots || !cardNaturalX || hoveredCardIdx !== -1) return;
            let activeIdx = 0, minDist = Infinity;
            cardNaturalX.forEach((x, i) => {
                const d = Math.abs(x - feedScrollX);
                if (d < minDist) { minDist = d; activeIdx = i; }
            });
            Array.from(feedDots.children).forEach((dot, i) =>
                dot.classList.toggle('feed-dot--active', i === activeIdx));
        }

        function panFeedTo(targetX, animate) {
            const clamp = Math.max(0, Math.min(railOverflow, targetX));
            if (!animate) {
                feedScrollX = clamp;
                if (feedTrack) feedTrack.style.transform = `translateX(${-feedScrollX}px)`;
                updateDots();
                return;
            }
            const start = feedScrollX, t0 = performance.now();
            (function tick(now) {
                const t = Math.min(1, (now - t0) / 380);
                feedScrollX = start + (clamp - start) * (1 - Math.pow(1 - t, 3));
                if (feedTrack) feedTrack.style.transform = `translateX(${-feedScrollX}px)`;
                updateDots();
                if (t < 1) requestAnimationFrame(tick);
            })(t0);
        }

        function removeIdsFromClone(el) {
            el.removeAttribute('id');
            el.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
            el.setAttribute('aria-hidden', 'true');
            el.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(child => {
                child.setAttribute('tabindex', '-1');
            });
        }

        function jumpScrollInstant(top) {
            const previousScrollBehavior = document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = 'auto';
            window.scrollTo({ top, left: 0, behavior: 'auto' });
            document.documentElement.style.scrollBehavior = previousScrollBehavior;
            window.dispatchEvent(new Event('scroll'));
        }

        function animateScrollTo(target, duration, onComplete, onUpdate) {
            const previousScrollBehavior = document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = 'auto';
            const start = window.scrollY;
            const dist = target - start;
            const t0 = performance.now();

            function step(now) {
                const t = Math.min(1, (now - t0) / duration);
                const ease = t * t * t * (t * (t * 6 - 15) + 10);
                window.scrollTo(0, start + dist * ease);
                if (onUpdate) onUpdate(ease, t);
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    document.documentElement.style.scrollBehavior = previousScrollBehavior;
                    if (onComplete) onComplete();
                }
            }

            requestAnimationFrame(step);
        }

        function blockLoopWheel(e) {
            if (feedLooping) e.preventDefault();
        }

        function beginLoop() {
            feedLooping = true;
            window.addEventListener('wheel', blockLoopWheel, { passive: false, capture: true });
            window.addEventListener('touchmove', blockLoopWheel, { passive: false, capture: true });
        }

        function endLoop() {
            feedLooping = false;
            window.removeEventListener('wheel', blockLoopWheel, { capture: true });
            window.removeEventListener('touchmove', blockLoopWheel, { capture: true });
        }

        function setLoopCloudOpacity(opacity) {
            document.body.style.setProperty('--loop-cloud-opacity', String(Math.max(0, Math.min(1, opacity))));
        }

        function prepareLoopClouds(opacity) {
            document.body.classList.add(LOOP_CLOUDS_CLASS);
            document.body.classList.remove(LOOP_CLOUDS_FADING_CLASS);
            setLoopCloudOpacity(opacity);
        }

        function resetLoopClouds() {
            document.body.classList.remove(LOOP_CLOUDS_CLASS, LOOP_CLOUDS_FADING_CLASS);
            document.body.style.removeProperty('--loop-cloud-opacity');
        }

        function fadeLoopCloudsInAfterHome(onComplete) {
            prepareLoopClouds(0);
            document.body.offsetHeight;
            requestAnimationFrame(() => {
                document.body.classList.add(LOOP_CLOUDS_FADING_CLASS);
                setLoopCloudOpacity(1);
                window.setTimeout(() => {
                    resetLoopClouds();
                    if (onComplete) onComplete();
                }, LOOP_CLOUD_FADE_DURATION);
            });
        }

        function fadeLoopCloudsOutBeforeFeed(onComplete) {
            prepareLoopClouds(1);
            document.body.offsetHeight;
            requestAnimationFrame(() => {
                document.body.classList.add(LOOP_CLOUDS_FADING_CLASS);
                setLoopCloudOpacity(0);
                window.setTimeout(() => {
                    if (onComplete) onComplete();
                }, LOOP_CLOUD_FADE_DURATION);
            });
        }

        function showHomeHeroForLoop() {
            const heroStack = document.querySelector('.hero-stack');
            document.body.classList.add(LOOP_HOME_HELD_CLASS);
            if (!heroStack) return;

            heroStack.style.visibility = 'visible';
            heroStack.style.pointerEvents = '';
            Array.from(heroStack.children).forEach(child => {
                child.style.opacity = '1';
            });
        }

        function releaseHomeHeroForLoop() {
            document.body.classList.remove(LOOP_HOME_HELD_CLASS);
        }

        function createHomeLoopClone() {
            const heroStage = document.querySelector('.home-hero-stage');
            if (!heroStage) return null;

            const clone = heroStage.cloneNode(true);
            clone.classList.add('loop-home-clone');
            removeIdsFromClone(clone);

            const clonedHeroStack = clone.querySelector('.hero-stack');
            if (clonedHeroStack) {
                clonedHeroStack.style.visibility = 'visible';
                clonedHeroStack.style.pointerEvents = '';
                Array.from(clonedHeroStack.children).forEach(child => {
                    child.style.opacity = '1';
                });
            }

            workSection.insertAdjacentElement('afterend', clone);
            return clone;
        }

        function createFeedEndLoopClone() {
            if (!feedStrip) return null;

            ensureFeedDots();
            const section = document.createElement('section');
            section.className = 'loop-feed-end-clone';
            section.setAttribute('aria-hidden', 'true');

            const overflow = feedTrack ? Math.max(0, feedTrack.offsetWidth - window.innerWidth) : 0;
            const feedClone = feedStrip.cloneNode(true);
            removeIdsFromClone(feedClone);
            feedClone.classList.add('is-feed-hover-active', 'is-rail-active');
            feedClone.style.transform = 'translateX(0)';
            feedClone.style.pointerEvents = 'none';
            feedClone.querySelectorAll('.feed-card').forEach(card => {
                card.classList.remove('feed-card--hovered');
                card.style.pointerEvents = 'none';
                card.style.transform = '';
            });
            feedClone.querySelectorAll('.feed-card__three-container').forEach(container => {
                container.style.transform = '';
            });
            feedClone.querySelectorAll('.feed-card__caption').forEach(cap => {
                cap.style.opacity = '1';
            });
            const clonedTrack = feedClone.querySelector('.feed-rail-track');
            if (clonedTrack) clonedTrack.style.transform = `translateX(${-overflow}px)`;
            section.appendChild(feedClone);

            if (feedDots) {
                const dotsClone = feedDots.cloneNode(true);
                removeIdsFromClone(dotsClone);
                dotsClone.style.opacity = '1';
                dotsClone.style.pointerEvents = 'none';
                const dots = Array.from(dotsClone.children);
                dots.forEach((dot, i) => {
                    dot.style.pointerEvents = 'none';
                    dot.classList.toggle('feed-dot--active', i === dots.length - 1);
                });
                section.appendChild(dotsClone);
            }

            const heroStage = document.querySelector('.home-hero-stage');
            if (heroStage) {
                heroStage.insertAdjacentElement('beforebegin', section);
            } else {
                document.body.insertBefore(section, document.body.firstChild);
            }
            return section;
        }

        function loopFeedToHome() {
            if (feedLooping) return;
            const homeClone = createHomeLoopClone();
            if (!homeClone) return;

            beginLoop();
            feedActive = false;
            navLocked = false;
            clearTimeout(_navLockTimer);
            window.removeEventListener('scrollend', _unlockNav);
            setNavActive(navHome);
            prepareLoopClouds(0);

            animateScrollTo(homeClone.offsetTop, LOOP_SCROLL_DURATION, () => {
                feedScrollX = 0;
                jumpScrollInstant(0);
                homeClone.remove();
                requestAnimationFrame(() => {
                    updateWork();
                    fadeLoopCloudsInAfterHome(endLoop);
                });
            });
        }

        function loopHomeToFeedEnd() {
            if (feedLooping) return;
            const feedClone = createFeedEndLoopClone();
            if (!feedClone) return;

            beginLoop();
            showHomeHeroForLoop();
            jumpScrollInstant(feedClone.offsetHeight);
            feedActive = true;
            navLocked = false;
            clearTimeout(_navLockTimer);
            window.removeEventListener('scrollend', _unlockNav);
            setNavActive(navFeed);

            fadeLoopCloudsOutBeforeFeed(() => {
                animateScrollTo(0, LOOP_SCROLL_DURATION, () => {
                    releaseHomeHeroForLoop();
                    feedClone.remove();
                    const total = workSection.offsetHeight - window.innerHeight;
                    jumpScrollInstant(workSection.offsetTop + total * 0.925);
                    resetLoopClouds();
                    updateWork();
                    if (!feedRailActive) enterRailMode();
                    railOverflow = feedTrack ? Math.max(0, feedTrack.offsetWidth - window.innerWidth) : 0;
                    panFeedTo(railOverflow, false);
                    setFeedChromeOpacity(1, true);
                    setFeedHoverActive(true);
                    endLoop();
                });
            });
        }

        function isSidebarWheelZone(e) {
            if (!homeSidebar || !indexBlock) return false;
            if (indexBlock.scrollHeight <= indexBlock.clientHeight + 1) return false;
            return e.clientX <= homeSidebar.getBoundingClientRect().right + 32;
        }

        function onPageLoopWheel(e) {
            if (feedLooping || e.defaultPrevented || window.scrollY > 1 || isSidebarWheelZone(e)) return;
            const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (delta >= 0) return;
            e.preventDefault();
            loopHomeToFeedEnd();
        }

        function onRailWheel(e) {
            if (feedLooping) {
                e.preventDefault();
                return;
            }
            // Both axes drive the carousel; prefer the dominant axis.
            const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            // Left edge still lets the page scroll naturally upward.
            // Right edge scrolls down into a temporary Home panel before the hidden reset.
            if (delta > 0 && feedScrollX >= railOverflow - 1) {
                e.preventDefault();
                loopFeedToHome();
                return;
            }
            if (delta < 0 && feedScrollX <= 0) return;
            e.preventDefault();
            panFeedTo(feedScrollX + delta, false);
        }

        function onRailTouchStart(e) {
            if (feedLooping) return;
            _rtX = e.touches[0].clientX;
            _rtY = e.touches[0].clientY;
            _rtScrollX0 = feedScrollX;
            _rtAxis = null;
            _rtPanning = false;
        }

        function onRailTouchMove(e) {
            if (feedLooping) { e.preventDefault(); return; }
            const dx = e.touches[0].clientX - _rtX;
            const dy = e.touches[0].clientY - _rtY;
            if (!_rtAxis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
                _rtAxis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
            }
            if (_rtAxis === 'h') {
                e.preventDefault();
                _rtPanning = true;
                panFeedTo(_rtScrollX0 - dx, false);
            }
        }

        function onRailTouchEnd(e) {
            if (feedLooping || !_rtPanning) return;
            const dx = e.changedTouches[0].clientX - _rtX;
            if (feedScrollX >= railOverflow - 1 && dx < -30) {
                loopFeedToHome();
            }
        }

        function enterRailMode() {
            if (feedRailActive) return;
            feedRailActive = true;
            feedScrollX = 0;
            railOverflow = feedTrack ? Math.max(0, feedTrack.offsetWidth - window.innerWidth) : 0;
            feedStrip.style.transform = 'translateX(0)';
            feedStrip.classList.add('is-rail-active');
            if (feedTrack) feedTrack.style.transform = 'translateX(0)';

            setFeedHoverActive(true);
            ensureFeedDots();
            setFeedChromeOpacity(1, true);
            updateDots();
            window.addEventListener('wheel', onRailWheel, { passive: false });
            feedStrip.addEventListener('touchstart', onRailTouchStart, { passive: true });
            feedStrip.addEventListener('touchmove',  onRailTouchMove,  { passive: false });
            feedStrip.addEventListener('touchend',   onRailTouchEnd,   { passive: true });
        }

        function exitRailMode() {
            if (!feedRailActive) return;
            feedRailActive = false;
            feedStrip.classList.remove('is-rail-active');
            window.removeEventListener('wheel', onRailWheel);
            feedStrip.removeEventListener('touchstart', onRailTouchStart);
            feedStrip.removeEventListener('touchmove',  onRailTouchMove);
            feedStrip.removeEventListener('touchend',   onRailTouchEnd);
            if (feedDots) {
                feedDots.style.opacity = '0';
                feedDots.style.pointerEvents = 'none';
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

        function onHomeLoopTouchStart(e) {
            _loopTouchY = e.touches[0].clientY;
            _loopTouchX = e.touches[0].clientX;
        }
        function onHomeLoopTouchEnd(e) {
            if (feedLooping || window.scrollY > 1) return;
            const dy = e.changedTouches[0].clientY - _loopTouchY;
            const dx = e.changedTouches[0].clientX - _loopTouchX;
            const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
            if (delta > 40) loopHomeToFeedEnd();
        }

        window.addEventListener('scroll', updateWork, { passive: true });
        window.addEventListener('wheel', onPageLoopWheel, { passive: false });
        window.addEventListener('touchstart', onHomeLoopTouchStart, { passive: true });
        window.addEventListener('touchend',   onHomeLoopTouchEnd,   { passive: true });
        updateWork();

        if (navFeed) {
            navFeed.addEventListener('click', e => {
                e.preventDefault();
                feedActive = true;
                lockNav(navFeed);
                const target = workSection.offsetTop + 0.77 * (workSection.offsetHeight - window.innerHeight);
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
    const navBurgerBtn  = document.getElementById('navbar-nav-burger');
    const navDropdown   = document.getElementById('nav-dropdown');
    const navDropFeed   = document.getElementById('nav-dropdown-feed');

    function openNavDropdown() {
        if (!navDropdown || !navBurgerBtn) return;
        navDropdown.classList.add('is-open');
        navBurgerBtn.classList.add('is-open');
        navBurgerBtn.setAttribute('aria-expanded', 'true');
    }

    function closeNavDropdown() {
        if (!navDropdown || !navBurgerBtn) return;
        navDropdown.classList.remove('is-open');
        navBurgerBtn.classList.remove('is-open');
        navBurgerBtn.setAttribute('aria-expanded', 'false');
    }

    if (navBurgerBtn) {
        navBurgerBtn.addEventListener('click', e => {
            e.stopPropagation();
            navDropdown.classList.contains('is-open') ? closeNavDropdown() : openNavDropdown();
        });
    }

    if (navDropdown) {
        // Close when any link is tapped
        navDropdown.querySelectorAll('.nav-dropdown__link').forEach(link => {
            link.addEventListener('click', () => closeNavDropdown());
        });
    }

    // Wire FEED link in dropdown to the same scroll behaviour as the navbar FEED link
    if (navDropFeed && navFeed) {
        navDropFeed.addEventListener('click', e => {
            e.preventDefault();
            closeNavDropdown();
            navFeed.click();
        });
    }

    // Close on outside tap
    document.addEventListener('click', e => {
        if (navDropdown && navDropdown.classList.contains('is-open') &&
            !navDropdown.contains(e.target) && e.target !== navBurgerBtn) {
            closeNavDropdown();
        }
    });

    // Keep active state in sync with the main nav active state
    function syncNavDropdownActive() {
        if (!navDropdown) return;
        navDropdown.querySelectorAll('.nav-dropdown__link').forEach(link => {
            link.classList.remove('nav-dropdown__link--active');
        });
        // Match by href against the currently active center navlink
        const activeHref = document.querySelector('.home-navbar__navlink--active')?.getAttribute('href');
        navDropdown.querySelectorAll('.nav-dropdown__link').forEach(link => {
            if (link.getAttribute('href') === activeHref) link.classList.add('nav-dropdown__link--active');
        });
    }

    window.addEventListener('scroll', syncNavDropdownActive, { passive: true });
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

    /* ─── Hero fade on scroll ────────────────────────────── */
    const heroStack  = document.querySelector('.hero-stack');
    const heroStage  = document.querySelector('.home-hero-stage');
    const cloudLayers = document.querySelectorAll('.cloud-layer');
    if (heroStack) {
        const fadeOver    = window.innerHeight * 0.6;
        const heroChildren = Array.from(heroStack.children);
        let _heroVisible = true;

        function updateHeroOpacity() {
            if (document.body.classList.contains('home-alt--loop-home-held')) {
                heroChildren.forEach(el => { el.style.opacity = '1'; });
                heroStack.style.visibility    = 'visible';
                heroStack.style.pointerEvents = '';
                cloudLayers.forEach(l => l.style.transform = 'translateY(0)');
                if (starsEl) starsEl.style.transform = 'translateY(0)';
                return;
            }

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
            function setActiveNav(link) {
                navCenterLinks.forEach(l => l.classList.remove('home-navbar__navlink--active'));
                link.classList.add('home-navbar__navlink--active');
            }

            function updateNavActive() {
                if (feedActive || navLocked) return;
                const rect = featuredSection.getBoundingClientRect();
                const inFeatured = rect.top < window.innerHeight && rect.bottom > 0;
                setActiveNav(inFeatured ? navFeaturedLink : navCenterLinks[0]);
            }

            window.addEventListener('scroll', updateNavActive, { passive: true });
            updateNavActive();

            // Slow scroll to p=0.56 (panel fully open on first card)
            navFeaturedLink.addEventListener('click', (e) => {
                e.preventDefault();
                feedActive = false;
                lockNav(navFeaturedLink);
                const total  = featuredSection.offsetHeight - window.innerHeight;
                const target = featuredSection.getBoundingClientRect().top + window.scrollY + 0.56 * total;
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
