(function () {
    function syncSnackbarPillWidths() {
        var stacks = Array.prototype.slice.call(document.querySelectorAll('.project-longform__snackbar-stack'));

        stacks.forEach(function (stack) {
            var pills = Array.prototype.slice.call(stack.querySelectorAll('.project-longform__snackbar-pill'));
            var maxWidth = 0;

            if (!pills.length) {
                stack.style.removeProperty('--project-longform-snackbar-pill-width');
                return;
            }

            stack.style.removeProperty('--project-longform-snackbar-pill-width');
            pills.forEach(function (pill) {
                pill.style.width = 'auto';
            });

            pills.forEach(function (pill) {
                maxWidth = Math.max(maxWidth, Math.ceil(pill.getBoundingClientRect().width));
            });

            if (!maxWidth) {
                return;
            }

            stack.style.setProperty('--project-longform-snackbar-pill-width', maxWidth + 'px');
            pills.forEach(function (pill) {
                pill.style.width = maxWidth + 'px';
            });
        });
    }

    function initFeatureCarousels() {
        var carousels = Array.prototype.slice.call(document.querySelectorAll('[data-project-feature-carousel]'));

        carousels.forEach(function (carousel) {
            var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-project-feature-slide]'));
            var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-project-feature-dot]'));

            if (slides.length < 2 || !dots.length) {
                return;
            }

            var setActiveSlide = function (index) {
                slides.forEach(function (slide, slideIndex) {
                    var isActive = slideIndex === index;
                    slide.classList.toggle('is-active', isActive);
                    slide.hidden = !isActive;
                });

                dots.forEach(function (dot, dotIndex) {
                    var isActive = dotIndex === index;
                    dot.classList.toggle('is-active', isActive);
                    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });

                carousel.dataset.activeSlide = String(index);
            };

            dots.forEach(function (dot, index) {
                dot.addEventListener('click', function () {
                    setActiveSlide(index);
                });
            });

            setActiveSlide(0);
        });
    }

    function initTopbarPillCursorHighlight() {
        var pills = Array.prototype.slice.call(document.querySelectorAll('[data-project-topbar-pill]'));

        if (!pills.length) {
            return;
        }

        var resetPill = function (pill) {
            pill.style.setProperty('--project-pill-x', '50%');
            pill.style.setProperty('--project-pill-y', '50%');
        };

        var updatePill = function (pill, clientX, clientY) {
            var rect = pill.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return;
            }

            var x = ((clientX - rect.left) / rect.width) * 100;
            var y = ((clientY - rect.top) / rect.height) * 100;
            var clampedX = Math.max(0, Math.min(100, x));
            var clampedY = Math.max(0, Math.min(100, y));

            pill.style.setProperty('--project-pill-x', clampedX.toFixed(2) + '%');
            pill.style.setProperty('--project-pill-y', clampedY.toFixed(2) + '%');
        };

        pills.forEach(function (pill) {
            resetPill(pill);

            pill.addEventListener('pointerenter', function (event) {
                updatePill(pill, event.clientX, event.clientY);
            });

            pill.addEventListener('pointermove', function (event) {
                updatePill(pill, event.clientX, event.clientY);
            });


        });
    }
    function initProjectLongform() {
        if (!document.body || !document.body.classList.contains('template-project-longform')) {
            return;
        }

        var rafId = 0;
        var requestSync = function () {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }

            rafId = window.requestAnimationFrame(function () {
                rafId = 0;
                syncSnackbarPillWidths();
            });
        };

        initFeatureCarousels();
        initTopbarPillCursorHighlight();
        requestSync();
        window.addEventListener('resize', requestSync);
        window.addEventListener('load', requestSync);

        if (document.fonts && typeof document.fonts.ready?.then === 'function') {
            document.fonts.ready.then(requestSync).catch(function () {
                requestSync();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProjectLongform, { once: true });
    } else {
        initProjectLongform();
    }
})();
