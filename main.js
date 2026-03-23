function hidePageLoader() {
    const body = document.body;
    if (!body || body.classList.contains('is-ready')) {
        return;
    }

    body.classList.add('is-ready');
    window.setTimeout(() => {
        body.classList.remove('is-loading');
    }, 450);
}

function initializePageLoader() {
    const loaderFill = document.querySelector('.page-loader__bar-fill');
    if (!loaderFill) {
        if (document.readyState === 'complete') {
            hidePageLoader();
        } else {
            window.addEventListener('load', hidePageLoader, { once: true });
        }
        return;
    }

    const assetUrls = new Set();

    const normalizeAssetUrl = (url) => {
        if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null;

        try {
            return new URL(url, window.location.href).href;
        } catch {
            return null;
        }
    };

    const registerAssetUrl = (url) => {
        const normalized = normalizeAssetUrl(url);
        if (normalized) {
            assetUrls.add(normalized);
        }
    };

    Array.from(document.images).forEach((img) => {
        registerAssetUrl(img.currentSrc || img.getAttribute('src'));
        registerAssetUrl(img.getAttribute('srcset')?.split(',')[0]?.trim().split(' ')[0]);
    });

    document.querySelectorAll('[style]').forEach((element) => {
        const inlineStyle = element.getAttribute('style') || '';
        const matches = inlineStyle.match(/url\((['"]?)(.*?)\1\)/g) || [];
        matches.forEach((match) => {
            const urlMatch = match.match(/url\((['"]?)(.*?)\1\)/);
            registerAssetUrl(urlMatch?.[2]);
        });
    });

    const collectUrlsFromRules = (rules) => {
        Array.from(rules || []).forEach((rule) => {
            if (rule.cssRules) {
                collectUrlsFromRules(rule.cssRules);
            }

            const cssText = rule.cssText || '';
            const matches = cssText.match(/url\((['"]?)(.*?)\1\)/g) || [];
            matches.forEach((match) => {
                const urlMatch = match.match(/url\((['"]?)(.*?)\1\)/);
                registerAssetUrl(urlMatch?.[2]);
            });
        });
    };

    Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
            collectUrlsFromRules(styleSheet.cssRules);
        } catch {
            // Ignore cross-origin stylesheets we cannot inspect.
        }
    });

    const trackedAssets = Array.from(assetUrls);
    const progressState = {
        target: 0.08,
        current: 0.08,
        completed: 0,
        total: trackedAssets.length + 2,
        isFinishing: false,
        hasHidden: false
    };

    const markComplete = () => {
        progressState.completed += 1;
        const rawProgress = progressState.total > 0 ? progressState.completed / progressState.total : 1;
        progressState.target = Math.max(progressState.target, Math.min(0.98, 0.08 + rawProgress * 0.92));
    };

    const renderProgress = () => {
        progressState.current += (progressState.target - progressState.current) * 0.16;
        if (Math.abs(progressState.target - progressState.current) < 0.002) {
            progressState.current = progressState.target;
        }

        loaderFill.style.transform = `scaleX(${progressState.current})`;

        if (progressState.current < 1 || !progressState.hasHidden) {
            window.requestAnimationFrame(renderProgress);
        }

        if (progressState.isFinishing && !progressState.hasHidden && progressState.current >= 0.995) {
            progressState.hasHidden = true;
            window.setTimeout(hidePageLoader, 120);
        }
    };

    trackedAssets.forEach((url) => {
        const assetImage = new Image();

        const onDone = () => {
            markComplete();
            assetImage.removeEventListener('load', onDone);
            assetImage.removeEventListener('error', onDone);
        };

        assetImage.addEventListener('load', onDone, { once: true });
        assetImage.addEventListener('error', onDone, { once: true });
        assetImage.decoding = 'async';
        assetImage.src = url;

        if (assetImage.complete) {
            onDone();
        }
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(markComplete);
    } else {
        markComplete();
    }

    const finishLoading = () => {
        markComplete();
        progressState.target = 1;
        progressState.isFinishing = true;
    };

    if (document.readyState === 'complete') {
        finishLoading();
    } else {
        window.addEventListener('load', finishLoading, { once: true });
    }

    window.requestAnimationFrame(renderProgress);
}

initializePageLoader();

/**
 * Portfolio Main Script
 * Handles Three.js 3D grid setup, animation, interaction, and general UI logic.
 */

class WebGLGrid {
    constructor() {
        this.container = document.getElementById('three-container');
        if (!this.container) return;

        // Settings
        this.gridSize = 200; // Expanded to ensure it covers wide screens
        this.spacing = 0.4;
        this.cursorRange = 12.0; // Radius of mouse pull influence
        this.gravityStrength = 0.2; // Strength of the cluster pulling towards mouse
        this.friction = 0.85; // Velocity damping for physics
        this.spring = 0.05; // Snap back to origin base force

        // Supernova pulse effect state
        this.pulseActive = false;
        this.pulseTime = 0;
        this.pulseOrigin = new THREE.Vector3();
        
        // Eruption effect state
        this.clickCount = 0;
        this.eruptionActive = false;
        this.eruptionTime = 0;

        // Setup
        this.scene = new THREE.Scene();

        // Define theme colors
        this.darkBgColor = 0x050505;
        this.lightBgColor = 0xf4f4f5; // Matches CSS --bg-color for light theme
        this.isLightMode = document.documentElement.classList.contains('light-theme');
        this.tempColor = new THREE.Color();
        this.neonColor1 = new THREE.Color(0xff00ff);
        this.neonColor2 = new THREE.Color(0x00ffff);
        this.lightNeonColor1 = new THREE.Color(0x0088ff);
        this.lightNeonColor2 = new THREE.Color(0xff0088);
        this.elapsedTime = 0;
        this.lastFrameTime = null;
        this.rafId = null;
        this.isAnimating = false;
        this.isVisible = true;
        this.isDocumentVisible = !document.hidden;
        this.animate = this.animate.bind(this);

        // Initial fog uses dark color
        this.scene.fog = new THREE.FogExp2(this.darkBgColor, 0.015);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        // Position camera pointing mostly downwards for a uniform grid spread
        this.camera.position.set(0, 40, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Interaction state
        this.mouse = new THREE.Vector2(-9999, -9999);
        this.targetMouse = new THREE.Vector2(-9999, -9999);
        this.raycaster = new THREE.Raycaster();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.intersection = new THREE.Vector3(-9999, 0, -9999);

        // Target colors for the cluster gradient (warm-cool)
        this.colorWarm = new THREE.Color(0xff4a3d); // Warm orange/red
        this.colorCool = new THREE.Color(0x3d7cff); // Cool blue/cyan

        this.initGrid();
        this.applyTheme(this.isLightMode);
        this.addEventListeners();
        this.updateAnimationState();
    }

    initGrid() {
        this.particleCount = this.gridSize * this.gridSize;

        const geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.basePositions = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);
        this.baseColors = []; // Store default pixel shades
        this.velocities = new Float32Array(this.particleCount * 3); // For spring physics

        const offset = (this.gridSize * this.spacing) / 2 - (this.spacing / 2);

        let i = 0;
        let cIndex = 0;

        for (let x = 0; x < this.gridSize; x++) {
            for (let z = 0; z < this.gridSize; z++) {
                // Adding microscopic random offset so it feels more like stardust than perfect grid
                const noiseX = (Math.random() - 0.5) * (this.spacing * 0.4);
                const noiseZ = (Math.random() - 0.5) * (this.spacing * 0.4);

                const posX = (x * this.spacing) - offset + noiseX;
                const posZ = (z * this.spacing) - offset + noiseZ;
                const posY = 0; // Flat base height

                this.positions[i] = posX;
                this.positions[i + 1] = posY;
                this.positions[i + 2] = posZ;

                this.basePositions[i] = posX;
                this.basePositions[i + 1] = posY;
                this.basePositions[i + 2] = posZ;

                this.velocities[i] = 0;
                this.velocities[i + 1] = 0;
                this.velocities[i + 2] = 0;

                // Create a subtle base gradient across the field
                const shade = 0.15 + Math.random() * 0.4;

                // Mix in slight warm/cool hints based on coordinates for a baseline gradient
                const nx = x / this.gridSize; // 0 to 1
                const nz = z / this.gridSize; // 0 to 1

                // Mix of deep purple/blue to orange/red for a subtle space nebula feel
                // Increased brightness by 2x from previous (1.2 * 2 = 2.4)
                const r = Math.min(1.0, (shade + nx * 0.15) * 2.4);
                const g = Math.min(1.0, (shade + (1 - nz) * 0.1) * 2.4);
                const b = Math.min(1.0, (shade + nz * 0.2) * 2.4);

                this.colors[cIndex] = r;
                this.colors[cIndex + 1] = g;
                this.colors[cIndex + 2] = b;

                this.baseColors.push(new THREE.Color(r, g, b));

                i += 3;
                cIndex += 3;
            }
        }

        // Snapshot original dark-mode colors so applyTheme can restore them
        this.originalBaseColors = this.baseColors.map(c => c.clone());

        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        // Create a circular point texture for soft "pixel stardust" appearance
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255,255,255,0)';
        ctx.fillRect(0, 0, 16, 16);
        ctx.beginPath();
        ctx.arc(8, 8, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
            size: 0.3, // Slightly larger stardust
            vertexColors: true,
            map: texture,
            transparent: true,
            opacity: 0.72, // Stronger default visibility for dark mode
            alphaTest: 0.05,
            blending: THREE.AdditiveBlending, // Makes overlapping particles glow beautifully
            depthWrite: false
        });

        this.points = new THREE.Points(geometry, material);
        this.scene.add(this.points);
    }


    applyTheme(isLight) {
        this.isLightMode = isLight;

        if (this.scene?.fog) {
            this.scene.fog.color.setHex(isLight ? this.lightBgColor : this.darkBgColor);
        }

        if (this.points?.material) {
            this.points.material.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
            this.points.material.opacity = isLight ? 0.55 : 0.72;
            this.points.material.needsUpdate = true;
        }

        // Recolor base particles for the active theme
        if (this.baseColors && this.originalBaseColors && this.colors && this.points) {
            for (let i = 0; i < this.baseColors.length; i++) {
                let r, g, b;
                if (isLight) {
                    // Vivid multi-hue palette using golden-angle spread
                    const hue = (i * 137.508) % 360;
                    const col = new THREE.Color().setHSL(hue / 360, 0.7, 0.42);
                    r = col.r; g = col.g; b = col.b;
                } else {
                    r = this.originalBaseColors[i].r;
                    g = this.originalBaseColors[i].g;
                    b = this.originalBaseColors[i].b;
                }
                this.baseColors[i].setRGB(r, g, b);
                this.colors[i * 3]     = r;
                this.colors[i * 3 + 1] = g;
                this.colors[i * 3 + 2] = b;
            }
            this.points.geometry.attributes.color.needsUpdate = true;
        }
    }

    startAnimation() {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;
        this.lastFrameTime = null;
        this.rafId = window.requestAnimationFrame(this.animate);
    }

    stopAnimation() {
        if (!this.isAnimating) {
            return;
        }

        this.isAnimating = false;
        this.lastFrameTime = null;
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    updateAnimationState() {
        if (this.isVisible && this.isDocumentVisible) {
            this.startAnimation();
            return;
        }

        this.stopAnimation();
    }

    addEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('visibilitychange', () => {
            this.isDocumentVisible = !document.hidden;
            this.updateAnimationState();
        });

        if ('IntersectionObserver' in window && this.container) {
            this.visibilityObserver = new IntersectionObserver((entries) => {
                this.isVisible = entries.some((entry) => entry.isIntersecting);
                this.updateAnimationState();
            }, { threshold: 0.01 });
            this.visibilityObserver.observe(this.container);
        }

        const touchState = {
            pointerId: null,
            startX: 0,
            startY: 0,
            startTime: 0,
            isHorizontalDrag: false,
            hasMoved: false,
            hasClaimedTap: false
        };

        const updatePointerTarget = (clientX, clientY, syncIntersection = false) => {
            const normalizedX = (clientX / window.innerWidth) * 2 - 1;
            const normalizedY = -(clientY / window.innerHeight) * 2 + 1;

            this.targetMouse.x = normalizedX;
            this.targetMouse.y = normalizedY;

            if (syncIntersection) {
                this.mouse.set(normalizedX, normalizedY);
                this.raycaster.setFromCamera(this.mouse, this.camera);
                this.raycaster.ray.intersectPlane(this.plane, this.intersection);
            }
        };

        const clearPointerTarget = () => {
            this.targetMouse.set(-9999, -9999);
        };

        const triggerPulse = () => {
            if (this.intersection.x === -9999) {
                return;
            }

            this.clickCount++;

            if (this.clickCount >= 3) {
                this.pulseActive = false; // Suppress the lingering slow wave from clicks 1 and 2
                this.eruptionActive = true;
                this.eruptionTime = 0;
                this.pulseOrigin.copy(this.intersection);
                this.clickCount = 0; // Reset counter after eruption
                this.gravityStrength = 0.2; // Reset gravity after burst

                // Add a massive bright shockwave flash
                const flash = new THREE.PointLight(0xffffff, 8, 150); // White blinding initial color
                flash.position.copy(this.intersection);
                this.scene.add(flash);

                const fadeFlash = setInterval(() => {
                    flash.intensity *= 0.85; // Faster fade
                    flash.distance += 2.0; // Huge explosion radius
                    if (flash.intensity < 0.1) {
                        this.scene.remove(flash);
                        clearInterval(fadeFlash);
                    }
                }, 30);
            } else {
                this.pulseActive = true;
                this.pulseTime = 0;
                this.pulseOrigin.copy(this.intersection);
                if (this.clickCount === 2) {
                    this.gravityStrength = 0.45; // Tap/click 2: tighten the orb
                }
            }
        };

        let mousemoveRafPending = false;
        window.addEventListener('mousemove', (e) => {
            if (!mousemoveRafPending) {
                mousemoveRafPending = true;
                const x = e.clientX, y = e.clientY;
                requestAnimationFrame(() => {
                    updatePointerTarget(x, y);
                    mousemoveRafPending = false;
                });
            }
        });

        window.addEventListener('mouseout', () => {
            clearPointerTarget();
        });

        window.addEventListener('mousedown', (e) => {
            updatePointerTarget(e.clientX, e.clientY, true);
            triggerPulse();
        });

        if (this.container) {
            this.container.addEventListener('pointerdown', (e) => {
                if (e.pointerType !== 'touch' && e.pointerType !== 'pen') {
                    return;
                }

                touchState.pointerId = e.pointerId;
                touchState.startX = e.clientX;
                touchState.startY = e.clientY;
                touchState.startTime = Date.now();
                touchState.isHorizontalDrag = false;
                touchState.hasMoved = false;
                touchState.hasClaimedTap = true;
                // No immediate orb — tap confirms on pointerup
            }, { passive: true });

            this.container.addEventListener('pointermove', (e) => {
                if ((e.pointerType !== 'touch' && e.pointerType !== 'pen') || touchState.pointerId !== e.pointerId) {
                    return;
                }

                const dx = e.clientX - touchState.startX;
                const dy = e.clientY - touchState.startY;

                if (!touchState.hasMoved && Math.hypot(dx, dy) > 15) {
                    touchState.hasMoved = true;
                }

                if (!touchState.isHorizontalDrag) {
                    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
                        touchState.isHorizontalDrag = true;
                        touchState.hasClaimedTap = false;
                    } else if (Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) {
                        touchState.hasClaimedTap = false;
                        clearPointerTarget();
                        return;
                    } else {
                        updatePointerTarget(e.clientX, e.clientY, true);
                        return;
                    }
                }

                e.preventDefault();
                updatePointerTarget(e.clientX, e.clientY, true);
            }, { passive: false });

            const finishTouchInteraction = (e) => {
                if ((e.pointerType !== 'touch' && e.pointerType !== 'pen') || touchState.pointerId !== e.pointerId) {
                    return;
                }

                const elapsed = Date.now() - touchState.startTime;
                const totalDrift = Math.hypot(e.clientX - touchState.startX, e.clientY - touchState.startY);
                const isTap = !touchState.isHorizontalDrag && touchState.hasClaimedTap
                    && (elapsed < 350 && totalDrift < 20);
                let keepOrb = false;

                if (isTap) {
                    e.preventDefault();
                    // Set intersection at tap position, then trigger the stateful orb sequence
                    updatePointerTarget(touchState.startX, touchState.startY, true);
                    triggerPulse();
                    // Keep orb alive for tap 1 and 2; clear after tap 3 (eruption resets clickCount to 0)
                    keepOrb = this.clickCount > 0;
                } else {
                    // Swipe or cancelled — reset tap sequence so next tap starts fresh
                    this.clickCount = 0;
                    this.gravityStrength = 0.2;
                }

                if (!keepOrb) {
                    clearPointerTarget();
                }

                touchState.pointerId = null;
                touchState.isHorizontalDrag = false;
                touchState.hasMoved = false;
                touchState.hasClaimedTap = false;
            };

            this.container.addEventListener('pointerup', finishTouchInteraction, { passive: false });
            this.container.addEventListener('pointercancel', finishTouchInteraction, { passive: true });
        }

    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateGrid(time, delta) {
        this.mouse.lerp(this.targetMouse, 0.15);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.raycaster.ray.intersectPlane(this.plane, this.intersection);

        if (this.mouse.x < -1 || this.mouse.x > 1 || this.mouse.y < -1 || this.mouse.y > 1) {
            this.intersection.set(-9999, 0, -9999);
        }

        const positions = this.points.geometry.attributes.position.array;
        const colors = this.points.geometry.attributes.color.array;

        let cIndex = 0;
        let vIndex = 0;

        const tempColor = this.tempColor;
        const neonColor1 = this.neonColor1;
        const neonColor2 = this.neonColor2;
        const lightNeonColor1 = this.lightNeonColor1;
        const lightNeonColor2 = this.lightNeonColor2;
        const isLightMode = this.isLightMode;

        // Progress supernova pulse (much slower now)
        if (this.pulseActive) {
            this.pulseTime += delta * 0.9; // Slow unfolding, frame-rate independent
            if (this.pulseTime > 5.0) { // Long lifetime
                this.pulseActive = false;
            }
        }
        
        // Progress Eruption shockwave (faster, sharper)
        if (this.eruptionActive) {
            this.eruptionTime += delta * 1.8;
            if (this.eruptionTime > 4.0) {
                this.eruptionActive = false;
            }
        }

        for (let i = 0; i < this.particleCount * 3; i += 3) {
            let x = positions[i];
            let y = positions[i + 1];
            let z = positions[i + 2];

            const bx = this.basePositions[i];
            const by = this.basePositions[i + 1];
            const bz = this.basePositions[i + 2];

            // Distance to mouse intersection from base position (stable clustering region)
            const dx = bx - this.intersection.x;
            const dz = bz - this.intersection.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            let pullX = 0;
            let pullY = 0;
            let pullZ = 0;
            let influence = 0;

            if (dist < this.cursorRange && this.intersection.x !== -9999) {
                // Gravity pull calculation (strongest at center)
                influence = 1.0 - (dist / this.cursorRange);
                // Cubic ease for smooth clustering falloff
                influence = influence * influence * influence;

                const force = influence * this.gravityStrength;

                // Create a target position on a sphere around the intersection point
                // Calculate angle based on the original base position relative to intersection center
                const angleH = Math.atan2(dz, dx);
                // Create a vertical angle based on distance so particles wrap around top/bottom of sphere
                const angleV = ((dist / this.cursorRange) * Math.PI) - (Math.PI / 2);

                // Sphere radius increased by 2x from 1.8675 to 3.735
                const sphereRadius = 3.735;

                // The target position if fully morphed into a sphere
                const targetX = this.intersection.x + Math.cos(angleH) * Math.cos(angleV) * sphereRadius;
                const targetY = this.intersection.y + Math.sin(angleV) * sphereRadius; // Centered exactly on mouse
                const targetZ = this.intersection.z + Math.sin(angleH) * Math.cos(angleV) * sphereRadius;

                // Pull points towards the spherical target positions
                pullX = (targetX - x) * force;
                pullY = (targetY - y) * force;
                pullZ = (targetZ - z) * force;

                // Create organic swirling motion within cluster based on time
                const swirlForce = influence * 0.15;
                pullX += Math.cos(angleH + Math.PI / 2) * swirlForce;
                pullZ += Math.sin(angleH + Math.PI / 2) * swirlForce;
                
                // Cap the maximum cursor acceleration to prevent slingshotting after an explosion
                const pullMag = Math.sqrt(pullX * pullX + pullY * pullY + pullZ * pullZ);
                if (pullMag > 0.5) {
                    pullX *= (0.5 / pullMag);
                    pullY *= (0.5 / pullMag);
                    pullZ *= (0.5 / pullMag);
                }

            } else {
                // Return to base position with gentle ambient wave
                const wave = Math.sin(bx * 0.15 + time) * Math.cos(bz * 0.15 + time) * 0.2;
                pullX = (bx - x) * this.spring;
                pullY = ((by + wave) - y) * this.spring;
                pullZ = (bz - z) * this.spring;
                
                // Cap the maximum return acceleration to prevent slingshotting
                const pullMag = Math.sqrt(pullX * pullX + pullY * pullY + pullZ * pullZ);
                if (pullMag > 0.5) {
                    pullX *= (0.5 / pullMag);
                    pullY *= (0.5 / pullMag);
                    pullZ *= (0.5 / pullMag);
                }
            }

            // Apply Supernova Subtle Gravity Pull
            let pulseColorInfluence = 0;
            if (this.pulseActive) {
                // Calculate distance from original pulse location
                const pdx = bx - this.pulseOrigin.x;
                const pdz = bz - this.pulseOrigin.z;
                const pDist = Math.sqrt(pdx * pdx + pdz * pdz);

                // Creating a slowly expanding color wave ring
                const waveRadius = this.pulseTime * 12.0; // Wave expansion speed
                const waveThickness = 12.0; // Extremely soft, thick gradient

                // Check if particle is near the expanding wave boundary
                const distToWave = Math.abs(pDist - waveRadius);
                if (distToWave < waveThickness) {
                    // Strongest at wave center, fading outwards smoothly (sine wave curve)
                    const strength = Math.cos((distToWave / waveThickness) * (Math.PI / 2));

                    // Force weakens over time as the supernova dissipates
                    const fadeOut = Math.max(0, 1.0 - (this.pulseTime / 5.0));
                    pulseColorInfluence = strength * fadeOut;

                    // Very subtle gravity pull toward the pulse center during the wave passing
                    const subtlePull = 0.005 * pulseColorInfluence;
                    pullX += (this.pulseOrigin.x - x) * subtlePull;
                    pullZ += (this.pulseOrigin.z - z) * subtlePull;
                }
            }
            
            // Apply Explosive Eruption Shockwave
            if (this.eruptionActive) {
                const edx = bx - this.pulseOrigin.x; // Use base position to compute shockwave cleanly
                const edy = by - this.pulseOrigin.y;
                const edz = bz - this.pulseOrigin.z;
                const eDist = Math.sqrt(edx * edx + edy * edy + edz * edz);

                const shockRadius = this.eruptionTime * 50.0; // Fast expanding shockwave
                const shockThick = 15.0; // Thick blast radius edge

                const distToShock = Math.abs(eDist - shockRadius);
                if (distToShock < shockThick) {
                    const strength = Math.cos((distToShock / shockThick) * (Math.PI / 2));
                    const fadeOut = Math.max(0, 1.0 - (this.eruptionTime / 4.0));
                    
                    const explosionForce = strength * fadeOut * 4.0; // Huge repulsive multiplier
                    
                    // Push violently outwards from origin
                    const pushX = (edx / (eDist || 0.1)) * explosionForce;
                    const pushZ = (edz / (eDist || 0.1)) * explosionForce;
                    
                    // Also lift them up into the air dynamically based on their baseline
                    const pushY = explosionForce * 0.5 + (edy / (eDist || 0.1)) * explosionForce;
                    
                    // Apply raw velocity pushing force
                    pullX += pushX;
                    pullY += pushY;
                    pullZ += pushZ;
                    
                    // Trigger massive intense coloring phase over the explosion wave
                    pulseColorInfluence = Math.max(pulseColorInfluence, strength * fadeOut * 2.5);
                }
            }

            // Integrate velocity & position updates
            this.velocities[i] += pullX;
            this.velocities[i + 1] += pullY;
            this.velocities[i + 2] += pullZ;

            this.velocities[i] *= this.friction;
            this.velocities[i + 1] *= this.friction;
            this.velocities[i + 2] *= this.friction;

            positions[i] += this.velocities[i];
            positions[i + 1] += this.velocities[i + 1];
            positions[i + 2] += this.velocities[i + 2];

            // Color update logic
            const baseColor = this.baseColors[cIndex];

            if (influence > 0.01 || pulseColorInfluence > 0.01) {

                if (pulseColorInfluence > influence * 1.5) {
                    // Handle Supernova Neon Color mixing
                    const currentDx = x - this.pulseOrigin.x;
                    const currentDz = z - this.pulseOrigin.z;
                    const angle = Math.atan2(currentDz, currentDx);

                    // Abstract swirling gradient of neons
                    const mixRatio = (Math.sin(angle * 2.0 + time) + 1) / 2;

                    if (isLightMode) {
                        // Use vibrant, mid-tone neons that look good on light backgrounds
                        tempColor.lerpColors(lightNeonColor1, lightNeonColor2, mixRatio);

                        // Subtle intensity boost, not too washed out
                        const pulseIntensity = pulseColorInfluence * 0.5;
                        tempColor.r = Math.min(1.2, tempColor.r + pulseIntensity);
                        tempColor.g = Math.min(1.2, tempColor.g + pulseIntensity);
                        tempColor.b = Math.min(1.2, tempColor.b + pulseIntensity);
                    } else {
                        tempColor.lerpColors(neonColor1, neonColor2, mixRatio);

                        // Intense glowing flare effect at the peak of the wave ring
                        const pulseIntensity = pulseColorInfluence * 1.5;
                        tempColor.r = Math.min(1.5, tempColor.r + pulseIntensity);
                        tempColor.g = Math.min(1.5, tempColor.g + pulseIntensity);
                        tempColor.b = Math.min(1.5, tempColor.b + pulseIntensity);
                    }

                    // Faster morphing during supernova wave
                    const blendSpd = Math.min(1.0, pulseColorInfluence * 0.5);
                    colors[vIndex] += (tempColor.r - colors[vIndex]) * blendSpd;
                    colors[vIndex + 1] += (tempColor.g - colors[vIndex + 1]) * blendSpd;
                    colors[vIndex + 2] += (tempColor.b - colors[vIndex + 2]) * blendSpd;

                } else {
                    // Handle standard gravity hover mixing (Warm-Cool)
                    const currentDx = x - this.intersection.x;
                    const currentDz = z - this.intersection.z;
                    const angle = Math.atan2(currentDz, currentDx);

                    const mixRatio = (Math.sin(angle + time * 2) + 1) / 2;

                    if (isLightMode) {
                        // Vibrant saturated gradient for light mode hover
                        tempColor.lerpColors(lightNeonColor2, lightNeonColor1, mixRatio);

                        // Mild intensity boost
                        tempColor.r = Math.min(1.1, tempColor.r + influence * 0.4);
                        tempColor.g = Math.min(1.1, tempColor.g + influence * 0.4);
                        tempColor.b = Math.min(1.1, tempColor.b + influence * 0.4);
                    } else {
                        tempColor.lerpColors(this.colorWarm, this.colorCool, mixRatio);

                        tempColor.r = Math.min(1.2, tempColor.r + influence * 0.8);
                        tempColor.g = Math.min(1.2, tempColor.g + influence * 0.8);
                        tempColor.b = Math.min(1.2, tempColor.b + influence * 0.8);
                    }

                    const blendSpd = influence * 0.3;
                    colors[vIndex] += (tempColor.r - colors[vIndex]) * blendSpd;
                    colors[vIndex + 1] += (tempColor.g - colors[vIndex + 1]) * blendSpd;
                    colors[vIndex + 2] += (tempColor.b - colors[vIndex + 2]) * blendSpd;
                }
            } else {
                // Dissipate back to original grey pixel state
                const returnSpd = 0.03;
                colors[vIndex] += (baseColor.r - colors[vIndex]) * returnSpd;
                colors[vIndex + 1] += (baseColor.g - colors[vIndex + 1]) * returnSpd;
                colors[vIndex + 2] += (baseColor.b - colors[vIndex + 2]) * returnSpd;
            }

            cIndex++;
            vIndex += 3;
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.color.needsUpdate = true;
    }

    animate(timestamp) {
        if (!this.isAnimating) {
            return;
        }

        this.rafId = window.requestAnimationFrame(this.animate);

        if (this.lastFrameTime === null) {
            this.lastFrameTime = timestamp;
        }

        const delta = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
        this.lastFrameTime = timestamp;
        this.elapsedTime += delta;
        const time = this.elapsedTime;

        // Gentle scene ambient rotation for scale feel
        this.scene.rotation.y = Math.sin(time * 0.05) * 0.08;

        this.updateGrid(time, delta);
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialization and Layout Scroll Effects
document.addEventListener('DOMContentLoaded', () => {

    // Smooth reveal animations on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const handleReveals = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    };

    const revealObserver = new IntersectionObserver(handleReveals, observerOptions);

    // Setup initial state for elements and observe
    document.querySelectorAll('.section-title, .about-text').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
        revealObserver.observe(el);
    });

    const contactContainer = document.querySelector('.contact-container');
    if (contactContainer) {
        contactContainer.style.opacity = '1';
        contactContainer.style.transform = 'translateY(0)';
    }

    // 3D Tilt Effect for Work Cards (Applied to Inner Image Wrapper)
    const workCards = Array.from(document.querySelectorAll('.work-card'));

    const applyWorkCardTilt = (card, clientX, clientY, scale = 1.02) => {
        const shell = card?.querySelector('.work-card-shell');
        if (!shell) return;

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
        if (!shell) return;

        shell.style.transition = 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
        shell.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

        setTimeout(() => {
            shell.style.willChange = 'auto';
        }, 600);
    };

    const clearWorkCardTilts = () => {
        workCards.forEach((card) => resetWorkCardTilt(card));
    };

    workCards.forEach(card => {
        const shell = card.querySelector('.work-card-shell');
        const bgImg = card.querySelector('.work-bg-image');
        if (!shell) return;

        card.addEventListener('mouseenter', () => {
            shell.style.transition = 'transform 0.1s cubic-bezier(0.19, 1, 0.22, 1)';
            shell.style.willChange = 'transform';
            if (bgImg) bgImg.style.transition = 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
        });

        card.addEventListener('mousemove', (e) => {
            applyWorkCardTilt(card, e.clientX, e.clientY, 1.02);
        });

        card.addEventListener('mouseleave', () => {
            if (bgImg) bgImg.style.transition = 'none';
            resetWorkCardTilt(card);
        });
    });

    // Initialize WebGL Hero Background
    let webgl = null;
    if (window.THREE) {
        try {
            webgl = new WebGLGrid();
        } catch (error) {
            console.warn('WebGL hero failed to initialize.', error);
        }
    }

    // Scroll effects â€” runs unconditionally so parallax works even if WebGL fails
    {
        const navbar = document.querySelector('.navbar');
        const heroSection = document.getElementById('hero');
        const workSection = document.getElementById('work');
        const aboutSection = document.getElementById('about');
        const contactSection = document.getElementById('contact');
        const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
        const getStaticTop = (element) => {
            let staticTop = 0;
            let current = element;

            while (current) {
                staticTop += current.offsetTop;
                current = current.offsetParent;
            }

            return staticTop;
        };
        const getWorkStickyTop = () => {
            if (!workSection) {
                return 0;
            }

            const stickyTop = parseFloat(window.getComputedStyle(workSection).top);
            return Number.isFinite(stickyTop) ? stickyTop : 0;
        };

        const updateScrollEffects = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
            const workTop = workSection ? getStaticTop(workSection) : heroHeight;
            const workStickyTop = getWorkStickyTop();
            const heroProgressEnd = Math.max(1, workTop - workStickyTop);
            const scrollProgress = clamp(scrollTop / heroProgressEnd);
            const workRect = workSection ? workSection.getBoundingClientRect() : null;
            const aboutRect = aboutSection ? aboutSection.getBoundingClientRect() : null;

            document.body.style.setProperty('--scroll-progress', scrollProgress.toString());

            // Work section parallax and tilt handoff (desktop only)
            if (workSection && window.innerWidth > 768) {
                const viewportHeight = window.innerHeight;
                const entryProgress = workRect
                    ? clamp((viewportHeight - workRect.top) / Math.max(1, viewportHeight - workStickyTop))
                    : 0;
                const takeoverProgress = aboutRect
                    ? clamp((viewportHeight - aboutRect.top) / viewportHeight)
                    : 0;

                workSection.style.setProperty('--parallax-y', `${-(entryProgress * 30 + takeoverProgress * 96)}px`);
                workSection.style.setProperty('--work-tilt-x', `${takeoverProgress * 32}deg`);
                workSection.style.setProperty('--work-translate-y', `${takeoverProgress * 132}px`);
                workSection.style.setProperty('--work-scale', `${1 - takeoverProgress * 0.14}`);
            } else if (workSection) {
                workSection.style.setProperty('--parallax-y', '0px');
                workSection.style.setProperty('--work-tilt-x', '0deg');
                workSection.style.setProperty('--work-translate-y', '0px');
                workSection.style.setProperty('--work-scale', '1');
            }

            if (navbar && workSection) {
                const stickyStart = workTop - workStickyTop;
                const fadeDistance = Math.min(600, window.innerHeight * 0.65);
                const fadeStart = Math.max(0, stickyStart - fadeDistance);
                const fadeEnd = stickyStart;
                const navBgOpacity = clamp((scrollTop - fadeStart) / Math.max(1, fadeEnd - fadeStart));

                navbar.style.setProperty('--nav-bg-opacity', navBgOpacity.toString());
            }

            if (navbar) {
                const navHeight = navbar.offsetHeight;
                const isGlobalLightTheme = document.documentElement.classList.contains('light-theme');
                const contactRect = contactSection ? contactSection.getBoundingClientRect() : null;
                let navLightProgress = 0;
                let navDarkProgress = 0;

                if (aboutRect && aboutRect.bottom > 0) {
                    if (aboutRect.top <= 0) {
                        navLightProgress = 1;
                    } else if (aboutRect.top < navHeight) {
                        navLightProgress = 1 - (aboutRect.top / navHeight);
                    }
                }

                if (!isGlobalLightTheme && contactRect && contactRect.bottom > 0) {
                    if (contactRect.top <= 0) {
                        navDarkProgress = 1;
                    } else if (contactRect.top < navHeight) {
                        navDarkProgress = 1 - (contactRect.top / navHeight);
                    }
                }

                if (navDarkProgress > 0) {
                    navLightProgress = Math.min(navLightProgress, 1 - navDarkProgress);
                }

                const visibleLightProgress = Math.max(0, navLightProgress - navDarkProgress);
                navbar.style.setProperty('--nav-light-progress', navLightProgress.toString());
                navbar.style.setProperty('--nav-dark-progress', navDarkProgress.toString());
                navbar.classList.toggle('navbar-light', visibleLightProgress > 0.5 || isGlobalLightTheme);
            }
        };

        let scrollRafPending = false;
        window.addEventListener('scroll', () => {
            if (!scrollRafPending) {
                scrollRafPending = true;
                requestAnimationFrame(() => {
                    updateScrollEffects();
                    scrollRafPending = false;
                });
            }
        });
        window.addEventListener('resize', updateScrollEffects);
        updateScrollEffects();
    }

    // 3D Zoetrope Carousel Logic
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');
    
    if (carouselContainer && carouselTrack) {
        const cards = Array.from(carouselTrack.querySelectorAll('.work-card'));
        const numCards = cards.length;
        const theta = 360 / numCards;
        let radius = 0;
        let lastViewportWidth = window.innerWidth;
        let lastMeasuredCardWidth = 0;
        let isFlatMode = false;
        let flatStride = 0;
        let flatCurrentOffset = 0;
        let flatTargetOffset = 0;
        let flatNumCards = numCards;

        const updateCarouselGeometry = (force = false) => {
            const sampleCard = cards[0];
            const cardWidth = sampleCard ? sampleCard.getBoundingClientRect().width || 320 : 320;
            const isMobileViewport = window.innerWidth <= 768;

            if (!force && Math.abs(cardWidth - lastMeasuredCardWidth) < 1 && Math.abs(window.innerWidth - lastViewportWidth) < 1) {
                return;
            }

            lastMeasuredCardWidth = cardWidth;
            lastViewportWidth = window.innerWidth;

            if (isMobileViewport) {
                const wasFlat = isFlatMode;
                isFlatMode = true;
                flatStride = cardWidth + 12;

                if (!wasFlat || force) {
                    flatCurrentOffset = 0;
                    flatTargetOffset = 0;
                }

                let flatIdx = 0;
                cards.forEach((card, index) => {
                    if (card.classList.contains('title-card')) {
                        card.style.display = 'none';
                        card.dataset.flatIdx = '-1';
                        return;
                    }
                    card.style.display = '';
                    card.style.transform = `translateX(${flatIdx * flatStride}px)`;
                    card.dataset.angle = theta * index;
                    card.dataset.flatIdx = String(flatIdx);
                    flatIdx++;
                });
                flatNumCards = flatIdx;
            } else {
                isFlatMode = false;
                flatNumCards = numCards;

                const baseRadius = Math.round((cardWidth / 2) / Math.tan(Math.PI / numCards));
                const depthPadding = Math.max(24, cardWidth * 0.16);
                radius = baseRadius + depthPadding;

                cards.forEach((card, index) => {
                    card.style.display = '';
                    const angle = theta * index;
                    card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
                    card.dataset.angle = angle;
                });
            }
        };

        // Initialize card positions and attach reliable click listeners
        cards.forEach((card, index) => {
            const angle = theta * index;
            card.dataset.angle = angle;

            // Native click listener to rigidly snap to this specific card
            card.addEventListener('click', (event) => {
                if (event.target.closest('.work-card-link')) {
                    return;
                }
                if (window.innerWidth <= 768) return;
                // Ignore clicks if the user was actually dragging across the card
                if (Math.abs(currentXCarousel - startXCarousel) > 5) return;

                targetRotation = -angle;
                // No clamping, allow free rotation
            });
        });

        carouselTrack.querySelectorAll('.work-card-link').forEach((link) => {
            link.addEventListener('pointerdown', (event) => {
                // On touch, let the event bubble to carouselContainer so swipe can start.
                // On mouse, stop propagation to prevent drag from starting on a link click.
                if (event.pointerType !== 'touch') {
                    event.stopPropagation();
                }
            });
            link.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        updateCarouselGeometry(true);
        requestAnimationFrame(() => updateCarouselGeometry(true)); // re-measure after first paint
        window.addEventListener('resize', () => updateCarouselGeometry(false));

        // Current rotation state
        const titleCardIndex = cards.findIndex(card => card.classList.contains('title-card'));
        const centerIndex = titleCardIndex !== -1 ? titleCardIndex : Math.floor(numCards / 2);
        let currentRotation = -centerIndex * theta; // Start perfectly on the "Projects" title card
        let targetRotation = -centerIndex * theta;
        let isDraggingCarousel = false;
        let startXCarousel = 0;
        let currentXCarousel = 0;
        let dragStartRotation = targetRotation;
        let dragPointerType = 'mouse';
        let activeFrontCard = null;
        let pendingFrontCard = null;
        let pendingFrontCardTimeout = null;
        let carouselFrameId = null;
        let isCarouselAnimating = false;
        let isCarouselVisible = true;
        let isDocumentVisible = !document.hidden;

        const normalizeAngle = (angle) => {
            let normalized = angle % 360;
            if (normalized > 180) normalized -= 360;
            if (normalized < -180) normalized += 360;
            return normalized;
        };

        const getCenteredCard = () => {
            if (isFlatMode) {
                let closest = null;
                let closestDist = Infinity;
                cards.forEach((card) => {
                    const fIdx = parseInt(card.dataset.flatIdx ?? '-1');
                    if (fIdx < 0) return;
                    const dist = Math.abs(fIdx * flatStride - flatCurrentOffset);
                    if (dist < closestDist) { closestDist = dist; closest = card; }
                });
                return closest;
            }
            return cards.reduce((closestCard, card) => {
                if (!closestCard) return card;
                const cardAngle = parseFloat(card.dataset.angle) || 0;
                const closestAngle = parseFloat(closestCard.dataset.angle) || 0;
                const currentDistance = Math.abs(normalizeAngle(cardAngle + currentRotation));
                const closestDistance = Math.abs(normalizeAngle(closestAngle + currentRotation));
                return currentDistance < closestDistance ? card : closestCard;
            }, null);
        };

        const syncActiveFrontCard = () => {
            const centeredCard = getCenteredCard();
            const nextActiveCard = centeredCard && !centeredCard.classList.contains('title-card')
                ? centeredCard
                : null;

            if (pendingFrontCardTimeout && pendingFrontCard !== nextActiveCard) {
                clearTimeout(pendingFrontCardTimeout);
                pendingFrontCardTimeout = null;
                pendingFrontCard = null;
            }

            if (activeFrontCard && activeFrontCard !== nextActiveCard) {
                activeFrontCard.classList.remove('is-active');
                activeFrontCard = null;
            }

            if (!nextActiveCard) {
                return;
            }

            if (activeFrontCard === nextActiveCard || pendingFrontCard === nextActiveCard) {
                return;
            }

            pendingFrontCard = nextActiveCard;
            pendingFrontCardTimeout = setTimeout(() => {
                const centeredCandidate = getCenteredCard();
                const stabilizedCard = centeredCandidate && !centeredCandidate.classList.contains('title-card')
                    ? centeredCandidate
                    : null;

                if (stabilizedCard === nextActiveCard) {
                    nextActiveCard.classList.add('is-active');
                    activeFrontCard = nextActiveCard;
                }

                pendingFrontCard = null;
                pendingFrontCardTimeout = null;
            }, 100);
        };
        
        // Animation loop for smooth easing
        function animateCarousel() {
            if (!isCarouselAnimating) {
                return;
            }

            if (isFlatMode) {
                flatCurrentOffset += (flatTargetOffset - flatCurrentOffset) * 0.1;
                carouselTrack.style.transform = `translateX(${-flatCurrentOffset}px)`;
            } else {
                currentRotation += (targetRotation - currentRotation) * 0.1;
                carouselTrack.style.transform = `translateZ(-${radius}px) rotateY(${currentRotation}deg)`;
            }
            syncActiveFrontCard();
            carouselFrameId = requestAnimationFrame(animateCarousel);
        }

        const startCarouselAnimation = () => {
            if (isCarouselAnimating) {
                return;
            }

            isCarouselAnimating = true;
            animateCarousel();
        };

        const stopCarouselAnimation = () => {
            if (!isCarouselAnimating) {
                return;
            }

            isCarouselAnimating = false;
            if (carouselFrameId) {
                cancelAnimationFrame(carouselFrameId);
                carouselFrameId = null;
            }
        };

        const updateCarouselAnimationState = () => {
            if (isCarouselVisible && isDocumentVisible) {
                startCarouselAnimation();
                return;
            }

            stopCarouselAnimation();
        };

        if ('IntersectionObserver' in window) {
            const carouselObserver = new IntersectionObserver((entries) => {
                isCarouselVisible = entries.some((entry) => entry.isIntersecting);
                if (isCarouselVisible) {
                    syncActiveFrontCard();
                }
                updateCarouselAnimationState();
            }, { threshold: 0.05 });
            carouselObserver.observe(carouselContainer);
        }

        document.addEventListener('visibilitychange', () => {
            isDocumentVisible = !document.hidden;
            updateCarouselAnimationState();
        });

        syncActiveFrontCard();
        updateCarouselAnimationState();

        // Arrow button logic
        const prevBtn = carouselContainer.querySelector('.carousel-control.prev');
        const nextBtn = carouselContainer.querySelector('.carousel-control.next');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                targetRotation += theta; // Move left visually by rotating right
                const snapIndex = Math.round(targetRotation / theta);
                targetRotation = snapIndex * theta;
            });
            nextBtn.addEventListener('click', () => {
                targetRotation -= theta; // Move right visually by rotating left
                const snapIndex = Math.round(targetRotation / theta);
                targetRotation = snapIndex * theta;
            });
        }

        // Keyboard navigation — fires globally, only acts when carousel is in view
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            if (!isCarouselVisible) return;
            e.preventDefault();
            if (isFlatMode) {
                const direction = e.key === 'ArrowLeft' ? -1 : 1;
                const currentIndex = Math.round(flatCurrentOffset / flatStride);
                const newIndex = Math.max(0, Math.min(flatNumCards - 1, currentIndex + direction));
                flatTargetOffset = newIndex * flatStride;
            } else {
                if (e.key === 'ArrowLeft') {
                    targetRotation += theta;
                } else {
                    targetRotation -= theta;
                }
                targetRotation = Math.round(targetRotation / theta) * theta;
            }
        });

        // Pointer event dragging logic
        carouselContainer.addEventListener('pointerdown', (e) => {
            isDraggingCarousel = true;
            dragPointerType = e.pointerType || 'mouse';
            startXCarousel = e.clientX;
            currentXCarousel = e.clientX;
            dragStartRotation = targetRotation;
            carouselContainer.style.cursor = 'grabbing';
            carouselTrack.style.transition = 'none';
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDraggingCarousel) return;

            const dx = e.clientX - currentXCarousel;
            currentXCarousel = e.clientX;

            if (isFlatMode) {
                flatTargetOffset -= dx;
                flatTargetOffset = Math.max(0, Math.min((flatNumCards - 1) * flatStride, flatTargetOffset));
            } else {
                const dragSensitivity = dragPointerType === 'touch' ? 0.28 : 0.15;
                targetRotation += dx * dragSensitivity;
            }
        });

        window.addEventListener('pointercancel', () => {
            if (!isDraggingCarousel) return;
            isDraggingCarousel = false;
            carouselContainer.style.cursor = 'grab';
            if (isFlatMode) {
                const snapIndex = Math.max(0, Math.min(flatNumCards - 1, Math.round(flatCurrentOffset / flatStride)));
                flatTargetOffset = snapIndex * flatStride;
            }
        });

        window.addEventListener('pointerup', (e) => {
            if (!isDraggingCarousel) return;
            isDraggingCarousel = false;
            carouselContainer.style.cursor = 'grab';

            const totalDrag = e.clientX - startXCarousel;

            if (isFlatMode) {
                const swipeThreshold = Math.min(40, window.innerWidth * 0.07);
                if (Math.abs(totalDrag) > swipeThreshold) {
                    const direction = totalDrag < 0 ? 1 : -1;
                    const currentIndex = Math.round(flatCurrentOffset / flatStride);
                    const newIndex = Math.max(0, Math.min(flatNumCards - 1, currentIndex + direction));
                    flatTargetOffset = newIndex * flatStride;
                } else {
                    const snapIndex = Math.max(0, Math.min(flatNumCards - 1, Math.round(flatCurrentOffset / flatStride)));
                    flatTargetOffset = snapIndex * flatStride;
                }
            } else {
                const startSnapIndex = Math.round(dragStartRotation / theta);
                const touchSwipeThreshold = Math.min(72, window.innerWidth * 0.09);

                if (dragPointerType === 'touch' && Math.abs(totalDrag) > touchSwipeThreshold) {
                    const direction = totalDrag < 0 ? -1 : 1;
                    targetRotation = (startSnapIndex + direction) * theta;
                } else {
                    const snapIndex = Math.round(targetRotation / theta);
                    targetRotation = snapIndex * theta;
                }
            }
        });
        
        // Mouse wheel strictly for horizontal sweeps
        let wheelTimeout;
        carouselContainer.addEventListener('wheel', (e) => {
            // Only hijack the scroll if the user is swiping horizontally (trackpad)
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault(); 
                
                // Scrub the rotation smoothly while scrolling
                targetRotation += Math.sign(e.deltaX) * -theta * 0.15; 
                
                // Clear the previous timeout
                clearTimeout(wheelTimeout);
                
                // Set a timeout to detect when the scroll gesture has actually finished
                wheelTimeout = setTimeout(() => {
                    // Snap to the nearest card exactly
                    const snapIndex = Math.round(targetRotation / theta);
                    targetRotation = snapIndex * theta;
                }, 150); // 150ms of no scrolling means the swipe ended
            }
        }, { passive: false });
    }

    let themeToggleAudioContext;
    let themeToggleNoiseBuffer;
    let glitchAudioContext;
    let glitchNoiseBuffer;
    const playThemeToggleClick = () => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        themeToggleAudioContext ??= new AudioContextClass();
        const ctx = themeToggleAudioContext;
        const triggerClick = () => {
            const now = ctx.currentTime + 0.004;
            const output = ctx.createGain();
            output.gain.setValueAtTime(0.0001, now);
            output.gain.exponentialRampToValueAtTime(0.12, now + 0.004);
            output.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
            output.connect(ctx.destination);
            const snap = ctx.createOscillator();
            snap.type = 'triangle';
            snap.frequency.setValueAtTime(760, now);
            snap.frequency.exponentialRampToValueAtTime(380, now + 0.028);
            const snapGain = ctx.createGain();
            snapGain.gain.setValueAtTime(0.0001, now);
            snapGain.gain.exponentialRampToValueAtTime(0.08, now + 0.002);
            snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
            snap.connect(snapGain);
            snapGain.connect(output);
            snap.start(now);
            snap.stop(now + 0.04);
            const body = ctx.createOscillator();
            body.type = 'triangle';
            body.frequency.setValueAtTime(235, now);
            body.frequency.exponentialRampToValueAtTime(150, now + 0.1);
            const bodyGain = ctx.createGain();
            bodyGain.gain.setValueAtTime(0.0001, now);
            bodyGain.gain.exponentialRampToValueAtTime(0.24, now + 0.004);
            bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
            body.connect(bodyGain);
            bodyGain.connect(output);
            body.start(now);
            body.stop(now + 0.11);
            const thump = ctx.createOscillator();
            thump.type = 'sine';
            thump.frequency.setValueAtTime(108, now);
            thump.frequency.exponentialRampToValueAtTime(72, now + 0.08);
            const thumpGain = ctx.createGain();
            thumpGain.gain.setValueAtTime(0.0001, now);
            thumpGain.gain.exponentialRampToValueAtTime(0.11, now + 0.004);
            thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
            thump.connect(thumpGain);
            thumpGain.connect(output);
            thump.start(now);
            thump.stop(now + 0.085);
            if (!themeToggleNoiseBuffer) {
                themeToggleNoiseBuffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.03)), ctx.sampleRate);
                const channel = themeToggleNoiseBuffer.getChannelData(0);
                for (let index = 0; index < channel.length; index += 1) {
                    channel[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / channel.length, 2.4);
                }
            }
            const noise = ctx.createBufferSource();
            noise.buffer = themeToggleNoiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1450, now);
            filter.Q.value = 1.1;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.0001, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.032, now + 0.002);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(output);
            noise.start(now);
            noise.stop(now + 0.028);
        };
        if (ctx.state === 'suspended') {
            ctx.resume().then(triggerClick).catch(() => {});
            return;
        }
        triggerClick();
    };
    let isAboutSectionVisible = true;

    const stopGlitchTransition = () => {
        if (!glitchAudioContext || glitchAudioContext.state !== 'running') return;
        glitchAudioContext.suspend().catch(() => {});
    };

    const playGlitchTransition = () => {
        if (!isAboutSectionVisible) {
            stopGlitchTransition();
            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        glitchAudioContext ??= new AudioContextClass();
        const ctx = glitchAudioContext;
        const triggerGlitch = () => {
            try {
                const now = ctx.currentTime + 0.002;
                const output = ctx.createGain();
                output.gain.setValueAtTime(0.0001, now);
                output.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
                output.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
                output.connect(ctx.destination);

                const carrier = ctx.createOscillator();
                carrier.type = 'sawtooth';
                carrier.frequency.setValueAtTime(210, now);
                carrier.frequency.exponentialRampToValueAtTime(620, now + 0.045);
                carrier.frequency.exponentialRampToValueAtTime(180, now + 0.16);
                const carrierGain = ctx.createGain();
                carrierGain.gain.setValueAtTime(0.0001, now);
                carrierGain.gain.exponentialRampToValueAtTime(0.05, now + 0.006);
                carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
                carrier.connect(carrierGain);
                carrierGain.connect(output);
                carrier.start(now);
                carrier.stop(now + 0.14);

                const sparkle = ctx.createOscillator();
                sparkle.type = 'square';
                sparkle.frequency.setValueAtTime(1400, now);
                sparkle.frequency.exponentialRampToValueAtTime(780, now + 0.08);
                const sparkleGain = ctx.createGain();
                sparkleGain.gain.setValueAtTime(0.0001, now);
                sparkleGain.gain.exponentialRampToValueAtTime(0.025, now + 0.004);
                sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
                sparkle.connect(sparkleGain);
                sparkleGain.connect(output);
                sparkle.start(now);
                sparkle.stop(now + 0.08);

                if (!glitchNoiseBuffer) {
                    glitchNoiseBuffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.14)), ctx.sampleRate);
                    const channel = glitchNoiseBuffer.getChannelData(0);
                    for (let index = 0; index < channel.length; index += 1) {
                        channel[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / channel.length, 1.4);
                    }
                }

                const noise = ctx.createBufferSource();
                noise.buffer = glitchNoiseBuffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.setValueAtTime(2200, now);
                noiseFilter.Q.value = 1.6;
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.0001, now);
                noiseGain.exponentialRampToValueAtTime(0.04, now + 0.003);
                noiseGain.exponentialRampToValueAtTime(0.0001, now + 0.09);
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(output);
                noise.start(now);
                noise.stop(now + 0.1);
            } catch {
                // Keep the visual title transition running even if Web Audio glitches.
            }
        };
        if (ctx.state === 'suspended') {
            ctx.resume().then(triggerGlitch).catch(() => {});
            return;
        }
        triggerGlitch();
    };
    // Theme Toggle Logic
    const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');
    const menuToggleButton = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    const mobileWorkToggle = document.getElementById('mobile-work-toggle');
    const mobileWorkProjects = document.getElementById('mobile-work-projects');

    const closeMobileMenu = () => {
        if (!menuToggleButton || !mobileMenu) return;
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
    const refreshNavbarState = () => {
        window.dispatchEvent(new Event('scroll'));
    };

    const toggleMobileMenu = () => {
        if (!menuToggleButton || !mobileMenu) return;
        const isOpen = mobileMenu.classList.toggle('is-open');
        menuToggleButton.classList.toggle('is-open', isOpen);
        menuToggleButton.setAttribute('aria-expanded', String(isOpen));
        menuToggleButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    };

    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.add('light-theme');
        webgl?.applyTheme(true);
        refreshNavbarState();
    }

    themeToggleButtons.forEach((themeToggleBtn) => {
        themeToggleBtn.addEventListener('click', () => {
            playThemeToggleClick();
            const isLight = document.documentElement.classList.toggle('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            webgl?.applyTheme(isLight);
            refreshNavbarState();
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

    mobileMenuLinks.forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Interactive Collage Logic
    const draggables = document.querySelectorAll('.draggable');
    const photoSelf = document.getElementById('photo-self');

    const clearSelectedDraggables = () => {
        draggables.forEach((item) => item.classList.remove('is-selected'));
    };

    let activeItem = null;
    let dragType = 'move'; // 'move', 'rotate', 'scale', 'gesture'
    let startX = 0, startY = 0;
    let startRot = 0, startScale = 1;
    let rectCenter = {x: 0, y: 0};
    let initialDist = 0, initialAngle = 0;
    let gestureStart = null;
    const activePointers = new Map();

    draggables.forEach(item => {
        // We use pointer events for better mouse/touch unification
        item.addEventListener('pointerdown', dragStart);
        // Forcefully disable the native HTML5 drag-and-drop to prevent hijacking
        item.addEventListener('dragstart', e => e.preventDefault());
        
        // Store the original CSS variables so we can instantly reset them on click
        item.dataset.initialStyle = item.getAttribute('style') || '';
    });

    function dragStart(e) {
        const targetItem = e.target.closest('.draggable');
        if (!targetItem || targetItem.classList.contains('snap-back')) return;

        // Stop the pointer event from bubbling down to the photo-self and triggering a reset
        e.stopPropagation();

        // Handle quick click actions (Layer Adjustments) immediately
        if (e.target.closest('.gui-layer-up')) {
            const currentZ = parseInt(window.getComputedStyle(targetItem).zIndex) || 10;
            targetItem.style.zIndex = currentZ + 1;
            return;
        } else if (e.target.closest('.gui-layer-down')) {
            const currentZ = parseInt(window.getComputedStyle(targetItem).zIndex) || 10;
            targetItem.style.zIndex = Math.max(1, currentZ - 1); // Don't let it drop behind background
            return;
        }

        const isTouchPointer = e.pointerType === 'touch' || e.pointerType === 'pen';

        if (isTouchPointer && activeItem === targetItem && !activePointers.has(e.pointerId)) {
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            activeItem.setPointerCapture(e.pointerId);

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

        // Determine what action we're taking based on the specific element clicked
        if (e.target.closest('.gui-rotate')) dragType = 'rotate';
        else if (e.target.closest('.gui-scale')) dragType = 'scale';
        else dragType = 'move';

        activeItem.classList.add('dragging');
        activeItem.setPointerCapture(e.pointerId);

        activePointers.clear();
        if (isTouchPointer) {
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        // Read current CSS variables
        const style = window.getComputedStyle(activeItem);
        const currDragX = parseFloat(style.getPropertyValue('--drag-x')) || 0;
        const currDragY = parseFloat(style.getPropertyValue('--drag-y')) || 0;
        startRot = parseFloat(style.getPropertyValue('--rot')) || 0;
        startScale = parseFloat(style.getPropertyValue('--scale')) || 1;
        gestureStart = null;

        if (dragType === 'move') {
            startX = e.clientX - currDragX;
            startY = e.clientY - currDragY;
        } else {
            // For rotate and scale, we need the mathematical center of the element on screen
            const rect = activeItem.getBoundingClientRect();
            rectCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

            if (dragType === 'rotate') {
                initialAngle = Math.atan2(e.clientY - rectCenter.y, e.clientX - rectCenter.x) * (180 / Math.PI);
            } else if (dragType === 'scale') {
                initialDist = Math.hypot(e.clientX - rectCenter.x, e.clientY - rectCenter.y);
            }
        }

        activeItem.addEventListener('pointermove', dragMove);
        activeItem.addEventListener('pointerup', dragEnd);
        activeItem.addEventListener('pointercancel', dragEnd);
    }

    function dragMove(e) {
        if (!activeItem) return;

        if (activePointers.has(e.pointerId)) {
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        if (dragType === 'move') {
            const currentX = e.clientX - startX;
            const currentY = e.clientY - startY;
            activeItem.style.setProperty('--drag-x', `${currentX}px`);
            activeItem.style.setProperty('--drag-y', `${currentY}px`);
        } else if (dragType === 'gesture') {
            if (activePointers.size < 2 || !gestureStart) return;
            const points = Array.from(activePointers.values());
            const dx = points[1].x - points[0].x;
            const dy = points[1].y - points[0].y;
            const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            const currentDistance = Math.hypot(dx, dy);
            const dAngle = currentAngle - gestureStart.angle;
            let newScale = gestureStart.distance > 0 ? startScale * (currentDistance / gestureStart.distance) : startScale;
            newScale = Math.max(0.2, Math.min(newScale, 5));
            activeItem.style.setProperty('--rot', `${startRot + dAngle}deg`);
            activeItem.style.setProperty('--scale', newScale);
        } else if (dragType === 'rotate') {
            const currentAngle = Math.atan2(e.clientY - rectCenter.y, e.clientX - rectCenter.x) * (180 / Math.PI);
            const dAngle = currentAngle - initialAngle;
            activeItem.style.setProperty('--rot', `${startRot + dAngle}deg`);
        } else if (dragType === 'scale') {
            const currentDist = Math.hypot(e.clientX - rectCenter.x, e.clientY - rectCenter.y);
            // Avoid division by zero
            const scaleFactor = initialDist > 0 ? (currentDist / initialDist) : 1;
            // Limit scale so it doesn't invert or get too massive
            let newScale = startScale * scaleFactor;
            newScale = Math.max(0.2, Math.min(newScale, 5));
            activeItem.style.setProperty('--scale', newScale);
        }
    }

    function dragEnd(e) {
        if (!activeItem) return;

        activePointers.delete(e.pointerId);

        try {
            activeItem.releasePointerCapture(e.pointerId);
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
        if (!event.target.closest('.draggable')) {
            clearSelectedDraggables();
        }
    });

    // Pull-to-Reset Logic
    const resetTab = document.getElementById('reset-tab');
    let isPulling = false;
    let pullStartY = 0;

    if (resetTab) {
        resetTab.addEventListener('pointerdown', (e) => {
            isPulling = true;
            pullStartY = e.clientY;
            resetTab.style.transition = 'none'; // Disable transition for 1:1 drag
            resetTab.setPointerCapture(e.pointerId);
        });

        resetTab.addEventListener('pointermove', (e) => {
            if (!isPulling) return;
            const dy = Math.max(0, pullStartY - e.clientY); // Only allow pulling up (into portrait)
            // Limit max pull distance to create tension
            const pullDist = Math.min(dy, 120);
            resetTab.style.setProperty('--pull-y', `${pullDist}px`);
        });

        const resetDragEnd = (e) => {
            if (!isPulling) return;
            isPulling = false;
            resetTab.releasePointerCapture(e.pointerId);
            
            const dy = Math.max(0, pullStartY - e.clientY);

            // Animate snap back
            resetTab.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            resetTab.style.setProperty('--pull-y', `0px`);

            // If pulled far enough, trigger reset
            if (dy > 80) {
                draggables.forEach(item => {
                    item.classList.add('snap-back');
                    item.setAttribute('style', item.dataset.initialStyle);
                    setTimeout(() => {
                        item.classList.remove('snap-back');
                    }, 600);
                });
            }
        };

        resetTab.addEventListener('pointerup', resetDragEnd);
        resetTab.addEventListener('pointercancel', resetDragEnd);
    }

    const contactScene = document.querySelector('.contact-notebook-scene');
    const contactNotebook = contactScene?.querySelector('.contact-notebook');
    const contactBusinessCard = contactScene?.querySelector('[data-contact-card]');
    const contactResetTab = document.querySelector('[data-contact-reset-tab]');
    const contactCardModal = document.querySelector('[data-contact-card-modal]');
    const contactCardCloseButtons = document.querySelectorAll('[data-contact-card-close]');
    const contactStickers = Array.from(document.querySelectorAll('[data-contact-sticker]'));
    const contactLogoStickers = Array.from(document.querySelectorAll('[data-contact-logo]'));

    if (contactScene && contactNotebook && contactStickers.length > 0) {
        const clearSelectedContactStickers = () => {
            contactStickers.forEach((item) => item.classList.remove('is-selected'));
        };

        const initialContactTopZ = contactStickers.reduce((max, sticker) => {
            return Math.max(max, parseInt(sticker.style.getPropertyValue('--z'), 10) || 1);
        }, 1) + 10;

        let activeContactSticker = null;
        let contactDragType = 'move';
        let contactStartX = 0;
        let contactStartY = 0;
        let contactBaseX = 0;
        let contactBaseY = 0;
        let contactStartRot = 0;
        let contactStartScale = 1;
        let contactRectCenter = { x: 0, y: 0 };
        let contactInitialAngle = 0;
        let contactInitialDistance = 0;
        let topStickerZ = initialContactTopZ;
        let isPullingContactReset = false;
        let contactResetStartX = 0;
        let isPullingBusinessCard = false;
        let contactCardStartY = 0;

        const getContactBounds = () => {
            const viewportPadding = 12;
            return {
                minX: viewportPadding,
                maxX: window.innerWidth - viewportPadding,
                minY: viewportPadding,
                maxY: window.innerHeight - viewportPadding
            };
        };

        const clampContactStickerToBounds = (sticker) => {
            const bounds = getContactBounds();
            const rect = sticker.getBoundingClientRect();
            const halfWidth = rect.width / 2;
            const halfHeight = rect.height / 2;
            const centerX = rect.left + halfWidth;
            const centerY = rect.top + halfHeight;
            const nextCenterX = Math.min(Math.max(centerX, bounds.minX + halfWidth), bounds.maxX - halfWidth);
            const nextCenterY = Math.min(Math.max(centerY, bounds.minY + halfHeight), bounds.maxY - halfHeight);
            const deltaX = nextCenterX - centerX;
            const deltaY = nextCenterY - centerY;

            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                const style = window.getComputedStyle(sticker);
                const currentDragX = parseFloat(style.getPropertyValue('--drag-x')) || 0;
                const currentDragY = parseFloat(style.getPropertyValue('--drag-y')) || 0;
                sticker.style.setProperty('--drag-x', `${currentDragX + deltaX}px`);
                sticker.style.setProperty('--drag-y', `${currentDragY + deltaY}px`);
            }
        };

        const markContactStickerTouched = (sticker) => {
            if (sticker) {
                sticker.dataset.touched = 'true';
            }
        };

        const applyContactLogoRotations = () => {
            const fixedRotations = [10, -10, 5, -5, 3];
            contactLogoStickers.forEach((sticker, index) => {
                const rotation = fixedRotations[index] ?? 0;
                sticker.style.setProperty('--rot', `${rotation}deg`);
            });
        };

        const resetContactStickers = () => {
            clearSelectedContactStickers();
            topStickerZ = initialContactTopZ;
            contactStickers.forEach((sticker) => {
                sticker.classList.add('snap-back');
                sticker.setAttribute('style', sticker.dataset.initialStyle);
                window.setTimeout(() => {
                    sticker.classList.remove('snap-back');
                }, 600);
            });
            applyContactLogoRotations();
        };

        const openContactCardModal = () => {
            if (!contactCardModal) return;
            contactCardModal.hidden = false;
            contactCardModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const closeContactCardModal = () => {
            if (!contactCardModal) return;
            contactCardModal.hidden = true;
            contactCardModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        const contactDragMove = (event) => {
            if (!activeContactSticker) return;

            if (contactDragType === 'move') {
                const nextX = event.clientX - contactStartX + contactBaseX;
                const nextY = event.clientY - contactStartY + contactBaseY;
                activeContactSticker.style.setProperty('--drag-x', `${nextX}px`);
                activeContactSticker.style.setProperty('--drag-y', `${nextY}px`);
                markContactStickerTouched(activeContactSticker);
                clampContactStickerToBounds(activeContactSticker);
            } else if (contactDragType === 'rotate') {
                const currentAngle = Math.atan2(event.clientY - contactRectCenter.y, event.clientX - contactRectCenter.x) * (180 / Math.PI);
                const deltaAngle = currentAngle - contactInitialAngle;
                activeContactSticker.style.setProperty('--rot', `${contactStartRot + deltaAngle}deg`);
                markContactStickerTouched(activeContactSticker);
                clampContactStickerToBounds(activeContactSticker);
            } else if (contactDragType === 'scale') {
                const currentDistance = Math.hypot(event.clientX - contactRectCenter.x, event.clientY - contactRectCenter.y);
                const scaleFactor = contactInitialDistance > 0 ? (currentDistance / contactInitialDistance) : 1;
                const nextScale = Math.max(0.45, Math.min(contactStartScale * scaleFactor, 4));
                activeContactSticker.style.setProperty('--scale', nextScale);
                markContactStickerTouched(activeContactSticker);
                clampContactStickerToBounds(activeContactSticker);
            }
        };

        const contactDragEnd = (event) => {
            if (!activeContactSticker) return;

            activeContactSticker.classList.remove('dragging');

            try {
                activeContactSticker.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore release errors when pointer capture is already gone.
            }

            activeContactSticker.removeEventListener('pointermove', contactDragMove);
            activeContactSticker.removeEventListener('pointerup', contactDragEnd);
            activeContactSticker.removeEventListener('pointercancel', contactDragEnd);
            clampContactStickerToBounds(activeContactSticker);
            activeContactSticker = null;
        };

        applyContactLogoRotations();

        contactStickers.forEach((sticker) => {
            sticker.addEventListener('dragstart', (event) => event.preventDefault());
            sticker.dataset.initialStyle = sticker.getAttribute('style') || '';

            sticker.addEventListener('pointerdown', (event) => {
                if (event.button !== undefined && event.button !== 0) return;

                event.preventDefault();
                event.stopPropagation();

                clearSelectedContactStickers();
                sticker.classList.add('is-selected');

                if (event.target.closest('.gui-layer-up')) {
                    topStickerZ += 1;
                    sticker.style.zIndex = topStickerZ;
                    return;
                }

                if (event.target.closest('.gui-layer-down')) {
                    const currentZ = parseInt(window.getComputedStyle(sticker).zIndex, 10) || 3;
                    sticker.style.zIndex = Math.max(0, currentZ - 1);
                    return;
                }

                activeContactSticker = sticker;
                contactDragType = event.target.closest('.gui-rotate') ? 'rotate' : event.target.closest('.gui-scale') ? 'scale' : 'move';
                contactStartX = event.clientX;
                contactStartY = event.clientY;

                const style = window.getComputedStyle(sticker);
                contactBaseX = parseFloat(style.getPropertyValue('--drag-x')) || 0;
                contactBaseY = parseFloat(style.getPropertyValue('--drag-y')) || 0;
                contactStartRot = parseFloat(style.getPropertyValue('--rot')) || 0;
                contactStartScale = parseFloat(style.getPropertyValue('--scale')) || 1;

                if (contactDragType === 'rotate' || contactDragType === 'scale') {
                    const rect = sticker.getBoundingClientRect();
                    contactRectCenter = { x: rect.left + (rect.width / 2), y: rect.top + (rect.height / 2) };
                    if (contactDragType === 'rotate') {
                        contactInitialAngle = Math.atan2(event.clientY - contactRectCenter.y, event.clientX - contactRectCenter.x) * (180 / Math.PI);
                    } else {
                        contactInitialDistance = Math.hypot(event.clientX - contactRectCenter.x, event.clientY - contactRectCenter.y);
                    }
                }

                topStickerZ += 1;
                sticker.style.zIndex = topStickerZ;
                sticker.classList.add('dragging');
                sticker.setPointerCapture(event.pointerId);
                sticker.addEventListener('pointermove', contactDragMove);
                sticker.addEventListener('pointerup', contactDragEnd);
                sticker.addEventListener('pointercancel', contactDragEnd);
            });
        });

        document.addEventListener('pointerdown', (event) => {
            if (!event.target.closest('[data-contact-sticker]')) {
                clearSelectedContactStickers();
            }
        });

        if (contactResetTab) {
            contactResetTab.addEventListener('pointerdown', (event) => {
                isPullingContactReset = true;
                contactResetStartX = event.clientX;
                contactResetTab.style.transition = 'none';
                contactResetTab.setPointerCapture(event.pointerId);
                event.preventDefault();
                event.stopPropagation();
            });

            contactResetTab.addEventListener('pointermove', (event) => {
                if (!isPullingContactReset) return;
                const dx = Math.max(0, event.clientX - contactResetStartX);
                const pullDistance = Math.min(dx, 90);
                contactResetTab.style.setProperty('--pull-x', `${pullDistance}px`);
            });

            const endContactResetPull = (event) => {
                if (!isPullingContactReset) return;
                isPullingContactReset = false;

                try {
                    contactResetTab.releasePointerCapture(event.pointerId);
                } catch {
                    // Ignore release errors when pointer capture is already gone.
                }

                const dx = Math.max(0, event.clientX - contactResetStartX);
                contactResetTab.style.transition = 'width 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
                contactResetTab.style.setProperty('--pull-x', '0px');

                if (dx > 62) {
                    resetContactStickers();
                }
            };

            contactResetTab.addEventListener('pointerup', endContactResetPull);
            contactResetTab.addEventListener('pointercancel', endContactResetPull);
        }

        if (contactBusinessCard) {
            contactBusinessCard.addEventListener('pointerdown', (event) => {
                if (event.button !== undefined && event.button !== 0) return;
                isPullingBusinessCard = true;
                contactCardStartY = event.clientY;
                contactBusinessCard.style.transition = 'none';
                contactBusinessCard.setPointerCapture(event.pointerId);
                event.preventDefault();
                event.stopPropagation();
            });

            contactBusinessCard.addEventListener('pointermove', (event) => {
                if (!isPullingBusinessCard) return;
                const dy = Math.max(0, event.clientY - contactCardStartY);
                const pullDistance = Math.min(dy, 140);
                contactBusinessCard.style.setProperty('--card-pull-y', `${pullDistance}px`);
            });

            const endBusinessCardPull = (event) => {
                if (!isPullingBusinessCard) return;
                isPullingBusinessCard = false;

                try {
                    contactBusinessCard.releasePointerCapture(event.pointerId);
                } catch {
                    // Ignore release errors when pointer capture is already gone.
                }

                const dy = Math.max(0, event.clientY - contactCardStartY);
                contactBusinessCard.style.transition = 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease, filter 0.22s ease';
                contactBusinessCard.style.setProperty('--card-pull-y', '0px');

                if (dy > 70) {
                    openContactCardModal();
                }
            };

            contactBusinessCard.addEventListener('pointerup', endBusinessCardPull);
            contactBusinessCard.addEventListener('pointercancel', endBusinessCardPull);
        }

        contactCardCloseButtons.forEach((button) => {
            button.addEventListener('click', closeContactCardModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && contactCardModal && !contactCardModal.hidden) {
                closeContactCardModal();
            }
        });

        const normalizeContactStickers = () => {
            contactStickers.forEach((sticker) => {
                if (sticker.dataset.touched === 'true') {
                    clampContactStickerToBounds(sticker);
                }
            });
        };

        window.addEventListener('resize', normalizeContactStickers);

        const meowSticker = document.querySelector('[data-meow-sticker]');
        const flowerSticker = document.querySelector('.contact-sticker--flower');
        const flowerStickerHitbox = flowerSticker?.querySelector('.contact-sticker-hitbox');
        const ladybugSticker = document.querySelector('.contact-sticker--ladybug');

        let contactAccentAudioContext = null;
        let lastFlowerAt = 0;
        let lastLadybugAt = 0;

        const getContactAccentContext = async () => {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                return null;
            }

            if (!contactAccentAudioContext) {
                contactAccentAudioContext = new AudioContextClass();
            }

            if (contactAccentAudioContext.state === 'suspended') {
                try {
                    await contactAccentAudioContext.resume();
                } catch {
                    return null;
                }
            }

            return contactAccentAudioContext;
        };

        const playFlowerSynth = async () => {
            const nowPerf = window.performance.now();
            if (nowPerf - lastFlowerAt < 850) return;
            lastFlowerAt = nowPerf;

            const ctx = await getContactAccentContext();
            if (!ctx) return;

            const start = ctx.currentTime;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.05, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
            gain.connect(ctx.destination);

            const bloom = ctx.createOscillator();
            bloom.type = 'triangle';
            bloom.frequency.setValueAtTime(520, start);
            bloom.frequency.exponentialRampToValueAtTime(780, start + 0.18);
            bloom.frequency.exponentialRampToValueAtTime(620, start + 0.45);
            bloom.connect(gain);

            const shimmer = ctx.createOscillator();
            shimmer.type = 'sine';
            shimmer.frequency.setValueAtTime(1040, start + 0.04);
            shimmer.frequency.exponentialRampToValueAtTime(1560, start + 0.22);
            const shimmerGain = ctx.createGain();
            shimmerGain.gain.setValueAtTime(0.0001, start);
            shimmerGain.gain.exponentialRampToValueAtTime(0.018, start + 0.04);
            shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
            shimmer.connect(shimmerGain);
            shimmerGain.connect(ctx.destination);

            bloom.start(start);
            shimmer.start(start + 0.02);
            bloom.stop(start + 0.55);
            shimmer.stop(start + 0.34);
        };

        const playLadybugSynth = async () => {
            const nowPerf = window.performance.now();
            if (nowPerf - lastLadybugAt < 700) return;
            lastLadybugAt = nowPerf;

            const ctx = await getContactAccentContext();
            if (!ctx) return;

            const start = ctx.currentTime;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.028, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
            gain.connect(ctx.destination);

            const blip = ctx.createOscillator();
            blip.type = 'square';
            blip.frequency.setValueAtTime(860, start);
            blip.frequency.exponentialRampToValueAtTime(640, start + 0.08);
            blip.frequency.exponentialRampToValueAtTime(720, start + 0.16);
            blip.connect(gain);
            blip.start(start);
            blip.stop(start + 0.18);
        };

        if (meowSticker) {
            let audioContext = null;
            let lastMeowAt = 0;

            const playMeow = async () => {
                const now = window.performance.now();
                if (now - lastMeowAt < 900) {
                    return;
                }
                lastMeowAt = now;

                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) {
                    return;
                }

                if (!audioContext) {
                    audioContext = new AudioContextClass();
                }

                if (audioContext.state === 'suspended') {
                    try {
                        await audioContext.resume();
                    } catch {
                        return;
                    }
                }

                const start = audioContext.currentTime;
                const gain = audioContext.createGain();
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
                gain.connect(audioContext.destination);

                const oscA = audioContext.createOscillator();
                oscA.type = 'sawtooth';
                oscA.frequency.setValueAtTime(620, start);
                oscA.frequency.exponentialRampToValueAtTime(380, start + 0.14);
                oscA.frequency.exponentialRampToValueAtTime(290, start + 0.32);
                oscA.connect(gain);

                const oscB = audioContext.createOscillator();
                oscB.type = 'triangle';
                oscB.frequency.setValueAtTime(820, start);
                oscB.frequency.exponentialRampToValueAtTime(470, start + 0.12);
                oscB.frequency.exponentialRampToValueAtTime(320, start + 0.3);
                oscB.connect(gain);

                oscA.start(start);
                oscB.start(start);
                oscA.stop(start + 0.42);
                oscB.stop(start + 0.42);
            };

            meowSticker.addEventListener('pointerenter', () => {
                void playMeow();
            });
            meowSticker.addEventListener('pointerdown', () => {
                void playMeow();
            });
        }

        if (flowerStickerHitbox) {
            flowerStickerHitbox.addEventListener('pointerenter', () => {
                void playFlowerSynth();
            });
            flowerStickerHitbox.addEventListener('pointerdown', () => {
                void playFlowerSynth();
            });
        }

        if (ladybugSticker) {
            ladybugSticker.addEventListener('pointerenter', () => {
                void playLadybugSynth();
            });
            ladybugSticker.addEventListener('pointerdown', () => {
                void playLadybugSynth();
            });
        }
    }

    const rotatingWordWrap = document.querySelector('[data-rotating-word-wrap]');
    const rotatingWordCurrent = document.querySelector('[data-rotating-word-current]');
    const rotatingWordNext = document.querySelector('[data-rotating-word-next]');
    const rotatingWordSizer = document.querySelector('[data-rotating-word-sizer]');

    if (rotatingWordWrap && rotatingWordCurrent && rotatingWordNext && rotatingWordSizer) {
        const wordPairs = [
            { word: 'fun', iconType: 'emoji', iconValue: '🥳' },
            { word: 'meaningful', iconType: 'image', iconValue: 'Assets/the thinker.png' },
            { word: 'poetic', iconType: 'emoji', iconValue: '🌌' },
            { word: 'exciting', iconType: 'emoji', iconValue: '🚀' },
            { word: 'magical', iconType: 'emoji', iconValue: '🪄' }
        ];
        let wordIndex = 0;
        const holdDuration = 2000;
        const slideDuration = 640;

        const renderWordPair = (element, { word, iconType, iconValue }) => {
            const label = document.createElement('span');
            label.className = 'about-rotating-word-label';
            label.textContent = word;

            let icon;
            if (iconType === 'image') {
                icon = document.createElement('img');
                icon.className = 'about-rotating-word-icon about-rotating-word-icon--image';
                icon.src = iconValue;
                icon.alt = '';
                icon.decoding = 'async';
            } else {
                icon = document.createElement('span');
                icon.className = 'about-rotating-word-icon';
                icon.textContent = iconValue;
            }

            element.replaceChildren(label, icon);
        };

        const lockSlotWidth = () => {
            let widest = 0;
            wordPairs.forEach((pair) => {
                renderWordPair(rotatingWordSizer, pair);
                widest = Math.max(widest, rotatingWordSizer.getBoundingClientRect().width);
            });
            rotatingWordWrap.style.width = `${Math.ceil(widest)}px`;
            renderWordPair(rotatingWordSizer, wordPairs[wordIndex]);
        };

        const runWordCycle = () => {
            const nextIndex = (wordIndex + 1) % wordPairs.length;
            const nextWord = wordPairs[nextIndex];

            renderWordPair(rotatingWordNext, nextWord);
            rotatingWordWrap.classList.remove('is-sliding');
            void rotatingWordWrap.offsetWidth;
            rotatingWordWrap.classList.add('is-sliding');

            window.setTimeout(() => {
                wordIndex = nextIndex;
                renderWordPair(rotatingWordCurrent, nextWord);
                renderWordPair(rotatingWordNext, wordPairs[(wordIndex + 1) % wordPairs.length]);
                rotatingWordWrap.classList.remove('is-sliding');
                window.setTimeout(runWordCycle, holdDuration);
            }, slideDuration);
        };

        renderWordPair(rotatingWordCurrent, wordPairs[wordIndex]);
        renderWordPair(rotatingWordNext, wordPairs[(wordIndex + 1) % wordPairs.length]);
        lockSlotWidth();
        window.setTimeout(runWordCycle, holdDuration);
    }

    const aboutTldrButton = document.querySelector('[data-about-tldr]');
    const aboutCopy = document.querySelector('[data-about-copy]');

    if (aboutTldrButton && aboutCopy) {
        aboutTldrButton.addEventListener('click', () => {
            const isActive = aboutTldrButton.getAttribute('aria-pressed') === 'true';
            aboutTldrButton.setAttribute('aria-pressed', String(!isActive));
            aboutCopy.classList.toggle('is-tldr', !isActive);
        });
    }

    const aboutSection = document.querySelector('#about');
    const aboutGlitchTitle = document.querySelector('[data-about-glitch-text]');

    if (aboutSection && 'IntersectionObserver' in window) {
        const aboutSoundObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (!entry) return;

            isAboutSectionVisible = entry.isIntersecting && entry.intersectionRatio > 0.18;

            if (!isAboutSectionVisible) {
                stopGlitchTransition();
            }
        }, {
            threshold: [0, 0.18, 0.35]
        });

        aboutSoundObserver.observe(aboutSection);
    }

    if (aboutGlitchTitle) {
        const aboutGlitchTitleBottom = aboutGlitchTitle.querySelector('.about-glitch-title__bottom');
        const aboutGlitchTitleLabel = aboutGlitchTitle.querySelector('.about-glitch-title__label');
        const titleWords = ['Neelanzone', 'Neel', 'Nilanjan'];
        let titleIndex = 0;

        window.setInterval(() => {
            aboutGlitchTitle.classList.remove('is-glitching');
            void aboutGlitchTitle.offsetWidth;
            aboutGlitchTitle.classList.add('is-glitching');

            window.setTimeout(() => {
                titleIndex = (titleIndex + 1) % titleWords.length;
                const nextTitle = titleWords[titleIndex];
                if (aboutGlitchTitleLabel) {
                    aboutGlitchTitleLabel.textContent = nextTitle;
                }
                if (aboutGlitchTitleBottom) {
                    aboutGlitchTitleBottom.textContent = nextTitle;
                }
                aboutGlitchTitle.setAttribute('data-text', nextTitle);
            }, 190);

            window.setTimeout(() => {
                playGlitchTransition();
            }, 0);

            window.setTimeout(() => {
                aboutGlitchTitle.classList.remove('is-glitching');
            }, 430);
        }, 2000);
    }

    // Smooth Scroll Override for Sticky Nav Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') {
                e.preventDefault();
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();

                const getStaticTop = (element) => {
                    let staticTop = 0;
                    let current = element;

                    while (current) {
                        staticTop += current.offsetTop;
                        current = current.offsetParent;
                    }

                    return staticTop;
                };

                const workSection = document.getElementById('work');
                let destinationTop = getStaticTop(targetElement);
                let offset = parseFloat(window.getComputedStyle(targetElement).scrollMarginTop) || 0;

                if (targetId === '#work-anchor' && workSection) {
                    destinationTop = getStaticTop(workSection);
                    offset = parseFloat(window.getComputedStyle(workSection).top) || 0;
                } else if (targetId === '#about') {
                    offset -= window.innerHeight * 0.12 - 12;
                }

                if (window.history?.replaceState) {
                    window.history.replaceState(null, '', targetId);
                }

                window.scrollTo({
                    top: Math.max(0, destinationTop - offset),
                    behavior: 'smooth'
                });
            }
        });
    });

});








