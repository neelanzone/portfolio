document.addEventListener('DOMContentLoaded', function () {
    var syncTabs = function (buttonSelector, panelSelector, activeId) {
        var buttons = Array.prototype.slice.call(document.querySelectorAll(buttonSelector));
        var panels = Array.prototype.slice.call(document.querySelectorAll(panelSelector));

        buttons.forEach(function (button) {
            var isActive = button.dataset.ludoHeroTab === activeId || button.dataset.ludoCardTab === activeId;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        panels.forEach(function (panel) {
            var panelId = panel.dataset.ludoHeroPanel || panel.dataset.ludoCardPanel;
            var isActive = panelId === activeId;
            panel.classList.toggle('is-active', isActive);
            panel.hidden = !isActive;
        });
    };

    var getQuoteSources = function (stack) {
        return Array.prototype.slice.call(stack.querySelectorAll('[data-ludo-quote-source]')).map(function (source) {
            return {
                text: source.dataset.ludoQuoteSourceText || '',
                meta: source.dataset.ludoQuoteSourceMeta || ''
            };
        });
    };

    var renderQuote = function (stack, index) {
        var quoteText = stack.querySelector('[data-ludo-quote-current-text]');
        var quoteMeta = stack.querySelector('[data-ludo-quote-current-meta]');
        var quoteCount = stack.querySelector('[data-ludo-quote-current-count]');
        var quotes = getQuoteSources(stack);
        var current = quotes[index];

        if (!current || !quoteText || !quoteMeta || !quoteCount) {
            return;
        }

        quoteText.textContent = current.text;
        quoteMeta.textContent = current.meta;
        quoteCount.textContent = String(index + 1) + '/' + String(quotes.length);
        stack.setAttribute('data-active-quote', String(index));
    };

    var advanceQuote = function (stack) {
        var quotes = getQuoteSources(stack);
        if (quotes.length < 2) {
            return;
        }

        var activeIndex = Number(stack.getAttribute('data-active-quote') || '0');
        var nextIndex = (activeIndex + 1) % quotes.length;
        renderQuote(stack, nextIndex);
    };

    var infoStack = document.querySelector('[data-ludo-info-stack]');
    var heroCard = document.querySelector('.ludo-bento__hero-card');
    var infoCards = infoStack ? Array.prototype.slice.call(infoStack.querySelectorAll('[data-ludo-info-card]')) : [];
    var infoDesktopQuery = window.matchMedia('(min-width: 981px)');
    var activeInfoIndex = -1;
    var lastInfoMouseDownAt = 0;
    var infoCardsReady = false;

    var clearInfoCardStyles = function (card) {
        [
            '--ludo-info-card-width',
            '--ludo-info-card-height',
            '--ludo-info-card-main-width',
            '--ludo-info-card-x',
            '--ludo-info-card-y',
            '--ludo-info-card-scale',
            '--ludo-info-card-rotate',
            '--ludo-info-card-opacity',
            '--ludo-info-card-z',
            '--ludo-info-card-saturation'
        ].forEach(function (property) {
            card.style.removeProperty(property);
        });
    };

    var applyInfoCardStyles = function (card, metrics) {
        card.style.setProperty('--ludo-info-card-width', metrics.width + 'px');
        card.style.setProperty('--ludo-info-card-height', metrics.height + 'px');
        card.style.setProperty('--ludo-info-card-main-width', metrics.mainWidth + 'px');
        card.style.setProperty('--ludo-info-card-x', metrics.x + 'px');
        card.style.setProperty('--ludo-info-card-y', metrics.y + 'px');
        card.style.setProperty('--ludo-info-card-scale', String(metrics.scale));
        card.style.setProperty('--ludo-info-card-rotate', metrics.rotate + 'deg');
        card.style.setProperty('--ludo-info-card-opacity', String(metrics.opacity));
        card.style.setProperty('--ludo-info-card-z', String(metrics.z));
        card.style.setProperty('--ludo-info-card-saturation', String(metrics.saturation));
    };

    var setExpandedInfoContentIndex = function (index) {
        infoCards.forEach(function (card, cardIndex) {
            card.dataset.expandedContent = cardIndex === index ? 'true' : 'false';
        });
    };

    var activateInfoCard = function (index) {
        var nextIndex = activeInfoIndex === index ? -1 : index;
        setExpandedInfoContentIndex(nextIndex);
        activeInfoIndex = nextIndex;
        renderInfoCards();
    };

    var renderInfoCards = function () {
        if (!infoStack || !infoCards.length) {
            return;
        }

        infoStack.dataset.ludoInfoEnhanced = 'true';
        infoStack.dataset.activeCard = infoDesktopQuery.matches && activeInfoIndex !== -1
            ? (infoCards[activeInfoIndex].dataset.ludoInfoOrigin || 'active')
            : 'none';

        if (!infoDesktopQuery.matches) {
            infoStack.style.removeProperty('height');
            infoCards.forEach(function (card) {
                clearInfoCardStyles(card);
                card.dataset.active = 'false';
                card.dataset.expandedContent = 'false';
                card.setAttribute('aria-expanded', 'false');
            });
            return;
        }

        var containerWidth = infoStack.clientWidth;
        if (!containerWidth) {
            return;
        }

        var gap = 8;
        var heroHeight = heroCard ? Math.ceil(heroCard.getBoundingClientRect().height) : 0;
        var collapsedHeight = Math.max(heroHeight, 351);
        var stackHeight = collapsedHeight;
        var columnWidth = (containerWidth - gap * 2) / 3;
        var columnContentWidth = Math.max(columnWidth - 46, 180);
        var expandedWidth = Math.min(containerWidth, columnWidth * 2.48);
        var expandedOverflow = expandedWidth - columnWidth;
        var defaultPositions = {
            left: 0,
            center: columnWidth + gap,
            right: (columnWidth + gap) * 2
        };

        infoStack.style.height = stackHeight + 'px';

        infoCards.forEach(function (card, index) {
            var isActive = index === activeInfoIndex;
            var origin = card.dataset.ludoInfoOrigin || 'left';
            var metrics = {
                width: columnWidth,
                height: collapsedHeight,
                mainWidth: columnContentWidth,
                x: index * (columnWidth + gap),
                y: 0,
                scale: 1,
                rotate: 0,
                opacity: 1,
                z: infoCards.length - index,
                saturation: 1
            };

            if (activeInfoIndex !== -1) {
                if (isActive) {
                    metrics.width = expandedWidth;
                    metrics.height = collapsedHeight;
                    metrics.x = origin === 'center'
                        ? defaultPositions.center - expandedOverflow / 2
                        : origin === 'right'
                            ? defaultPositions.right - expandedOverflow
                            : defaultPositions.left;
                    metrics.y = 0;
                    metrics.z = 6;
                    metrics.opacity = 1;
                    metrics.saturation = 1.02;
                } else {
                    var activeOrigin = infoCards[activeInfoIndex].dataset.ludoInfoOrigin || 'center';
                    var centerOverlap = Math.min(84, columnWidth * 0.28);
                    metrics.height = collapsedHeight;
                    metrics.y = 0;
                    metrics.opacity = 0.72;
                    metrics.z = 3;
                    metrics.saturation = 0.9;

                    if (activeOrigin === 'left') {
                        if (origin === 'center') {
                            metrics.x = defaultPositions.right - centerOverlap;
                            metrics.opacity = 0.84;
                            metrics.z = 4;
                            metrics.saturation = 0.95;
                        } else if (origin === 'right') {
                            metrics.x = defaultPositions.right;
                            metrics.opacity = 0.62;
                            metrics.saturation = 0.86;
                        }
                    } else if (activeOrigin === 'right') {
                        if (origin === 'center') {
                            metrics.x = defaultPositions.left + centerOverlap;
                            metrics.opacity = 0.84;
                            metrics.z = 4;
                            metrics.saturation = 0.95;
                        } else if (origin === 'left') {
                            metrics.opacity = 0.62;
                            metrics.saturation = 0.86;
                        }
                    } else {
                        var depth = Math.abs(index - activeInfoIndex);
                        metrics.opacity = depth === 1 ? 0.84 : 0.7;
                        metrics.z = depth === 1 ? 4 : 3;
                        metrics.saturation = depth === 1 ? 0.95 : 0.9;
                    }
                }
            }

            card.dataset.active = isActive ? 'true' : 'false';
            card.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            applyInfoCardStyles(card, metrics);
        });
    };

    var finalizeInfoCardReadyState = function () {
        if (infoCardsReady || !infoStack || !infoDesktopQuery.matches) {
            return;
        }

        requestAnimationFrame(function () {
            infoStack.dataset.ready = 'true';
            infoCardsReady = true;
        });
    };

    var createCardViewer = function (container) {
        if (!container || !window.THREE) {
            return null;
        }

        var scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x09090a, 6, 16);

        var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
        camera.position.set(0, 0.12, 6.5);

        var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        var domCard = document.createElement('div');
        domCard.className = 'ludo-bento__viewer-card';
        domCard.hidden = true;
        domCard.innerHTML = '' +
            '<div class="ludo-bento__viewer-card-body" data-ludo-viewer-card-body>' +
                '<span class="ludo-bento__viewer-card-shadow" aria-hidden="true"></span>' +
                '<img class="ludo-bento__viewer-card-face ludo-bento__viewer-card-face--front" data-ludo-viewer-front alt="">' +
                '<img class="ludo-bento__viewer-card-face ludo-bento__viewer-card-face--back" data-ludo-viewer-back alt="">' +
            '</div>';
        container.appendChild(domCard);

        var domCardBody = domCard.querySelector('[data-ludo-viewer-card-body]');
        var domFront = domCard.querySelector('[data-ludo-viewer-front]');
        var domBack = domCard.querySelector('[data-ludo-viewer-back]');

        var ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        var keyLight = new THREE.DirectionalLight(0xffe6c7, 1.3);
        keyLight.position.set(3.5, 4.2, 6.5);
        scene.add(keyLight);

        var rimLight = new THREE.DirectionalLight(0x7ca7ff, 0.55);
        rimLight.position.set(-4.2, 2.4, -2.8);
        scene.add(rimLight);

        var backPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ color: 0x111217, transparent: true, opacity: 0.34 })
        );
        backPlane.position.z = -5.2;
        var backPlaneDistance = camera.position.z - backPlane.position.z;
        scene.add(backPlane);

        var starCount = 1000;
        var starPositions = new Float32Array(starCount * 3);
        for (var i = 0; i < starCount; i += 1) {
            var offset = i * 3;
            starPositions[offset] = (Math.random() - 0.5) * 16;
            starPositions[offset + 1] = (Math.random() - 0.5) * 10;
            starPositions[offset + 2] = -2 - Math.random() * 7;
        }

        var starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        var starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.045,
            transparent: true,
            opacity: 0.22,
            depthWrite: false
        });
        var stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        var active = false;
        var rafId = 0;
        var elapsed = 0;
        var pointerTargetX = 0;
        var pointerTargetY = 0;
        var pointerX = 0;
        var pointerY = 0;
        var activeVariant = 'flat';
        var targetRotationY = 0;
        var domRotationY = targetRotationY;
        var dragPointerId = null;
        var dragStartX = 0;
        var dragStartRotationY = 0;
        var dragDistance = 0;
        var isDragging = false;
        var variantChangeHandler = function () {};

        var handleResize = function () {
            var width = Math.max(1, container.clientWidth);
            var height = Math.max(1, container.clientHeight);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);

            var frustumHeight = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * backPlaneDistance;
            var frustumWidth = frustumHeight * camera.aspect;
            backPlane.scale.set(frustumWidth * 1.06, frustumHeight * 1.06, 1);
        };

        var normalizeRotation = function (value) {
            var tau = Math.PI * 2;
            var normalized = value % tau;
            if (normalized < 0) {
                normalized += tau;
            }
            return normalized;
        };

        var getVariantForRotation = function (value) {
            var normalized = normalizeRotation(value);
            return normalized >= (Math.PI / 2) && normalized < ((Math.PI * 3) / 2)
                ? 'stylised'
                : 'flat';
        };

        var updateDomCardTransform = function () {
            if (!domCardBody) {
                return;
            }

            var rotateX = ((-0.03 + pointerY) * 57.2958);
            var rotateY = (domRotationY + pointerX) * 57.2958;
            domCardBody.style.transform = 'rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
        };

        var setVariant = function (variant, immediate) {
            activeVariant = variant === 'stylised' ? 'stylised' : 'flat';
            targetRotationY = activeVariant === 'stylised' ? Math.PI : 0;

            if (immediate) {
                domRotationY = targetRotationY;
            }

            updateDomCardTransform();
        };

        var emitVariantChange = function (variant) {
            variantChangeHandler(variant === 'stylised' ? 'stylised' : 'flat');
        };

        var finishDrag = function (toggleOnClick) {
            if (!isDragging) {
                return;
            }

            isDragging = false;
            domCard.classList.remove('is-dragging');

            if (dragPointerId !== null) {
                try {
                    domCard.releasePointerCapture(dragPointerId);
                } catch (error) {
                    // Pointer capture may already be released.
                }
            }

            dragPointerId = null;
            var nextVariant = dragDistance < 8 && toggleOnClick
                ? (activeVariant === 'flat' ? 'stylised' : 'flat')
                : getVariantForRotation(targetRotationY);

            setVariant(nextVariant, false);
            emitVariantChange(nextVariant);
        };

        var animate = function () {
            if (!active) {
                return;
            }

            elapsed += 0.01;
            pointerX += (pointerTargetX - pointerX) * 0.1;
            pointerY += (pointerTargetY - pointerY) * 0.1;

            if (!isDragging) {
                domRotationY += (targetRotationY - domRotationY) * 0.12;
            }

            stars.rotation.z += 0.0007;
            stars.position.x = Math.sin(elapsed * 0.32) * 0.08;
            stars.position.y = Math.cos(elapsed * 0.28) * 0.04;
            updateDomCardTransform();
            renderer.render(scene, camera);
            rafId = requestAnimationFrame(animate);
        };

        container.addEventListener('pointermove', function (event) {
            if (isDragging) {
                return;
            }

            var rect = container.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return;
            }

            var normalizedX = ((event.clientX - rect.left) / rect.width) - 0.5;
            var normalizedY = ((event.clientY - rect.top) / rect.height) - 0.5;
            pointerTargetX = normalizedX * 0.22;
            pointerTargetY = normalizedY * 0.16;
        });

        container.addEventListener('pointerleave', function () {
            if (isDragging) {
                return;
            }
            pointerTargetX = 0;
            pointerTargetY = 0;
        });

        domCard.addEventListener('pointerdown', function (event) {
            if (event.button !== 0 && event.pointerType !== 'touch') {
                return;
            }

            event.preventDefault();
            isDragging = true;
            dragPointerId = event.pointerId;
            dragStartX = event.clientX;
            dragStartRotationY = domRotationY;
            dragDistance = 0;
            pointerTargetX = 0;
            pointerTargetY = 0;
            domCard.classList.add('is-dragging');
            domCard.setPointerCapture(event.pointerId);
        });

        domCard.addEventListener('pointermove', function (event) {
            if (!isDragging || event.pointerId !== dragPointerId) {
                return;
            }

            var rect = domCard.getBoundingClientRect();
            var deltaX = event.clientX - dragStartX;
            var dragRatio = rect.width ? deltaX / rect.width : 0;
            dragDistance = Math.max(dragDistance, Math.abs(deltaX));
            targetRotationY = dragStartRotationY + (dragRatio * Math.PI * 1.25);
            domRotationY = targetRotationY;
            updateDomCardTransform();
        });

        domCard.addEventListener('pointerup', function (event) {
            if (event.pointerId !== dragPointerId) {
                return;
            }
            finishDrag(true);
        });

        domCard.addEventListener('pointercancel', function (event) {
            if (event.pointerId !== dragPointerId) {
                return;
            }
            finishDrag(false);
        });

        window.addEventListener('resize', handleResize);

        return {
            setCard: function (flatSource, stylisedSource, variant) {
                var flatFace = flatSource || '';
                var stylisedFace = stylisedSource || flatFace;

                domFront.src = flatFace;
                domBack.src = stylisedFace;
                domFront.style.opacity = flatFace ? '1' : '0';
                domBack.style.opacity = stylisedFace ? '1' : '0';
                setVariant(variant || 'flat', true);
            },
            focusVariant: function (variant) {
                setVariant(variant, false);
            },
            setOnVariantChange: function (handler) {
                variantChangeHandler = typeof handler === 'function' ? handler : function () {};
            },
            setActive: function (nextActive) {
                if (active === nextActive) {
                    return;
                }

                active = nextActive;
                domCard.hidden = !active;
                isDragging = false;
                domCard.classList.remove('is-dragging');
                pointerTargetX = 0;
                pointerTargetY = 0;
                pointerX = 0;
                pointerY = 0;

                if (active) {
                    handleResize();
                    updateDomCardTransform();
                    if (!rafId) {
                        rafId = requestAnimationFrame(animate);
                    }
                } else if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = 0;
                }
            },
            resize: handleResize
        };
    };

    var initCharacterLightbox = function () {
        var lightbox = document.querySelector('[data-ludo-lightbox]');
        var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-ludo-card-trigger]'));

        if (!lightbox || !triggers.length) {
            return;
        }

        var prevButton = lightbox.querySelector('[data-ludo-lightbox-prev]');
        var nextButton = lightbox.querySelector('[data-ludo-lightbox-next]');
        var closeButton = lightbox.querySelector('[data-ludo-lightbox-close]');
        var roleNode = lightbox.querySelector('[data-ludo-lightbox-role]');
        var countNode = lightbox.querySelector('[data-ludo-lightbox-count]');
        var copyTitleNode = lightbox.querySelector('[data-ludo-lightbox-copy-title]');
        var copyBodyNode = lightbox.querySelector('[data-ludo-lightbox-copy-body]');
        var detailNameTitleNode = lightbox.querySelector('[data-ludo-lightbox-detail-name-title]');
        var detailNameBodyNode = lightbox.querySelector('[data-ludo-lightbox-detail-name-body]');
        var detailClassTitleNode = lightbox.querySelector('[data-ludo-lightbox-detail-class-title]');
        var detailClassBodyNode = lightbox.querySelector('[data-ludo-lightbox-detail-class-body]');
        var detailNameRowNode = detailNameTitleNode ? detailNameTitleNode.closest('.ludo-bento__lightbox-side-row') : null;
        var detailClassRowNode = detailClassTitleNode ? detailClassTitleNode.closest('.ludo-bento__lightbox-side-row') : null;
        var versionButtons = Array.prototype.slice.call(lightbox.querySelectorAll('[data-ludo-lightbox-version]'));
        var variantPanels = {
            flat: {
                title: 'Flat',
                lines: [
                    'The flat illustrative style was inspired by Jamini Roy paintings, with expressive eyes, and an ambiance to match.',
                    'For the first iteration of the characters, the illustrations are co-created from initial sketches processed through Midjourney, ChatGPT and Nano-Banana.'
                ]
            },
            stylised: {
                title: 'Stylised',
                lines: [
                    'The stylised illustrative theme was inspired by Amar Chitra Katha and anime traditions of slender features, detailed backgrounds, and vibrant color.',
                    'These were generated from character descriptions, finalised through multiple iterations and some manual photobashing of backgrounds.'
                ]
            }
        };
        var viewerContainer = lightbox.querySelector('[data-ludo-lightbox-canvas]');
        var viewer = createCardViewer(viewerContainer);
        var activeGroupCards = [];
        var activeIndex = -1;
        var activeVariant = 'flat';
        var preferredVariant = 'flat';
        var activeCardId = '';
        var overlayRevealTimers = [];
        var rightRevealNodes = [detailNameRowNode, detailClassRowNode].filter(Boolean);
        var overlayRevealStep = 200;

        var getLeftRevealNodes = function () {
            var lineNodes = copyBodyNode
                ? Array.prototype.slice.call(copyBodyNode.querySelectorAll('[data-ludo-lightbox-copy-line]'))
                : [];
            return [copyTitleNode].concat(lineNodes).filter(Boolean);
        };

        var getOverlayRevealNodes = function () {
            return getLeftRevealNodes().concat(rightRevealNodes);
        };

        var clearOverlayRevealTimers = function () {
            overlayRevealTimers.forEach(function (timerId) {
                window.clearTimeout(timerId);
            });
            overlayRevealTimers = [];
        };

        var revealOverlayNodes = function (nodes, animate, startIndex) {
            if (!nodes.length) {
                return;
            }

            nodes.forEach(function (node) {
                node.classList.remove('is-reveal-visible');
                node.classList.add('is-reveal-hidden');
            });

            if (!animate) {
                nodes.forEach(function (node) {
                    node.classList.remove('is-reveal-hidden');
                    node.classList.add('is-reveal-visible');
                });
                return;
            }

            nodes.forEach(function (node, index) {
                var delay = ((typeof startIndex === 'number' ? startIndex : 0) + index) * overlayRevealStep;
                var timerId = window.setTimeout(function () {
                    node.classList.remove('is-reveal-hidden');
                    node.classList.add('is-reveal-visible');
                }, delay);
                overlayRevealTimers.push(timerId);
            });
        };

        var playOverlayReveal = function (animate) {
            var nodes = getOverlayRevealNodes();
            clearOverlayRevealTimers();
            revealOverlayNodes(nodes, animate, 0);
        };

        var playLeftOverlayReveal = function (animate) {
            var nodes = getLeftRevealNodes();
            clearOverlayRevealTimers();
            revealOverlayNodes(nodes, animate, 0);
        };

        var resetOverlayReveal = function () {
            clearOverlayRevealTimers();
            getOverlayRevealNodes().forEach(function (node) {
                node.classList.remove('is-reveal-hidden');
                node.classList.remove('is-reveal-visible');
            });
        };


        var renderVariantPanel = function () {
            var panel = variantPanels[activeVariant] || variantPanels.flat;
            if (copyTitleNode) {
                copyTitleNode.textContent = panel.title;
            }
            if (copyBodyNode) {
                copyBodyNode.innerHTML = (panel.lines || []).map(function (line) {
                    return '<span class="ludo-bento__lightbox-copy-line" data-ludo-lightbox-copy-line>' + line + '</span>';
                }).join('');
            }
        };

        var renderDetailPanels = function (card) {
            if (detailNameTitleNode) {
                detailNameTitleNode.textContent = card.name || 'Character name';
            }
            if (detailNameBodyNode) {
                detailNameBodyNode.textContent = 'Placeholder copy for this character will go here.';
            }
            if (detailClassTitleNode) {
                detailClassTitleNode.textContent = card.role || 'Character class';
            }
            if (detailClassBodyNode) {
                detailClassBodyNode.textContent = 'Placeholder copy for this class will go here.';
            }
        };

        var readCard = function (trigger) {
            return {
                id: trigger.dataset.ludoCardId || '',
                title: trigger.dataset.ludoCardTitle || '',
                name: trigger.dataset.ludoCardName || '',
                role: trigger.dataset.ludoCardRole || '',
                body: trigger.dataset.ludoCardBody || '',
                flat: trigger.dataset.ludoCardFlat || '',
                stylised: trigger.dataset.ludoCardStylised || ''
            };
        };

        var syncVersionButtons = function () {
            versionButtons.forEach(function (button) {
                var isActive = button.dataset.ludoLightboxVersion === activeVariant;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        };

        var renderActiveCard = function () {
            if (activeIndex < 0 || !activeGroupCards.length) {
                return;
            }

            var card = readCard(activeGroupCards[activeIndex]);
            roleNode.textContent = card.role || 'Character';
            countNode.textContent = String(activeIndex + 1) + ' / ' + String(activeGroupCards.length);
            renderDetailPanels(card);
            renderVariantPanel();
            playOverlayReveal(true);
            syncVersionButtons();

            if (viewer) {
                if (activeCardId !== card.id) {
                    viewer.setCard(card.flat, card.stylised, activeVariant);
                    activeCardId = card.id;
                } else {
                    viewer.focusVariant(activeVariant);
                }
            }

            if (prevButton) {
                prevButton.disabled = activeGroupCards.length < 2;
            }
            if (nextButton) {
                nextButton.disabled = activeGroupCards.length < 2;
            }
        };

        var openLightbox = function (trigger) {
            activeGroupCards = triggers.filter(function (candidate) {
                return candidate.dataset.ludoCardGroup === trigger.dataset.ludoCardGroup;
            });
            activeIndex = activeGroupCards.indexOf(trigger);
            activeVariant = preferredVariant;
            activeCardId = '';
            lightbox.hidden = false;
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('has-ludo-lightbox');
            renderActiveCard();
            if (viewer) {
                viewer.setActive(true);
                viewer.resize();
            }
        };

        var closeLightbox = function () {
            lightbox.hidden = true;
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('has-ludo-lightbox');
            activeIndex = -1;
            activeCardId = '';
            resetOverlayReveal();
            if (viewer) {
                viewer.setActive(false);
            }
        };

        var moveLightbox = function (direction) {
            if (activeIndex === -1 || activeGroupCards.length < 2) {
                return;
            }

            activeIndex = (activeIndex + direction + activeGroupCards.length) % activeGroupCards.length;
            activeCardId = '';
            renderActiveCard();
        };

        if (viewer) {
            viewer.setOnVariantChange(function (nextVariant) {
                activeVariant = nextVariant === 'stylised' ? 'stylised' : 'flat';
                preferredVariant = activeVariant;
                renderVariantPanel();
                playLeftOverlayReveal(true);
                syncVersionButtons();
            });
        }

        triggers.forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                openLightbox(trigger);
            });
        });

        versionButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                if (activeIndex === -1) {
                    return;
                }
                activeVariant = button.dataset.ludoLightboxVersion === 'stylised' ? 'stylised' : 'flat';
                preferredVariant = activeVariant;
                renderVariantPanel();
                playLeftOverlayReveal(true);
                syncVersionButtons();
                if (viewer) {
                    viewer.focusVariant(activeVariant);
                }
            });
        });

        if (prevButton) {
            prevButton.addEventListener('click', function () {
                moveLightbox(-1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                moveLightbox(1);
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', function () {
                closeLightbox();
            });
        }

        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (lightbox.hidden) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                closeLightbox();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveLightbox(-1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveLightbox(1);
            }
        });

        window.addEventListener('resize', function () {
            if (!lightbox.hidden && viewer) {
                viewer.resize();
            }
        });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                if (!lightbox.hidden && viewer) {
                    viewer.resize();
                }
            });
        }
    };
    var initArtifactRailWave = function () {
        Array.prototype.slice.call(document.querySelectorAll('.ludo-bento__card-strip')).forEach(function (strip) {
            if (strip.classList.contains('is-empty')) {
                return;
            }

            var cards = Array.prototype.slice.call(strip.querySelectorAll('.ludo-bento__card-frame'));
            if (!cards.length) {
                return;
            }

            var pointerInside = false;
            var lastPointerX = 0;
            var lastPointerTime = 0;
            var lastPointerDirection = 0;
            var lastScrollLeft = strip.scrollLeft;
            var lastScrollTime = performance.now();
            var scrollClearTimer = 0;
            var scrollWaveActive = false;

            var applyWaveState = function (activeIndex, previewIndex) {
                cards.forEach(function (card, index) {
                    var isActive = index === activeIndex;
                    var isPreview = !isActive && index === previewIndex;
                    card.classList.toggle('is-wave-active', isActive);
                    card.classList.toggle('is-wave-preview', isPreview);
                });
            };

            var clearWaveState = function () {
                applyWaveState(-1, -1);
            };

            var setScrollWaveActive = function (nextState) {
                scrollWaveActive = nextState;
                strip.classList.toggle('is-scroll-waving', nextState);
            };

            var getNearestCardIndex = function (clientX) {
                var closestIndex = -1;
                var closestDistance = Infinity;

                cards.forEach(function (card, index) {
                    var rect = card.getBoundingClientRect();
                    var centerX = rect.left + (rect.width / 2);
                    var distance = Math.abs(centerX - clientX);

                    if (clientX >= rect.left && clientX <= rect.right) {
                        closestIndex = index;
                        closestDistance = -1;
                        return;
                    }

                    if (closestDistance !== -1 && distance < closestDistance) {
                        closestIndex = index;
                        closestDistance = distance;
                    }
                });

                return closestIndex;
            };

            var updateWaveFromPointer = function (clientX, timeStamp) {
                if (scrollWaveActive) {
                    return;
                }
                var activeIndex = getNearestCardIndex(clientX);
                if (activeIndex === -1) {
                    clearWaveState();
                    return;
                }

                var rect = cards[activeIndex].getBoundingClientRect();
                var progress = rect.width ? (clientX - rect.left) / rect.width : 0.5;
                var now = typeof timeStamp === 'number' ? timeStamp : performance.now();
                var deltaX = lastPointerTime ? clientX - lastPointerX : 0;
                var deltaTime = lastPointerTime ? Math.max(now - lastPointerTime, 16) : 16;
                var velocity = Math.abs(deltaX / deltaTime);
                var direction = deltaX === 0 ? lastPointerDirection : (deltaX > 0 ? 1 : -1);
                var crossover = velocity >= 1.15 ? 0.5 : 0.8;
                var previewIndex = -1;

                progress = Math.max(0, Math.min(1, progress));

                if (direction > 0 && progress >= crossover) {
                    previewIndex = Math.min(cards.length - 1, activeIndex + 1);
                } else if (direction < 0 && progress <= (1 - crossover)) {
                    previewIndex = Math.max(0, activeIndex - 1);
                }

                if (previewIndex === activeIndex) {
                    previewIndex = -1;
                }

                applyWaveState(activeIndex, previewIndex);
                lastPointerX = clientX;
                lastPointerTime = now;
                lastPointerDirection = direction;
            };

            var getMidpointCardIndex = function () {
                var stripRect = strip.getBoundingClientRect();
                var midpoint = stripRect.left + (strip.clientWidth / 2);
                return getNearestCardIndex(midpoint);
            };

            var updateWaveFromScroll = function () {
                var now = performance.now();
                var delta = strip.scrollLeft - lastScrollLeft;
                var deltaTime = Math.max(now - lastScrollTime, 16);
                var speed = Math.abs(delta / deltaTime);
                var direction = delta === 0 ? 0 : (delta > 0 ? 1 : -1);
                var activeIndex = getMidpointCardIndex();
                var previewIndex = -1;

                lastScrollLeft = strip.scrollLeft;
                lastScrollTime = now;

                window.clearTimeout(scrollClearTimer);

                if (speed >= 0.45 && direction !== 0 && activeIndex !== -1) {
                    setScrollWaveActive(true);
                    previewIndex = activeIndex + direction;
                    if (previewIndex < 0 || previewIndex >= cards.length) {
                        previewIndex = -1;
                    }

                    applyWaveState(activeIndex, previewIndex);
                }

                scrollClearTimer = window.setTimeout(function () {
                    setScrollWaveActive(false);
                    clearWaveState();
                }, 140);
            };

            strip.addEventListener('pointerenter', function (event) {
                pointerInside = true;
                if (scrollWaveActive) {
                    return;
                }
                updateWaveFromPointer(event.clientX, performance.now());
            });

            strip.addEventListener('pointermove', function (event) {
                pointerInside = true;
                if (scrollWaveActive) {
                    return;
                }
                updateWaveFromPointer(event.clientX, performance.now());
            });

            strip.addEventListener('pointerleave', function () {
                pointerInside = false;
                lastPointerTime = 0;
                lastPointerDirection = 0;
                if (!scrollWaveActive) {
                    clearWaveState();
                }
            });
            strip.addEventListener('scroll', updateWaveFromScroll, { passive: true });

            strip.addEventListener('focusin', function (event) {
                var focusedCard = event.target.closest('.ludo-bento__card-frame');
                if (!focusedCard) {
                    return;
                }

                applyWaveState(cards.indexOf(focusedCard), -1);
            });

            strip.addEventListener('focusout', function () {
                window.setTimeout(function () {
                    if (!strip.contains(document.activeElement) && !pointerInside && !scrollWaveActive) {
                        clearWaveState();
                    }
                }, 0);
            });
        });
    };
    var bindPointerGlow = function (hostSelector, targetSelector) {
        Array.prototype.slice.call(document.querySelectorAll(hostSelector)).forEach(function (host) {
            var target = targetSelector ? host.querySelector(targetSelector) : host;
            if (!target) {
                return;
            }

            var setGlowPosition = function (clientX, clientY) {
                var rect = target.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    return;
                }

                var x = ((clientX - rect.left) / rect.width) * 100;
                var y = ((clientY - rect.top) / rect.height) * 100;
                var clampedX = Math.max(0, Math.min(100, x));
                var clampedY = Math.max(0, Math.min(100, y));
                target.style.setProperty('--ludo-button-glow-x', clampedX.toFixed(2) + '%');
                target.style.setProperty('--ludo-button-glow-y', clampedY.toFixed(2) + '%');
            };

            host.addEventListener('pointerenter', function (event) {
                setGlowPosition(event.clientX, event.clientY);
            });

            host.addEventListener('pointermove', function (event) {
                setGlowPosition(event.clientX, event.clientY);
            });

            host.addEventListener('pointerleave', function () {
                target.style.removeProperty('--ludo-button-glow-x');
                target.style.removeProperty('--ludo-button-glow-y');
            });

            host.addEventListener('focusin', function () {
                target.style.setProperty('--ludo-button-glow-x', '50%');
                target.style.setProperty('--ludo-button-glow-y', '50%');
            });

            host.addEventListener('focusout', function () {
                target.style.removeProperty('--ludo-button-glow-x');
                target.style.removeProperty('--ludo-button-glow-y');
            });
        });
    };
    Array.prototype.slice.call(document.querySelectorAll('[data-ludo-hero-tab]')).forEach(function (button) {
        button.addEventListener('click', function () {
            syncTabs('[data-ludo-hero-tab]', '[data-ludo-hero-panel]', button.dataset.ludoHeroTab);
        });
    });

    Array.prototype.slice.call(document.querySelectorAll('[data-ludo-card-tab]')).forEach(function (button) {
        button.addEventListener('click', function () {
            syncTabs('[data-ludo-card-tab]', '[data-ludo-card-panel]', button.dataset.ludoCardTab);
        });
    });

    Array.prototype.slice.call(document.querySelectorAll('[data-ludo-quote-stack]')).forEach(function (stack) {
        renderQuote(stack, 0);
        stack.addEventListener('click', function () {
            advanceQuote(stack);
        });
        stack.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                advanceQuote(stack);
            }
        });
    });

    if (infoCards.length) {
        setExpandedInfoContentIndex(-1);

        infoCards.forEach(function (card, index) {
            card.addEventListener('mousedown', function (event) {
                if (!infoDesktopQuery.matches || event.button !== 0) {
                    return;
                }

                lastInfoMouseDownAt = performance.now();
                activateInfoCard(index);
            });

            card.addEventListener('click', function () {
                if (!infoDesktopQuery.matches) {
                    return;
                }

                if (performance.now() - lastInfoMouseDownAt < 400) {
                    return;
                }

                activateInfoCard(index);
            });

            card.addEventListener('keydown', function (event) {
                if (!infoDesktopQuery.matches) {
                    return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activateInfoCard(index);
                }
            });
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && activeInfoIndex !== -1) {
                setExpandedInfoContentIndex(-1);
                activeInfoIndex = -1;
                renderInfoCards();
            }
        });

        infoDesktopQuery.addEventListener('change', function () {
            setExpandedInfoContentIndex(-1);
            activeInfoIndex = -1;
            infoCardsReady = false;
            infoStack.dataset.ready = 'false';
            renderInfoCards();
            finalizeInfoCardReadyState();
        });

        window.addEventListener('resize', renderInfoCards);
        window.addEventListener('load', renderInfoCards);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(renderInfoCards);
        }
        renderInfoCards();
        finalizeInfoCardReadyState();
    }

    initArtifactRailWave();

    bindPointerGlow('.ludo-bento__cta-card', '.ludo-bento__cta-pill');
    bindPointerGlow('.ludo-bento__nav-arrow', '.ludo-bento__nav-arrow-ring');

    initCharacterLightbox();
});


































