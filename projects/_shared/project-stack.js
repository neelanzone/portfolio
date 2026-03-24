(function () {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const pageScale = document.getElementById('page-scale');
    const overlayRoot = document.getElementById('project-stack-overlay');
    const navbar = document.querySelector('.project-page .navbar') || document.querySelector('.page-navbar');
    const sectionPills = document.getElementById('section-pills');
    const sectionChoreography = {
        hero: {
            pinAfter: 0
        },
        overview: {
            pinTo: 'navbar'
        },
        context: {
            pinTo: 'navbar'
        },
        process: {
            pinTo: 'navbar'
        },
        outcomes: {
            pinTo: 'navbar',
            allowOverflowScroll: true
        }
    };

    const items = Array.from(document.querySelectorAll('[data-stack-card]'))
        .map(function (section, index) {
            const inner = section.querySelector('.project-stack-card__inner');

            if (!inner) {
                return null;
            }

            return {
                index: index,
                id: section.id,
                section: section,
                inner: inner,
                shell: null,
                placeholderHeight: 0,
                freezeTop: null,
                pinTop: null,
                choreography: sectionChoreography[section.id] ?? null
            };
        })
        .filter(Boolean);

    if (!items.length || !overlayRoot || !pageScale) {
        return;
    }

    let mounted = false;
    let frame = 0;
    let stage = null;

    const getDesktopScale = function () {
        const zoom = parseFloat(window.getComputedStyle(pageScale).zoom || '1');
        return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
    };

    const getStageRect = function () {
        return pageScale.getBoundingClientRect();
    };

    const getFreezeLine = function () {
        return Math.min(window.innerHeight - 80, Math.max(240, window.innerHeight * 0.78));
    };

    const ensureStage = function () {
        if (stage) {
            return stage;
        }

        stage = document.createElement('div');
        stage.className = 'project-stack-stage';
        overlayRoot.appendChild(stage);
        return stage;
    };

    const ensureShell = function (item) {
        if (item.shell) {
            return item.shell;
        }

        const shell = document.createElement('div');
        shell.className = 'project-stack-stage__item';
        shell.dataset.stackIndex = String(item.index);
        shell.appendChild(item.inner);
        ensureStage().appendChild(shell);
        item.shell = shell;
        return shell;
    };

    const resetShellStyles = function (shell, item) {
        shell.style.height = item.placeholderHeight / getDesktopScale() + 'px';
        shell.style.overflow = 'visible';
        item.inner.style.transform = '';
    };

    const updateStageGeometry = function () {
        const scale = getDesktopScale();
        const stageRect = getStageRect();
        const stageWidth = stageRect.width / scale;

        overlayRoot.style.setProperty('--project-stage-scale', String(scale));
        overlayRoot.style.setProperty('--project-stage-left', Math.round(stageRect.left) + 'px');
        overlayRoot.style.setProperty('--project-stage-width', Math.round(stageWidth) + 'px');
    };

    const updatePlaceholderHeights = function () {
        items.forEach(function (item) {
            item.placeholderHeight = item.inner.offsetHeight;
            item.section.style.height = item.placeholderHeight + 'px';

            if (item.shell) {
                resetShellStyles(item.shell, item);
            }
        });
    };

    const updatePinAnchors = function () {
        items.forEach(function (item) {
            if (!item.choreography) {
                item.pinTop = null;
                return;
            }

            if (item.choreography.pinTo === 'navbar' && navbar) {
                const navbarBottom = navbar.getBoundingClientRect().bottom;
                const pillsBottom = sectionPills ? sectionPills.getBoundingClientRect().bottom : navbarBottom;
                item.pinTop = Math.round(Math.max(navbarBottom, pillsBottom));
                return;
            }

            if (typeof item.choreography.pinAfter === 'number') {
                item.pinTop = item.section.getBoundingClientRect().top - item.choreography.pinAfter;
                return;
            }

            item.pinTop = null;
        });
    };

    const mountDesktop = function () {
        if (mounted) {
            return;
        }

        ensureStage();
        updateStageGeometry();

        items.forEach(function (item) {
            ensureShell(item);
            item.section.classList.add('project-stack-card--placeholder');
        });

        updatePlaceholderHeights();
        updatePinAnchors();
        overlayRoot.dataset.ready = 'true';
        mounted = true;
    };

    const unmountDesktop = function () {
        if (!mounted) {
            return;
        }

        if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
        }

        items.forEach(function (item) {
            item.freezeTop = null;
            item.pinTop = null;
            item.section.dataset.stackState = 'flow';
            item.section.classList.remove('project-stack-card--placeholder');
            item.section.style.height = '';
            item.inner.style.transform = '';

            if (item.shell) {
                item.shell.style.height = '';
                item.shell.style.overflow = '';
                item.section.appendChild(item.inner);
                item.shell.remove();
                item.shell = null;
            }
        });

        if (stage) {
            stage.remove();
            stage = null;
        }

        overlayRoot.removeAttribute('data-ready');
        overlayRoot.style.removeProperty('--project-stage-scale');
        overlayRoot.style.removeProperty('--project-stage-width');
        overlayRoot.style.removeProperty('--project-stage-left');
        mounted = false;
    };

    const resolvePinnedTop = function (item, sectionRect, nextRect) {
        if (item.choreography && item.pinTop !== null) {
            const shouldFreeze = sectionRect.top <= item.pinTop;

            if (!shouldFreeze) {
                item.freezeTop = null;
                return {
                    top: sectionRect.top,
                    state: 'flow',
                    clipHeight: item.placeholderHeight,
                    innerOffset: 0
                };
            }

            if (typeof item.choreography.pinAfter === 'number') {
                item.freezeTop = item.pinTop;
                return {
                    top: item.pinTop,
                    state: 'frozen',
                    clipHeight: item.placeholderHeight,
                    innerOffset: 0
                };
            }

            const allowOverflowScroll = item.choreography?.allowOverflowScroll === true;
            const availableHeight = Math.max(120, window.innerHeight - item.pinTop);
            const overflow = Math.max(0, item.placeholderHeight - availableHeight);

            if (!allowOverflowScroll || overflow <= 0) {
                item.freezeTop = item.pinTop;
                return {
                    top: item.pinTop,
                    state: 'frozen',
                    clipHeight: item.placeholderHeight,
                    innerOffset: 0
                };
            }

            const scrollPastPin = Math.max(0, item.pinTop - sectionRect.top);
            const innerOffset = Math.min(scrollPastPin, overflow);

            item.freezeTop = item.pinTop;
            return {
                top: item.pinTop,
                state: innerOffset > 0 ? 'scrolling' : 'frozen',
                clipHeight: availableHeight,
                innerOffset: innerOffset
            };
        }

        if (!nextRect) {
            item.freezeTop = null;
            return {
                top: sectionRect.top,
                state: 'flow',
                clipHeight: item.placeholderHeight,
                innerOffset: 0
            };
        }

        const shouldFreeze = nextRect.top <= getFreezeLine();

        if (!shouldFreeze) {
            item.freezeTop = null;
            return {
                top: sectionRect.top,
                state: 'flow',
                clipHeight: item.placeholderHeight,
                innerOffset: 0
            };
        }

        if (item.freezeTop === null) {
            item.freezeTop = sectionRect.top;
        }

        return {
            top: item.freezeTop,
            state: 'frozen',
            clipHeight: item.placeholderHeight,
            innerOffset: 0
        };
    };

    const render = function () {
        frame = 0;

        if (!mounted || !desktopQuery.matches) {
            return;
        }

        updateStageGeometry();
        updatePlaceholderHeights();

        const scale = getDesktopScale();

        items.forEach(function (item, index) {
            const shell = ensureShell(item);
            const sectionRect = item.section.getBoundingClientRect();
            const nextItem = items[index + 1];
            const nextRect = nextItem ? nextItem.section.getBoundingClientRect() : null;
            const resolved = resolvePinnedTop(item, sectionRect, nextRect);

            shell.dataset.stackState = resolved.state;
            shell.style.transform = 'translate3d(0, ' + (resolved.top / scale) + 'px, 0)';
            shell.style.height = resolved.clipHeight / scale + 'px';
            shell.style.overflow = resolved.clipHeight < item.placeholderHeight ? 'hidden' : 'visible';
            shell.style.zIndex = String(20 + index);
            item.inner.style.transform = resolved.innerOffset > 0
                ? 'translate3d(0, -' + (resolved.innerOffset / scale) + 'px, 0)'
                : '';
            item.section.dataset.stackState = resolved.state;
        });
    };

    const scheduleRender = function () {
        if (frame) {
            return;
        }

        frame = window.requestAnimationFrame(render);
    };

    const refresh = function () {
        if (!desktopQuery.matches) {
            unmountDesktop();
            return;
        }

        mountDesktop();
        updatePinAnchors();
        render();
    };

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(function () {
            if (desktopQuery.matches) {
                refresh();
            }
        });

        items.forEach(function (item) {
            resizeObserver.observe(item.inner);
        });
    }

    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(function () {
            refresh();
        }).catch(function () {
            refresh();
        });
    }

    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh);
    desktopQuery.addEventListener('change', refresh);

    refresh();
}());




