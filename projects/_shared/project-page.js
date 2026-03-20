/* Generated from design-project-template-desktop.html */
class ProjectSpaceField {
            constructor(container, isLightMode) {
                if (!window.THREE || !container) {
                    return;
                }

                this.container = container;
                this.elapsed = 0;
                this.swipeImpulse = 0;
                this.positionX = 0;
                this.rotationZ = 0;
                this.vortexVelocity = 0;
                this.vortexOffset = 0;
                this.rafId = null;
                this.isAnimating = false;
                this.isVisible = true;
                this.isDocumentVisible = !document.hidden;
                this.handleResize = this.handleResize.bind(this);
                this.animate = this.animate.bind(this);

                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
                this.camera.position.set(0, 0, 26);

                this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.container.appendChild(this.renderer.domElement);

                this.geometry = new THREE.BufferGeometry();
                this.positions = new Float32Array(2200 * 3);
                this.basePositions = new Float32Array(2200 * 3);
                this.colors = new Float32Array(2200 * 3);
                this.pointSeeds = new Float32Array(2200);

                for (let i = 0; i < 2200; i += 1) {
                    const offset = i * 3;
                    const posX = (Math.random() - 0.5) * 92;
                    const posY = (Math.random() - 0.5) * 34;
                    const posZ = (Math.random() - 0.5) * 52;

                    this.positions[offset] = posX;
                    this.positions[offset + 1] = posY;
                    this.positions[offset + 2] = posZ;
                    this.basePositions[offset] = posX;
                    this.basePositions[offset + 1] = posY;
                    this.basePositions[offset + 2] = posZ;
                    this.pointSeeds[i] = Math.random();
                }

                this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
                this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

                const particleCanvas = document.createElement('canvas');
                particleCanvas.width = 24;
                particleCanvas.height = 24;
                const particleContext = particleCanvas.getContext('2d');
                particleContext.clearRect(0, 0, 24, 24);
                const particleGradient = particleContext.createRadialGradient(12, 12, 1.5, 12, 12, 9.2);
                particleGradient.addColorStop(0, 'rgba(255,255,255,0.96)');
                particleGradient.addColorStop(0.45, 'rgba(255,255,255,0.88)');
                particleGradient.addColorStop(0.78, 'rgba(255,255,255,0.22)');
                particleGradient.addColorStop(1, 'rgba(255,255,255,0)');
                particleContext.fillStyle = particleGradient;
                particleContext.beginPath();
                particleContext.roundRect(3.5, 3.5, 17, 17, 4.5);
                particleContext.fill();
                this.particleTexture = new THREE.CanvasTexture(particleCanvas);

                this.material = new THREE.PointsMaterial({
                    size: 0.22,
                    map: this.particleTexture,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.9,
                    alphaTest: 0.03,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });

                this.points = new THREE.Points(this.geometry, this.material);
                this.scene.add(this.points);

                this.handleResize();
                this.applyTheme(isLightMode);

                if (window.ResizeObserver) {
                    this.resizeObserver = new ResizeObserver(this.handleResize);
                    this.resizeObserver.observe(this.container);
                } else {
                    window.addEventListener('resize', this.handleResize);
                }

                this.visibilityObserver = new IntersectionObserver((entries) => {
                    this.isVisible = entries[0]?.isIntersecting ?? true;
                    this.updateAnimationState();
                }, { threshold: 0.05 });
                this.visibilityObserver.observe(this.container);

                document.addEventListener('visibilitychange', () => {
                    this.isDocumentVisible = !document.hidden;
                    this.updateAnimationState();
                });

                this.updateAnimationState();
            }

            handleResize() {
                const width = Math.max(1, this.container.clientWidth);
                const height = Math.max(1, this.container.clientHeight);
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }

