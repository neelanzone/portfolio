document.addEventListener('DOMContentLoaded', () => {
    const galleryTiles = Array.from(document.querySelectorAll('[data-gallery-open]'));
    const lightbox = document.querySelector('[data-gallery-lightbox]');
    const stage = document.querySelector('[data-gallery-stage]');
    const stageCard = document.querySelector('[data-gallery-stage-card]');
    const stageImage = document.querySelector('[data-gallery-stage-image]');
    const stageVideo = document.querySelector('[data-gallery-stage-video]');
    const captionEl = document.querySelector('[data-gallery-lightbox-caption]');
    const prevButton = document.querySelector('[data-gallery-prev]');
    const nextButton = document.querySelector('[data-gallery-next]');
    const closeElements = Array.from(document.querySelectorAll('[data-gallery-close]'));
    const closeButton = lightbox ? lightbox.querySelector('.home-gallery-lightbox__close') : null;

    if (!galleryTiles.length || !lightbox || !stage || !stageCard || !stageImage || !stageVideo || !captionEl || !prevButton || !nextButton) {
        return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerp = (from, to, amount) => from + (to - from) * amount;
    const preloadedImageUrls = new Set();
    const preloadedVideoUrls = new Set();

    let activeTrigger = null;
    let activeIndex = -1;
    let isOpen = false;
    let rafId = 0;

    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let baseSpin = 0;
    let stageShiftX = 0;
    let stageOpacity = 1;
    let slideTransition = null;
    let stagePointerRect = null;

    let pointerInsideStage = false;
    const SWIPE_DISTANCE_PX = 92;
    const SWIPE_DURATION_MS = 260;
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (Math.pow(-2 * t + 2, 3) / 2));
    const MOTION_EPSILON = 0.03;

    const applyTransformToCard = (cardElement, shiftX, tiltX, tiltY, opacity, centered = false) => {
        if (!cardElement) {
            return;
        }

        const baseTranslate = centered ? 'translate(-50%, -50%) ' : '';
        cardElement.style.transform = `${baseTranslate}translateX(${shiftX.toFixed(2)}px) perspective(980px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
        cardElement.style.opacity = opacity.toFixed(3);
    };

    const applyCardTransform = () => {
        applyTransformToCard(
            stageCard,
            stageShiftX,
            currentTiltX,
            currentTiltY + baseSpin,
            stageOpacity
        );
    };

    const preloadMediaForTile = (tile) => {
        if (!tile) {
            return;
        }

        const thumbnailMedia = tile.dataset.galleryImage || '';
        const preferredLightboxMedia = tile.dataset.galleryLightboxImage || thumbnailMedia;
        const mediaUrl = preferredLightboxMedia || thumbnailMedia;

        if (!mediaUrl) {
            return;
        }

        const isVideoMedia = /\.(mp4|webm|ogg)$/i.test(mediaUrl);
        if (isVideoMedia) {
            if (preloadedVideoUrls.has(mediaUrl)) {
                return;
            }

            preloadedVideoUrls.add(mediaUrl);
            const preloadVideo = document.createElement('video');
            preloadVideo.preload = 'auto';
            preloadVideo.muted = true;
            preloadVideo.src = mediaUrl;
            preloadVideo.load();
            return;
        }

        if (preloadedImageUrls.has(mediaUrl)) {
            return;
        }

        preloadedImageUrls.add(mediaUrl);
        const preloadImage = new Image();
        preloadImage.decoding = 'async';
        preloadImage.src = mediaUrl;
    };

    const preloadNeighborMedia = (centerIndex) => {
        if (!galleryTiles.length || centerIndex < 0) {
            return;
        }

        preloadMediaForTile(galleryTiles[centerIndex]);
        preloadMediaForTile(galleryTiles[(centerIndex + 1) % galleryTiles.length]);
        preloadMediaForTile(galleryTiles[(centerIndex - 1 + galleryTiles.length) % galleryTiles.length]);
    };

    const shouldKeepAnimating = () => (
        Boolean(slideTransition)
        || pointerInsideStage
        || Math.abs(targetTiltX - currentTiltX) > MOTION_EPSILON
        || Math.abs(targetTiltY - currentTiltY) > MOTION_EPSILON
        || Math.abs(stageShiftX) > MOTION_EPSILON
        || Math.abs(1 - stageOpacity) > MOTION_EPSILON
    );

    const stopAnimationLoop = () => {
        if (!rafId) {
            return;
        }

        window.cancelAnimationFrame(rafId);
        rafId = 0;
    };

    const animationTick = (timestamp) => {
        if (!isOpen) {
            stopAnimationLoop();
            return;
        }

        if (slideTransition) {
            const elapsed = timestamp - slideTransition.startTime;
            const progress = Math.max(0, Math.min(1, elapsed / slideTransition.duration));
            const eased = easeInOutCubic(progress);

            stageShiftX = slideTransition.incomingFromX * (1 - eased);
            stageOpacity = 0.18 + (0.82 * eased);

            if (slideTransition.ghostEl) {
                const ghostShiftX = slideTransition.travelDirection * SWIPE_DISTANCE_PX * eased;
                const ghostOpacity = 1 - (0.82 * eased);
                applyTransformToCard(slideTransition.ghostEl, ghostShiftX, 0, 0, ghostOpacity, true);
            }

            if (progress >= 1) {
                if (slideTransition.ghostEl?.parentNode) {
                    slideTransition.ghostEl.remove();
                }

                stageShiftX = 0;
                stageOpacity = 1;
                slideTransition = null;
            }
        }

        if (!reduceMotion) {
            currentTiltX = lerp(currentTiltX, targetTiltX, 0.14);
            currentTiltY = lerp(currentTiltY, targetTiltY, 0.14);
        } else {
            currentTiltX = targetTiltX;
            currentTiltY = targetTiltY;
        }

        applyCardTransform();

        if (shouldKeepAnimating()) {
            rafId = window.requestAnimationFrame(animationTick);
            return;
        }

        rafId = 0;
    };

    const startAnimationLoop = () => {
        if (rafId) {
            return;
        }

        rafId = window.requestAnimationFrame(animationTick);
    };

    const updateTiltFromPointer = (event) => {
        const rect = stagePointerRect || stageCard.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return;
        }

        const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

        targetTiltY = Math.max(-12, Math.min(12, normalizedX * 9));
        targetTiltX = Math.max(-10, Math.min(10, normalizedY * -7));
    };

    const setLightboxOpen = (open) => {
        isOpen = open;
        lightbox.hidden = !open;
        lightbox.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('home-gallery-lightbox-open', open);

        if (open) {
            startAnimationLoop();
            window.requestAnimationFrame(() => closeButton?.focus({ preventScroll: true }));
        } else {
            pointerInsideStage = false;
            stagePointerRect = null;
            stageVideo.pause();
            if (slideTransition?.ghostEl?.parentNode) {
                slideTransition.ghostEl.remove();
            }
            slideTransition = null;
            targetTiltX = 0;
            targetTiltY = 0;
            currentTiltX = 0;
            currentTiltY = 0;
            stageShiftX = 0;
            stageOpacity = 1;
            applyCardTransform();
            stopAnimationLoop();

            if (activeTrigger instanceof HTMLElement) {
                activeTrigger.focus({ preventScroll: true });
            }
        }
    };

    const populateLightbox = (tile) => {
        const title = tile.dataset.galleryTitle || 'Untitled work';
        const caption = tile.dataset.galleryCaption || title;
        const thumbnailMedia = tile.dataset.galleryImage || '';
        const preferredLightboxMedia = tile.dataset.galleryLightboxImage || thumbnailMedia;
        const isVideoMedia = /\.(mp4|webm|ogg)$/i.test(preferredLightboxMedia);

        captionEl.textContent = caption;

        stageImage.onerror = null;
        stageVideo.onerror = null;

        const fallbackToThumbnailImage = () => {
            if (!thumbnailMedia || thumbnailMedia === preferredLightboxMedia) {
                return;
            }

            stageImage.src = thumbnailMedia;
        };

        const fallbackToThumbnailVideo = () => {
            if (!thumbnailMedia || thumbnailMedia === preferredLightboxMedia) {
                return;
            }

            stageVideo.src = thumbnailMedia;
            stageVideo.play().catch(() => {
                // Ignore autoplay failures.
            });
        };

        if (isVideoMedia) {
            stageImage.hidden = true;
            stageImage.removeAttribute('src');
            stageImage.alt = '';

            stageVideo.hidden = false;
            stageVideo.src = preferredLightboxMedia;
            stageVideo.currentTime = 0;
            stageVideo.setAttribute('aria-label', `${title} primary artwork`);
            stageVideo.onerror = fallbackToThumbnailVideo;
            stageVideo.play().catch(() => {
                // Autoplay may be blocked on some browsers; controls remain unnecessary here.
            });
        } else {
            stageVideo.pause();
            stageVideo.hidden = true;
            stageVideo.removeAttribute('src');
            stageVideo.removeAttribute('aria-label');

            stageImage.hidden = false;
            stageImage.src = preferredLightboxMedia;
            stageImage.alt = `${title} primary artwork`;
            stageImage.onerror = fallbackToThumbnailImage;
        }

        baseSpin = 0;
        targetTiltX = 0;
        targetTiltY = 0;
        currentTiltX = 0;
        currentTiltY = 0;
        applyCardTransform();
    };

    const openLightboxForTile = (tile) => {
        const tileIndex = galleryTiles.indexOf(tile);
        if (tileIndex === -1) {
            return;
        }

        activeIndex = tileIndex;
        activeTrigger = tile;
        preloadNeighborMedia(activeIndex);
        populateLightbox(tile);
        setLightboxOpen(true);
    };

    const navigateLightbox = (step) => {
        if (!isOpen || !galleryTiles.length || slideTransition) {
            return;
        }

        const nextIndex = (activeIndex + step + galleryTiles.length) % galleryTiles.length;
        const travelDirection = step > 0 ? -1 : 1;
        pointerInsideStage = false;
        stagePointerRect = null;
        targetTiltX = 0;
        targetTiltY = 0;
        preloadNeighborMedia(nextIndex);
        currentTiltX = 0;
        currentTiltY = 0;

        if (reduceMotion) {
            activeIndex = nextIndex;
            activeTrigger = galleryTiles[nextIndex];
            populateLightbox(activeTrigger);
            stageShiftX = 0;
            stageOpacity = 1;
            applyCardTransform();
            return;
        }

        const ghostEl = stageCard.cloneNode(true);
        ghostEl.classList.add('home-gallery-stage-card--ghost');
        ghostEl.setAttribute('aria-hidden', 'true');
        stage.insertBefore(ghostEl, captionEl);
        applyTransformToCard(ghostEl, 0, 0, 0, 1, true);

        activeIndex = nextIndex;
        activeTrigger = galleryTiles[nextIndex];
        populateLightbox(activeTrigger);

        const incomingFromX = -travelDirection * SWIPE_DISTANCE_PX;
        stageShiftX = incomingFromX;
        stageOpacity = 0.18;
        applyCardTransform();

        slideTransition = {
            travelDirection,
            incomingFromX,
            ghostEl,
            startTime: performance.now(),
            duration: SWIPE_DURATION_MS
        };
        startAnimationLoop();
    };

    const closeLightbox = () => {
        if (!isOpen) {
            return;
        }

        setLightboxOpen(false);
    };

    galleryTiles.forEach((tile) => {
        tile.addEventListener('click', () => {
            openLightboxForTile(tile);
        });
    });

    closeElements.forEach((element) => {
        element.addEventListener('click', closeLightbox);
    });

    prevButton.addEventListener('click', () => {
        navigateLightbox(-1);
    });

    nextButton.addEventListener('click', () => {
        navigateLightbox(1);
    });

    document.addEventListener('keydown', (event) => {
        if (!isOpen) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeLightbox();
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            navigateLightbox(-1);
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            navigateLightbox(1);
        }
    });

    stageCard.addEventListener('pointerenter', (event) => {
        if (!isOpen) {
            return;
        }

        pointerInsideStage = true;
        stagePointerRect = stageCard.getBoundingClientRect();
        updateTiltFromPointer(event);
        startAnimationLoop();
    });

    stageCard.addEventListener('pointermove', (event) => {
        if (!isOpen) {
            return;
        }

        if (!pointerInsideStage) {
            return;
        }

        updateTiltFromPointer(event);
    });

    stageCard.addEventListener('pointerleave', () => {
        pointerInsideStage = false;
        stagePointerRect = null;

        targetTiltY = 0;
        targetTiltX = 0;
        startAnimationLoop();
    });
});
