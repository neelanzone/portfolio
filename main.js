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

    const trackedImages = Array.from(document.images).filter((img) => !img.classList.contains('logo-hover') && img.getAttribute('loading') !== 'lazy');
    const progressState = {
        target: 0.08,
        current: 0.08,
        completed: 0,
        total: trackedImages.length + 2,
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

    trackedImages.forEach((img) => {
        if (img.complete) {
            markComplete();
            return;
        }

        const onDone = () => {
            markComplete();
            img.removeEventListener('load', onDone);
            img.removeEventListener('error', onDone);
        };

        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
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

                // Do not alter the base starfield for light mode per user request
                this.baseColors.push(new THREE.Color(r, g, b));

                i += 3;
                cIndex += 3;
            }
        }

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
            opacity: 0.6, // 60% visibility for dark mode
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
            this.points.material.opacity = isLight ? 0.3 : 0.6;
            this.points.material.needsUpdate = true;
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
                touchState.isHorizontalDrag = false;
                touchState.hasMoved = false;
                touchState.hasClaimedTap = true;
            }, { passive: true });

            this.container.addEventListener('pointermove', (e) => {
                if ((e.pointerType !== 'touch' && e.pointerType !== 'pen') || touchState.pointerId !== e.pointerId) {
                    return;
                }

                const dx = e.clientX - touchState.startX;
                const dy = e.clientY - touchState.startY;

                if (!touchState.hasMoved && Math.hypot(dx, dy) > 6) {
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

                if (!touchState.isHorizontalDrag && !touchState.hasMoved && touchState.hasClaimedTap) {
                    e.preventDefault();
                    updatePointerTarget(e.clientX, e.clientY, true);
                    triggerPulse();
                }

                clearPointerTarget();
                touchState.pointerId = null;
                touchState.isHorizontalDrag = false;
                touchState.hasMoved = false;
                touchState.hasClaimedTap = false;
            };

            this.container.addEventListener('pointerup', finishTouchInteraction, { passive: false });
            this.container.addEventListener('pointercancel', finishTouchInteraction, { passive: true });
        }

        const navbar = document.querySelector('.navbar');
        const workSection = document.getElementById('work');
        const aboutSection = document.getElementById('about');
        const contactSection = document.getElementById('contact');

        const updateScrollEffects = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;

            document.body.style.setProperty('--scroll-progress', scrollProgress.toString());

            if (navbar && workSection) {
                const workTop = workSection.offsetTop;
                const fadeStart = Math.max(0, workTop - 600);
                const fadeEnd = workTop - 100;

                let navBgOpacity = 0;
                if (scrollTop >= fadeEnd) {
                    navBgOpacity = 1.0;
                } else if (scrollTop > fadeStart) {
                    const progress = (scrollTop - fadeStart) / (fadeEnd - fadeStart);
                    navBgOpacity = progress;
                }

                navbar.style.setProperty('--nav-bg-opacity', navBgOpacity.toString());
            }

            if (navbar) {
                const navHeight = navbar.offsetHeight;
                const isGlobalLightTheme = document.documentElement.classList.contains('light-theme');
                const aboutRect = aboutSection ? aboutSection.getBoundingClientRect() : null;
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
        updateScrollEffects();
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
    document.querySelectorAll('.section-title, .about-text, .contact-container').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
        revealObserver.observe(el);
    });

    // 3D Tilt Effect for Work Cards (Applied to Inner Image Wrapper)
    const workCards = Array.from(document.querySelectorAll('.work-card'));

    const applyWorkCardTilt = (card, clientX, clientY, scale = 1.02) => {
        const imgContainer = card?.querySelector('.work-image');
        if (!imgContainer) return;

        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxTilt = 10;
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;
        const mouseX = (x / rect.width) * 100;
        const mouseY = (y / rect.height) * 100;

        imgContainer.style.transition = 'transform 0.1s cubic-bezier(0.19, 1, 0.22, 1)';
        imgContainer.style.willChange = 'transform';
        imgContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
        imgContainer.style.setProperty('--mouse-x', `${mouseX}%`);
        imgContainer.style.setProperty('--mouse-y', `${mouseY}%`);
    };

    const resetWorkCardTilt = (card) => {
        const imgContainer = card?.querySelector('.work-image');
        if (!imgContainer) return;

        imgContainer.style.transition = 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
        imgContainer.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

        setTimeout(() => {
            imgContainer.style.willChange = 'auto';
        }, 600);
    };

    const clearWorkCardTilts = () => {
        workCards.forEach((card) => resetWorkCardTilt(card));
    };

    const hoverTiltQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    workCards.forEach(card => {
        const imgContainer = card.querySelector('.work-image');
        if (!imgContainer) return;

        card.addEventListener('mouseenter', () => {
            if (!hoverTiltQuery.matches) return;
            imgContainer.style.transition = 'transform 0.1s cubic-bezier(0.19, 1, 0.22, 1)';
            imgContainer.style.willChange = 'transform';
        });

        card.addEventListener('mousemove', (e) => {
            if (!hoverTiltQuery.matches) return;
            applyWorkCardTilt(card, e.clientX, e.clientY, 1.02);
        });

        card.addEventListener('mouseleave', () => {
            if (!hoverTiltQuery.matches) return;
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

        const updateCarouselGeometry = (force = false) => {
            const sampleCard = cards[0];
            const cardWidth = sampleCard ? sampleCard.getBoundingClientRect().width || 320 : 320;
            const isMobileViewport = window.innerWidth <= 768;

            if (!force && isMobileViewport && Math.abs(cardWidth - lastMeasuredCardWidth) < 1 && Math.abs(window.innerWidth - lastViewportWidth) < 1) {
                return;
            }

            lastMeasuredCardWidth = cardWidth;
            lastViewportWidth = window.innerWidth;

            const baseRadius = Math.round((cardWidth / 2) / Math.tan(Math.PI / numCards));
            const depthPadding = isMobileViewport ? Math.max(96, cardWidth * 0.62) : Math.max(24, cardWidth * 0.16);
            const minMobileRadius = Math.max(280, cardWidth * 1.35);
            radius = isMobileViewport ? Math.max(baseRadius + depthPadding, minMobileRadius) : baseRadius + depthPadding;

            cards.forEach((card, index) => {
                const angle = theta * index;
                card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
                card.dataset.angle = angle;
            });
        };

        // Initialize card positions and attach reliable click listeners
        cards.forEach((card, index) => {
            const angle = theta * index;
            card.dataset.angle = angle;

            // Native click listener to rigidly snap to this specific card
            card.addEventListener('click', () => {
                if (window.innerWidth <= 768) return;
                // Ignore clicks if the user was actually dragging across the card
                if (Math.abs(currentXCarousel - startXCarousel) > 5) return;

                targetRotation = -angle;
                // No clamping, allow free rotation
            });
        });

        updateCarouselGeometry(true);
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

        const getFrontCard = () => cards.reduce((closestCard, card) => {
            if (!card.querySelector('.work-image')) return closestCard;
            if (!closestCard) return card;

            const cardAngle = parseFloat(card.dataset.angle) || 0;
            const closestAngle = parseFloat(closestCard.dataset.angle) || 0;
            const currentDistance = Math.abs(normalizeAngle(cardAngle + currentRotation));
            const closestDistance = Math.abs(normalizeAngle(closestAngle + currentRotation));
            return currentDistance < closestDistance ? card : closestCard;
        }, null);

        const syncActiveFrontCard = () => {
            if (window.innerWidth > 768) {
                if (activeFrontCard) {
                    activeFrontCard.classList.remove('is-active');
                    activeFrontCard = null;
                }
                return;
            }

            const nextActiveCard = getFrontCard();
            if (activeFrontCard && activeFrontCard !== nextActiveCard) {
                activeFrontCard.classList.remove('is-active');
            }
            if (nextActiveCard) {
                nextActiveCard.classList.add('is-active');
            }
            activeFrontCard = nextActiveCard;
        };
        
        // Animation loop for smooth easing
        function animateCarousel() {
            if (!isCarouselAnimating) {
                return;
            }

            currentRotation += (targetRotation - currentRotation) * 0.1;
            carouselTrack.style.transform = `translateZ(-${radius}px) rotateY(${currentRotation}deg)`;
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

        // Keyboard navigation
        carouselContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                targetRotation += theta;
                targetRotation = Math.round(targetRotation / theta) * theta;
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                targetRotation -= theta;
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
            
            const dragSensitivity = dragPointerType === 'touch' ? 0.28 : 0.15;
            targetRotation += dx * dragSensitivity;
        });

        window.addEventListener('pointerup', (e) => {
            if (!isDraggingCarousel) return;
            isDraggingCarousel = false;
            carouselContainer.style.cursor = 'grab';
            
            const totalDrag = e.clientX - startXCarousel;
            const startSnapIndex = Math.round(dragStartRotation / theta);
            const touchSwipeThreshold = Math.min(72, window.innerWidth * 0.09);


            if (dragPointerType === 'touch' && Math.abs(totalDrag) > touchSwipeThreshold) {
                const direction = totalDrag < 0 ? -1 : 1;
                targetRotation = (startSnapIndex + direction) * theta;
            } else {
                const snapIndex = Math.round(targetRotation / theta);
                targetRotation = snapIndex * theta;
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

    // Theme Toggle Logic
    const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');
    const menuToggleButton = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    const closeMobileMenu = () => {
        if (!menuToggleButton || !mobileMenu) return;
        menuToggleButton.classList.remove('is-open');
        menuToggleButton.setAttribute('aria-expanded', 'false');
        menuToggleButton.setAttribute('aria-label', 'Open navigation menu');
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
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
    }

    themeToggleButtons.forEach((themeToggleBtn) => {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.documentElement.classList.toggle('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            webgl?.applyTheme(isLight);
        });
    });

    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', toggleMobileMenu);
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
            const dy = Math.max(0, e.clientY - pullStartY); // Only allow pulling down
            // Limit max pull distance to create tension - Increased for longer text
            const pullDist = Math.min(dy, 120);
            resetTab.style.setProperty('--pull-y', `${pullDist}px`);
        });

        const resetDragEnd = (e) => {
            if (!isPulling) return;
            isPulling = false;
            resetTab.releasePointerCapture(e.pointerId);
            
            const dy = Math.max(0, e.clientY - pullStartY);
            
            // Animate snap back up
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

                // For sticky elements covered by z-index overlap, getBoundingClientRect() and native scrolling fail.
                // We calculate offsetTop accumulation to retrieve the pristine static page coordinate instead.
                let staticTop = 0;
                let cur = targetElement;
                while (cur) {
                    staticTop += cur.offsetTop;
                    cur = cur.offsetParent;
                }

                let offset = 0;
                if (targetId === '#work') {
                    offset = window.innerHeight * 0.1;
                }

                if (window.history?.replaceState) {
                    window.history.replaceState(null, '', targetId);
                }

                window.scrollTo({
                    top: staticTop - offset,
                    behavior: 'smooth'
                });
            }
        });
    });

});