            applyTheme(isLightMode) {
                const cool = new THREE.Color(isLightMode ? 0xaeb4bf : 0x6ab3ff);
                const warm = new THREE.Color(isLightMode ? 0xe2e5ea : 0xffa34d);
                const colorsAttr = this.geometry.getAttribute('color');

                for (let i = 0; i < colorsAttr.count; i += 1) {
                    const x = this.positions[i * 3];
                    const y = this.positions[i * 3 + 1];
                    const mix = Math.max(0, Math.min(1, (x + 46) / 92));
                    const color = cool.clone().lerp(warm, mix);
                    const brightness = isLightMode ? 0.58 + ((y + 17) / 110) : 0.55 + ((y + 17) / 70);

                    colorsAttr.setXYZ(
                        i,
                        Math.min(1, color.r * brightness),
                        Math.min(1, color.g * brightness),
                        Math.min(1, color.b * brightness)
                    );
                }

                colorsAttr.needsUpdate = true;
                this.material.opacity = isLightMode ? 0.92 : 0.88;
                this.material.blending = isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
                this.material.size = isLightMode ? 0.26 : 0.22;
                this.material.needsUpdate = true;
            }

            updateAnimationState() {
                const shouldAnimate = this.isVisible && this.isDocumentVisible;
                if (shouldAnimate && !this.isAnimating) {
                    this.isAnimating = true;
                    this.rafId = requestAnimationFrame(this.animate);
                } else if (!shouldAnimate && this.isAnimating) {
                    this.isAnimating = false;
                    if (this.rafId) {
                        cancelAnimationFrame(this.rafId);
                        this.rafId = null;
                    }
                }
            }

            nudge(amount) {
                this.swipeImpulse = Math.max(-1.8, Math.min(1.8, this.swipeImpulse + amount));
                this.vortexVelocity = Math.max(-2.6, Math.min(2.6, this.vortexVelocity + amount * 0.45));
            }

            animate() {
                if (!this.isAnimating) {
                    return;
                }

                this.elapsed += 0.008;
                this.swipeImpulse *= 0.92;
                this.vortexVelocity *= 0.94;
                this.vortexOffset += this.vortexVelocity * 0.055;
                this.positionX += (this.swipeImpulse * 5.5 - this.positionX) * 0.08;
                this.rotationZ += (this.swipeImpulse * 0.12 - this.rotationZ) * 0.08;

                const positionsAttr = this.geometry.getAttribute('position');
                const vortexAmount = Math.min(1.4, Math.abs(this.vortexVelocity) + Math.abs(this.swipeImpulse) * 0.6);

                for (let i = 0; i < positionsAttr.count; i += 1) {
                    const offset = i * 3;
                    const baseX = this.basePositions[offset];
                    const baseY = this.basePositions[offset + 1];
                    const baseZ = this.basePositions[offset + 2];
                    const seed = this.pointSeeds[i];
                    const radialDistance = Math.hypot(baseX, baseY);
                    const radialNorm = Math.min(1, radialDistance / 46);
                    const falloff = 1 - radialNorm * 0.72;
                    const flutter = Math.sin(this.elapsed * 1.25 + seed * 12) * 0.42;
                    const swirlAngle = this.vortexOffset * (0.24 + falloff * 1.18) + flutter * 0.025;
                    const swirlCos = Math.cos(swirlAngle);
                    const swirlSin = Math.sin(swirlAngle);
                    const pinch = 1 - Math.min(0.2, vortexAmount * 0.06 * falloff);

                    const rotatedX = (baseX * swirlCos - baseY * swirlSin) * pinch;
                    const rotatedY = (baseX * swirlSin + baseY * swirlCos) * pinch;
                    const driftX = this.positionX * (0.3 + falloff * 0.45);
                    const waveY = Math.sin(this.elapsed * 1.4 + seed * 16) * (0.28 + falloff * 0.45);
                    const depthLift = vortexAmount * 4.8 * falloff;

                    this.positions[offset] = rotatedX + driftX;
                    this.positions[offset + 1] = rotatedY + waveY;
                    this.positions[offset + 2] = baseZ + depthLift + Math.cos(this.elapsed * 0.9 + seed * 9) * 0.55;
                }

                positionsAttr.needsUpdate = true;

                this.points.rotation.y += 0.0009 + this.swipeImpulse * 0.01 + this.vortexVelocity * 0.008;
                this.points.rotation.x = Math.sin(this.elapsed * 0.7) * 0.08;
                this.points.rotation.z = this.rotationZ + this.vortexVelocity * 0.045;
                this.points.position.x = this.positionX;
                this.points.position.y = Math.sin(this.elapsed * 0.45) * 0.55;

                this.renderer.render(this.scene, this.camera);
                this.rafId = requestAnimationFrame(this.animate);
            }
        }

        function initProjectCarousel(carousel) {
            const track = carousel.querySelector('.project-carousel-track');
            const cards = Array.from(carousel.querySelectorAll('.project-carousel-card'));
            const prevButton = carousel.querySelector('.project-carousel-control.prev');
            const nextButton = carousel.querySelector('.project-carousel-control.next');
            const cardLinks = carousel.querySelectorAll('.project-carousel-card__link');

            if (!track || !cards.length) {
                return;
            }

            const section = carousel.closest('.project-carousel-section');
            const currentProject = section?.dataset.currentProject || '';
            const spaceField = section?.querySelector('[data-project-space]')?._projectSpaceField || null;
            const theta = 360 / cards.length;
            let radius = 0;
            let currentRotation = 0;
            let targetRotation = 0;
            let dragStartX = 0;
            let dragDistance = 0;
            let lastDragX = 0;
            let dragStartRotation = 0;
            let activePointerId = null;
            let isDragging = false;
            let activeCarousel = false;
            let touchIdentifier = null;
            let touchStartY = 0;
            let touchLock = null;
            let suppressClickUntil = 0;
            let rafId = null;
            let isAnimating = false;
            let isVisible = true;
            let isDocumentVisible = !document.hidden;

            const startIndex = cards.findIndex((card) => card.dataset.projectSlug === currentProject);
            if (startIndex >= 0) {
                currentRotation = -startIndex * theta;
                targetRotation = currentRotation;
            }

            const normalizeAngle = (angle) => {
                let normalized = angle % 360;
                if (normalized > 180) normalized -= 360;
                if (normalized < -180) normalized += 360;
                return normalized;
            };

            const updateGeometry = () => {
                const cardWidth = cards[0].getBoundingClientRect().width || 220;
                const isMobile = window.innerWidth < 760;
                const baseRadius = Math.round((cardWidth / 2) / Math.tan(Math.PI / cards.length));
                const wideBoost = isMobile ? cardWidth * 1.7 : cardWidth * 3.9;
                radius = Math.max(baseRadius + wideBoost, isMobile ? 360 : 760);

                cards.forEach((card, index) => {
                    const angle = theta * index;
                    card.dataset.angle = String(angle);
                    card.style.transform = 'rotateY(' + angle + 'deg) translateZ(' + radius + 'px)';
                });
            };

            const syncCards = () => {
                let activeCard = null;
                let shortestDistance = Infinity;

                cards.forEach((card) => {
                    const angle = parseFloat(card.dataset.angle) || 0;
                    const distance = Math.abs(normalizeAngle(angle + currentRotation));
                    const focus = Math.max(0, Math.min(1, 1 - distance / 120));
                    card.style.setProperty('--card-focus', focus.toFixed(3));

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        activeCard = card;
                    }
                });

                cards.forEach((card) => {
                    card.classList.toggle('is-active', card === activeCard);
                });
            };

            const animate = () => {
                if (!isAnimating) {
                    return;
                }

                currentRotation += (targetRotation - currentRotation) * 0.085;
                if (Math.abs(targetRotation - currentRotation) < 0.05) {
                    currentRotation = targetRotation;
                }

                track.style.transform = 'rotateY(' + currentRotation + 'deg)';
                syncCards();
                rafId = requestAnimationFrame(animate);
            };

            const updateAnimationState = () => {
                const shouldAnimate = isVisible && isDocumentVisible;
                if (shouldAnimate && !isAnimating) {
                    isAnimating = true;
                    rafId = requestAnimationFrame(animate);
                } else if (!shouldAnimate && isAnimating) {
                    isAnimating = false;
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                }
            };

            const snapToNearest = () => {
                targetRotation = Math.round(targetRotation / theta) * theta;
            };

            const moveBy = (direction) => {
                targetRotation += direction * theta;
                spaceField?.nudge?.(-direction * 0.55);
            };

            const setActiveCarousel = () => {
                activeCarousel = true;
            };

            const clearActiveCarousel = () => {
                activeCarousel = false;
            };

            const startDrag = (clientX, pointerId = null, clientY = 0) => {
                isDragging = true;
                activePointerId = pointerId;
                dragStartX = clientX;
                lastDragX = clientX;
                touchStartY = clientY;
                dragDistance = 0;
                dragStartRotation = targetRotation;
                touchLock = null;
                setActiveCarousel();
                carousel.focus({ preventScroll: true });
            };

            const moveDrag = (clientX) => {
                const deltaX = clientX - dragStartX;
                const deltaStep = clientX - lastDragX;
                lastDragX = clientX;
                dragDistance = Math.max(dragDistance, Math.abs(deltaX));
                targetRotation = dragStartRotation + deltaX * 0.18;
                spaceField?.nudge?.(deltaStep * 0.014);

                if (dragDistance > 6) {
                    suppressClickUntil = performance.now() + 320;
                }
            };

            const finishDrag = () => {
                if (!isDragging) {
                    return;
                }

                isDragging = false;
                activePointerId = null;
                touchIdentifier = null;
                touchLock = null;
                snapToNearest();
            };

            prevButton?.addEventListener('click', () => moveBy(1));
            nextButton?.addEventListener('click', () => moveBy(-1));

            const handleArrowKey = (event) => {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    moveBy(1);
                }

                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    moveBy(-1);
                }
            };

            carousel.addEventListener('keydown', handleArrowKey);
            document.addEventListener('keydown', (event) => {
                if (!activeCarousel) {
                    return;
                }

                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    handleArrowKey(event);
                }
            });

            carousel.addEventListener('mouseenter', setActiveCarousel);
            carousel.addEventListener('focusin', setActiveCarousel);
            carousel.addEventListener('mouseleave', clearActiveCarousel);
            carousel.addEventListener('focusout', (event) => {
                if (!carousel.contains(event.relatedTarget)) {
                    clearActiveCarousel();
                }
            });

            carousel.addEventListener('pointerdown', (event) => {
                if (event.target.closest('.project-carousel-control')) {
                    return;
                }

                startDrag(event.clientX, event.pointerId, event.clientY);
                carousel.setPointerCapture?.(event.pointerId);
            });

            carousel.addEventListener('pointermove', (event) => {
                if (!isDragging || event.pointerId !== activePointerId) {
                    return;
                }

                moveDrag(event.clientX);
            });

            const endDrag = (event) => {
                if (!isDragging || event.pointerId !== activePointerId) {
                    return;
                }

                carousel.releasePointerCapture?.(event.pointerId);
                finishDrag();
            };

            carousel.addEventListener('pointerup', endDrag);
            carousel.addEventListener('pointercancel', endDrag);

            carousel.addEventListener('touchstart', (event) => {
                if (event.touches.length !== 1 || event.target.closest('.project-carousel-control')) {
                    return;
                }

                const touch = event.touches[0];
                touchIdentifier = touch.identifier;
                startDrag(touch.clientX, null, touch.clientY);
            }, { passive: true });

            carousel.addEventListener('touchmove', (event) => {
                if (!isDragging || touchIdentifier === null) {
                    return;
                }

                const touch = Array.from(event.touches).find((item) => item.identifier === touchIdentifier);
                if (!touch) {
                    return;
                }

                const deltaX = touch.clientX - dragStartX;
                const deltaY = touch.clientY - touchStartY;

                if (touchLock === null) {
                    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
                        touchLock = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
                    } else {
                        return;
                    }
                }

                if (touchLock === 'vertical') {
                    finishDrag();
                    return;
                }

                event.preventDefault();
                moveDrag(touch.clientX);
            }, { passive: false });

            carousel.addEventListener('touchend', (event) => {
                if (touchIdentifier === null) {
                    return;
                }

                const ended = Array.from(event.changedTouches).some((item) => item.identifier === touchIdentifier);
                if (ended) {
                    finishDrag();
                }
            });

            carousel.addEventListener('touchcancel', () => {
                finishDrag();
            });

            cardLinks.forEach((link) => {
                link.addEventListener('dragstart', (event) => {
                    event.preventDefault();
                });
                link.addEventListener('click', (event) => {
                    if (performance.now() < suppressClickUntil) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                });
            });

            const visibilityObserver = new IntersectionObserver((entries) => {
                isVisible = entries[0]?.isIntersecting ?? true;
                updateAnimationState();
            }, { threshold: 0.08 });
            visibilityObserver.observe(carousel);

            document.addEventListener('visibilitychange', () => {
                isDocumentVisible = !document.hidden;
                updateAnimationState();
            });

            window.addEventListener('resize', updateGeometry);

            updateGeometry();
            syncCards();
            updateAnimationState();
        }

(function () {
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const root = document.documentElement;
            const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
            const spaceFields = Array.from(document.querySelectorAll('[data-project-space]')).map(function (container) {
                const field = new ProjectSpaceField(container, root.classList.contains('light-theme'));
                container._projectSpaceField = field;
                return field;
            });

            const applyTheme = function (theme) {
                root.classList.remove('light-theme', 'dark-theme');
                root.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
                localStorage.setItem('theme', theme === 'dark' ? 'dark' : 'light');
                spaceFields.forEach(function (field) {
                    field?.applyTheme(theme !== 'dark');
                });
            };

            const storedTheme = localStorage.getItem('theme');
            applyTheme(storedTheme === 'dark' ? 'dark' : 'light');

            themeToggleButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    const isDark = root.classList.contains('dark-theme');
                    applyTheme(isDark ? 'light' : 'dark');
                });
            });

            const mobileButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileButton && mobileMenu) {
                mobileButton.addEventListener('click', function () {
                    const expanded = mobileButton.getAttribute('aria-expanded') === 'true';
                    mobileButton.setAttribute('aria-expanded', String(!expanded));
                    mobileMenu.classList.toggle('hidden');
                });

                mobileMenu.querySelectorAll('a').forEach(function (link) {
                    link.addEventListener('click', function () {
                        mobileButton.setAttribute('aria-expanded', 'false');
                        mobileMenu.classList.add('hidden');
                    });
                });
            }

            const navbarAnchorLinks = Array.from(document.querySelectorAll('header nav a[href^="#"]'));
            const scrollToNavbarAnchor = function (hash) {
                if (!hash || hash === '#') {
                    return;
                }

                const target = document.querySelector(hash);
                if (!target) {
                    return;
                }

                const viewportShift = window.innerHeight * 0.05;
                const targetTop = target.getBoundingClientRect().top + window.scrollY - viewportShift;
                const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
                const clampedTop = Math.max(0, Math.min(targetTop, maxScrollTop));

                window.scrollTo({ top: clampedTop, behavior: 'auto' });
                history.pushState(null, '', hash);
            };

            navbarAnchorLinks.forEach(function (link) {
                link.addEventListener('click', function (event) {
                    const hash = link.getAttribute('href');
                    if (!hash || hash === '#') {
                        return;
                    }

                    event.preventDefault();
                    scrollToNavbarAnchor(hash);
                });
            });

            const navLinks = Array.from(document.querySelectorAll('.nav-link'));
            const sections = navLinks
                .map(function (link) {
                    const id = link.getAttribute('href');
                    return id ? document.querySelector(id) : null;
                })
                .filter(Boolean);

            if (sections.length && navLinks.length) {
                const activateLink = function (id) {
                    const darkMode = root.classList.contains('dark-theme');
                    navLinks.forEach(function (link) {
                        const active = link.getAttribute('href') === '#' + id;
                        link.classList.toggle('text-ink', active && !darkMode);
                        link.classList.toggle('text-subtext', !active && !darkMode);
                        link.classList.toggle('text-white', active && darkMode);
                        link.classList.toggle('text-white/65', !active && darkMode);
                        link.setAttribute('aria-current', active ? 'true' : 'false');
                    });
                };

                const observer = new IntersectionObserver(
                    function (entries) {
                        const visible = entries
                            .filter(function (entry) { return entry.isIntersecting; })
                            .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });

                        if (visible[0]) {
                            activateLink(visible[0].target.id);
                        }
                    },
                    {
                        rootMargin: '-25% 0px -45% 0px',
                        threshold: [0.2, 0.45, 0.7]
                    }
                );

                sections.forEach(function (section) {
                    observer.observe(section);
                });

                const themeObserver = new MutationObserver(function () {
                    const current = navLinks.find(function (link) {
                        return link.getAttribute('aria-current') === 'true';
                    });
                    if (current) {
                        const id = current.getAttribute('href').slice(1);
                        activateLink(id);
                    }
                });

                themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
            }

            const processStack = document.getElementById('process-stack');
            const processCards = processStack ? Array.from(processStack.querySelectorAll('[data-process-card]')) : [];
            const processDesktopQuery = window.matchMedia('(min-width: 1024px)');
            let activeProcessIndex = -1;
            let expandedProcessContentIndex = -1;
            let lastProcessPointerDownAt = 0;
            let processCardsReady = false;

            const clearProcessCardStyles = function (card) {
                [
                    '--process-card-width',
                    '--process-card-height',
                    '--process-card-x',
                    '--process-card-y',
                    '--process-card-scale',
                    '--process-card-rotate',
                    '--process-card-opacity',
                    '--process-card-z',
                    '--process-card-saturation'
                ].forEach(function (property) {
                    card.style.removeProperty(property);
                });
            };

            const applyProcessCardStyles = function (card, metrics) {
                card.style.setProperty('--process-card-width', metrics.width + 'px');
                card.style.setProperty('--process-card-height', metrics.height + 'px');
                card.style.setProperty('--process-card-x', metrics.x + 'px');
                card.style.setProperty('--process-card-y', metrics.y + 'px');
                card.style.setProperty('--process-card-scale', String(metrics.scale));
                card.style.setProperty('--process-card-rotate', metrics.rotate + 'deg');
                card.style.setProperty('--process-card-opacity', String(metrics.opacity));
                card.style.setProperty('--process-card-z', String(metrics.z));
                card.style.setProperty('--process-card-saturation', String(metrics.saturation));
            };

            const setExpandedProcessContentIndex = function (index) {
                expandedProcessContentIndex = index;
                processCards.forEach(function (card, cardIndex) {
                    card.dataset.expandedContent = cardIndex === index ? 'true' : 'false';
                });
            };

            const activateProcessCard = function (index) {
                const nextIndex = activeProcessIndex === index ? -1 : index;
                setExpandedProcessContentIndex(nextIndex);
                activeProcessIndex = nextIndex;
                renderProcessCards();
            };

            const renderProcessCards = function () {
                if (!processStack || !processCards.length) {
                    return;
                }

                const desktop = processDesktopQuery.matches;
                processStack.dataset.activeCard = desktop && activeProcessIndex !== -1
                    ? (processCards[activeProcessIndex].dataset.processOrigin || 'active')
                    : 'none';

                if (!desktop) {
                    processStack.style.removeProperty('height');
                    processStack.dataset.ready = 'true';
                    processCards.forEach(function (card) {
                        clearProcessCardStyles(card);
                        card.dataset.active = 'false';
                        card.dataset.expandedContent = 'false';
                        card.setAttribute('aria-expanded', 'false');
                    });
                    return;
                }

                const containerWidth = processStack.clientWidth;
                if (!containerWidth) {
                    return;
                }

                const gap = 20;
                const collapsedHeight = 548;
                const expandedHeight = 584;
                const stackHeight = 620;
                const columnWidth = (containerWidth - gap * 2) / 3;
                const expandedWidth = Math.min(containerWidth, columnWidth * 2.5);
                const expandedOverflow = expandedWidth - columnWidth;
                const collapsedBaseY = (stackHeight - collapsedHeight) / 2;
                const expandedBaseY = (stackHeight - expandedHeight) / 2;
                const defaultPositions = {
                    left: 0,
                    center: columnWidth + gap,
                    right: (columnWidth + gap) * 2
                };
                processStack.style.height = stackHeight + 'px';

                processCards.forEach(function (card, index) {
                    const isActive = index === activeProcessIndex;
                    const origin = card.dataset.processOrigin || 'left';
                    const metrics = {
                        width: columnWidth,
                        height: collapsedHeight,
                        x: index * (columnWidth + gap),
                        y: collapsedBaseY,
                        scale: 1,
                        rotate: 0,
                        opacity: 1,
                        z: processCards.length - index,
                        saturation: 1
                    };

                    if (activeProcessIndex !== -1) {
                        if (isActive) {
                            metrics.width = expandedWidth;
                            metrics.height = expandedHeight;
                            metrics.x = origin === 'center'
                                ? defaultPositions.center - expandedOverflow / 2
                                : origin === 'right'
                                    ? defaultPositions.right - expandedOverflow
                                    : defaultPositions.left;
                            metrics.y = expandedBaseY;
                            metrics.z = 6;
                        } else {
                            const activeOrigin = processCards[activeProcessIndex].dataset.processOrigin || 'center';
                            const centerOverlap = Math.min(112, columnWidth * 0.32);
                            metrics.x = defaultPositions[origin];
                            metrics.y = collapsedBaseY;
                            metrics.scale = 0.965;
                            metrics.rotate = 0;
                            metrics.opacity = 0.68;
                            metrics.z = 3;
                            metrics.saturation = 0.88;

                            if (activeOrigin === 'left') {
                                if (origin === 'center') {
                                    metrics.x = defaultPositions.right - centerOverlap;
                                    metrics.scale = 0.985;
                                    metrics.opacity = 0.82;
                                    metrics.z = 4;
                                    metrics.saturation = 0.94;
                                } else if (origin === 'right') {
                                    metrics.scale = 0.94;
                                    metrics.opacity = 0.62;
                                    metrics.z = 3;
                                    metrics.saturation = 0.84;
                                }
                            } else if (activeOrigin === 'right') {
                                if (origin === 'center') {
                                    metrics.x = defaultPositions.left + centerOverlap;
                                    metrics.scale = 0.985;
                                    metrics.opacity = 0.82;
                                    metrics.z = 4;
                                    metrics.saturation = 0.94;
                                } else if (origin === 'left') {
                                    metrics.scale = 0.94;
                                    metrics.opacity = 0.62;
                                    metrics.z = 3;
                                    metrics.saturation = 0.84;
                                }
                            } else {
                                const depth = Math.abs(index - activeProcessIndex);
                                metrics.scale = depth === 1 ? 0.985 : 0.965;
                                metrics.opacity = depth === 1 ? 0.82 : 0.68;
                                metrics.z = depth === 1 ? 4 : 3;
                                metrics.saturation = depth === 1 ? 0.94 : 0.88;
                            }

                            metrics.y = collapsedBaseY + (collapsedHeight * (1 - metrics.scale)) / 2;
                        }
                    }

                    card.dataset.active = isActive ? 'true' : 'false';
                    card.setAttribute('aria-expanded', isActive ? 'true' : 'false');
                    applyProcessCardStyles(card, metrics);
                });
            };

            const finalizeProcessCardReadyState = function () {
                if (processCardsReady || !processStack) {
                    return;
                }

                requestAnimationFrame(function () {
                    processStack.dataset.ready = 'true';
                    processCardsReady = true;
                });
            };

            if (processCards.length) {
                setExpandedProcessContentIndex(-1);

                processCards.forEach(function (card, index) {
                    card.addEventListener('pointerdown', function (event) {
                        if (!processDesktopQuery.matches || event.button !== 0) {
                            return;
                        }

                        lastProcessPointerDownAt = performance.now();
                        activateProcessCard(index);
                    });

                    card.addEventListener('click', function () {
                        if (!processDesktopQuery.matches) {
                            return;
                        }

                        if (performance.now() - lastProcessPointerDownAt < 400) {
                            return;
                        }

                        activateProcessCard(index);
                    });

                    card.addEventListener('keydown', function (event) {
                        if (!processDesktopQuery.matches) {
                            return;
                        }

                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            activateProcessCard(index);
                        }
                    });
                });

                document.addEventListener('keydown', function (event) {
                    if (event.key === 'Escape' && activeProcessIndex !== -1) {
                        setExpandedProcessContentIndex(-1);
                        activeProcessIndex = -1;
                        renderProcessCards();
                    }
                });

                processDesktopQuery.addEventListener('change', function () {
                    setExpandedProcessContentIndex(-1);
                    processCardsReady = false;
                    processStack.dataset.ready = 'false';
                    renderProcessCards();
                    finalizeProcessCardReadyState();
                });
                window.addEventListener('resize', renderProcessCards);
                renderProcessCards();
                finalizeProcessCardReadyState();
            }

            document.querySelectorAll('[data-project-carousel]').forEach(function (carousel) {
                initProjectCarousel(carousel);
            });

        }());
