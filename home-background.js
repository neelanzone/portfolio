(function () {
    class HomeBackgroundScene {
        constructor(container) {
            this.container = container;
            this.root = document.documentElement;
            this.prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.prefersReducedMotion = this.prefersReducedMotionQuery.matches;
            this.pointer = new THREE.Vector2(2.5, 2.5);
            this.pointerTarget = new THREE.Vector2(2.5, 2.5);
            this.hoverPoint = new THREE.Vector3(9999, 9999, 9999);
            this.hoverWorldPoint = new THREE.Vector3(9999, 9999, 9999);
            this.sphereCenter = new THREE.Vector3(0, 0, 0);
            this.sphereCenterTarget = new THREE.Vector3(0, 0, 0);
            this.hasPointer = false;
            this.activeTouchPointerId = null;
            this.touchTapStartX = 0;
            this.touchTapStartY = 0;
            this.touchTapTravel = 0;
            this.suppressClickUntil = 0;
            this.scroll = 0;
            this.scrollTarget = 0;
            this.isVisible = !document.hidden;
            this.rafId = 0;
            this.lastFrameTime = null;
            this.themeObserver = null;
            this.activePalette = null;
            this.sphereStage = 0;
            this.sphereVisible = 0;
            this.sphereSizePreset = 'small';
            this.sphereRadius = 0.5;
            this.sphereInfluenceRadius = 1.5;
            this.sphereSizeKnob = null;
            this.sphereSizeValue = null;
            this.burstActive = false;
            this.burstProgress = 0;
            this.burstDuration = 1.85;
            this.burstOrigin = new THREE.Vector3(0, 0, 0);
            this.tempColorA = new THREE.Color();
            this.tempColorB = new THREE.Color();
            this.tempColorC = new THREE.Color();
            this.pointerProjectNdc = new THREE.Vector2();
            this.pointerProjectPoint = new THREE.Vector3();

            this.animate = this.animate.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.handlePointerDown = this.handlePointerDown.bind(this);
            this.handlePointerMove = this.handlePointerMove.bind(this);
            this.handlePointerUp = this.handlePointerUp.bind(this);
            this.handlePointerCancel = this.handlePointerCancel.bind(this);
            this.handlePointerLeave = this.handlePointerLeave.bind(this);
            this.handleResize = this.handleResize.bind(this);
            this.handleScroll = this.handleScroll.bind(this);
            this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
            this.handleReducedMotionChange = this.handleReducedMotionChange.bind(this);

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 220);
            this.cameraBaseY = 8.5;
            this.cameraTravelY = -4.5;
            this.cameraBaseZ = 22;
            this.cameraTravelZ = -3.75;
            this.cameraLookY = 0;
            this.cameraLookTravelY = -1.35;
            this.camera.position.set(0, this.cameraBaseY, this.cameraBaseZ);
            this.camera.lookAt(0, this.cameraLookY, 0);

            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0x000000, 0);
            this.container.appendChild(this.renderer.domElement);

            this.raycaster = new THREE.Raycaster();
            this.gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            this.gridTiltX = 70;
            this.gridScale = 1.2;
            this.gridEntropy = 0;
            this.gridDensity = 1;
            this.gridDensityPreset = 'lots';
            this.densityKnob = null;
            this.densityValue = null;
            this.densityKnobDisplayAngle = 135;
            this.murmurationStyle = 'none';
            this.murmurationButtons = [];
            this.murmurationTone = 'default';
            this.murmurationToneButton = null;
            this.isControlDragActive = false;
            this.sceneOnlyView = false;
            this.flockLeaderIndices = [];
            this.flockLeaderOrigins = [];
            this.flockLeaderPhases = [0];
            this.root.removeAttribute('data-home-tone');
            this.sphereKnobDisplayAngle = 315;

            this.backgroundGroup = new THREE.Group();
            this.scene.add(this.backgroundGroup);

            this.gridGroup = new THREE.Group();
            this.scene.add(this.gridGroup);

            this.interactionGroup = new THREE.Group();
            this.gridGroup.add(this.interactionGroup);

            this.starTexture = this.createPointTexture({
                size: 80,
                stops: [
                    [0, 'rgba(255, 255, 255, 1)'],
                    [0.2, 'rgba(255, 255, 255, 0.98)'],
                    [0.52, 'rgba(255, 255, 255, 0.16)'],
                    [1, 'rgba(255, 255, 255, 0)']
                ]
            });
            this.dustTexture = this.createPointTexture({
                size: 144,
                stops: [
                    [0, 'rgba(255, 255, 255, 0.8)'],
                    [0.16, 'rgba(255, 255, 255, 0.62)'],
                    [0.58, 'rgba(255, 255, 255, 0.08)'],
                    [1, 'rgba(255, 255, 255, 0)']
                ]
            });
            this.pixelShadowTexture = this.createPointTexture({
                size: 72,
                stops: [
                    [0, 'rgba(255, 255, 255, 0.52)'],
                    [0.34, 'rgba(255, 255, 255, 0.28)'],
                    [0.68, 'rgba(255, 255, 255, 0.08)'],
                    [1, 'rgba(255, 255, 255, 0)']
                ]
            });

            this.buildBackdrop();
            this.buildPixelGrid();
            this.buildInteractionVisuals();
            this.applyTheme();
            this.addEventListeners();
            this.start();
        }

        createPointTexture(options = {}) {
            const {
                size = 96,
                stops = [
                    [0, 'rgba(255, 255, 255, 1)'],
                    [0.32, 'rgba(255, 255, 255, 0.95)'],
                    [0.65, 'rgba(255, 255, 255, 0.28)'],
                    [1, 'rgba(255, 255, 255, 0)']
                ]
            } = options;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

            canvas.width = size;
            canvas.height = size;

            stops.forEach(([offset, color]) => {
                gradient.addColorStop(offset, color);
            });

            context.fillStyle = gradient;
            context.fillRect(0, 0, size, size);

            return new THREE.CanvasTexture(canvas);
        }

        buildInteractionVisuals() {
            const sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, 18, 18);
            const sphereFillMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const sphereWireMaterial = new THREE.LineBasicMaterial({
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });
            const shockwaveMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });

            this.sphereFill = new THREE.Mesh(sphereGeometry, sphereFillMaterial);
            this.sphereWire = new THREE.LineSegments(new THREE.EdgesGeometry(sphereGeometry), sphereWireMaterial);
            this.sphereFill.visible = false;
            this.sphereWire.visible = false;
            this.interactionGroup.add(this.sphereFill);
            this.interactionGroup.add(this.sphereWire);

            this.shockwaveRing = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 96), shockwaveMaterial);
            this.shockwaveRing.rotation.x = -Math.PI / 2;
            this.shockwaveRing.visible = false;
            this.interactionGroup.add(this.shockwaveRing);
        }

        getThemePalette() {
            const isLight = this.root.classList.contains('light-theme');
            const isMono = this.murmurationTone === 'mono';

            if (isLight) {
                const palette = {
                    fogColor: 0xf2e5d8,
                    fogDensity: 0.019,
                    starOpacity: 0.42,
                    starBlending: THREE.NormalBlending,
                    starPalette: [
                        new THREE.Color(0xfff2d8),
                        new THREE.Color(0x2e63f2),
                        new THREE.Color(0xef4836)
                    ],
                    milkyWayOpacity: 0.18,
                    milkyWayBlending: THREE.NormalBlending,
                    milkyWayPalette: [
                        new THREE.Color(0xffcb58),
                        new THREE.Color(0xf03b2d),
                        new THREE.Color(0x478cff)
                    ],
                    gridOpacity: 0.66,
                    gridBlending: THREE.NormalBlending,
                    gridHueShift: 0.58,
                    gridSaturation: 0.74,
                    gridLightnessBase: 0.6,
                    gridLightnessRange: 0.18,
                    gridAccent: new THREE.Color(0x2f66ff),
                    gridHighlight: new THREE.Color(0xffc349),
                    gridShadowColor: new THREE.Color(0x8b7060),
                    gridShadowOpacity: 0.26,
                    gridMonoAccent: new THREE.Color(0x171717),
                    gridMonoHighlight: new THREE.Color(0x525252)
                };

                if (isMono) {
                    palette.fogColor = 0xffffff;
                    palette.fogDensity = 0.0125;
                    palette.starOpacity = 0.52;
                    palette.starBlending = THREE.NormalBlending;
                    palette.starPalette = [
                        new THREE.Color(0x060606),
                        new THREE.Color(0x6f6f6f),
                        new THREE.Color(0xe5e5e5)
                    ];
                    palette.milkyWayOpacity = 0.24;
                    palette.milkyWayBlending = THREE.NormalBlending;
                    palette.milkyWayPalette = [
                        new THREE.Color(0x080808),
                        new THREE.Color(0x8f8f8f),
                        new THREE.Color(0xe0e0e0)
                    ];
                    palette.gridOpacity = 1;
                    palette.gridBlending = THREE.NormalBlending;
                    palette.gridMonoAccent = new THREE.Color(0x050505);
                    palette.gridMonoHighlight = new THREE.Color(0x5f5f5f);
                    palette.gridAccent = new THREE.Color(0x111111);
                    palette.gridHighlight = new THREE.Color(0x6b6b6b);
                    palette.gridShadowColor = new THREE.Color(0x1a1a1a);
                    palette.gridShadowOpacity = 0.22;
                }

                return palette;
            }

            const palette = {
                fogColor: 0x070d1d,
                fogDensity: 0.014,
                starOpacity: 0.96,
                starBlending: THREE.AdditiveBlending,
                starPalette: [
                    new THREE.Color(0xfff1cf),
                    new THREE.Color(0x2d63ff),
                    new THREE.Color(0xff472b)
                ],
                milkyWayOpacity: 0.38,
                milkyWayBlending: THREE.AdditiveBlending,
                milkyWayPalette: [
                    new THREE.Color(0x1f45ff),
                    new THREE.Color(0xffcf45),
                    new THREE.Color(0xff301f)
                ],
                gridOpacity: 1,
                gridBlending: THREE.AdditiveBlending,
                gridHueShift: 0.59,
                gridSaturation: 0.92,
                gridLightnessBase: 0.48,
                gridLightnessRange: 0.2,
                gridAccent: new THREE.Color(0x2d63ff),
                gridHighlight: new THREE.Color(0xff4a2c),
                gridShadowColor: new THREE.Color(0x010207),
                gridShadowOpacity: 0.46,
                gridMonoAccent: new THREE.Color(0x0d0d0d),
                gridMonoHighlight: new THREE.Color(0x434343)
            };

            if (isMono) {
                palette.fogColor = 0xffffff;
                palette.fogDensity = 0.0125;
                palette.starOpacity = 0.56;
                palette.starBlending = THREE.NormalBlending;
                palette.starPalette = [
                    new THREE.Color(0x060606),
                    new THREE.Color(0x6f6f6f),
                    new THREE.Color(0xe5e5e5)
                ];
                palette.milkyWayOpacity = 0.28;
                palette.milkyWayBlending = THREE.NormalBlending;
                palette.milkyWayPalette = [
                    new THREE.Color(0x080808),
                    new THREE.Color(0x8f8f8f),
                    new THREE.Color(0xe0e0e0)
                ];
                palette.gridOpacity = 1;
                palette.gridBlending = THREE.NormalBlending;
                palette.gridMonoAccent = new THREE.Color(0x050505);
                palette.gridMonoHighlight = new THREE.Color(0x5f5f5f);
                palette.gridAccent = new THREE.Color(0x111111);
                palette.gridHighlight = new THREE.Color(0x6b6b6b);
                palette.gridShadowColor = new THREE.Color(0x1a1a1a);
                palette.gridShadowOpacity = 0.24;
            }

            return palette;
        }

        buildBackdrop() {
            this.buildStarfield();
            this.buildMilkyWay();
        }

        buildStarfield() {
            if (this.starfield) {
                this.backgroundGroup.remove(this.starfield);
                this.starfieldGeometry.dispose();
                this.starfieldMaterial.dispose();
            }

            this.starCount = this.prefersReducedMotion
                ? 480
                : window.innerWidth < 768
                    ? 900
                    : 1800;

            this.starfieldGeometry = new THREE.BufferGeometry();
            this.starPositions = new Float32Array(this.starCount * 3);
            this.starBasePositions = new Float32Array(this.starCount * 3);
            this.starColors = new Float32Array(this.starCount * 3);
            this.starSeeds = new Float32Array(this.starCount * 4);

            for (let index = 0; index < this.starCount; index += 1) {
                const positionIndex = index * 3;
                const seedIndex = index * 4;
                const x = (Math.random() - 0.5) * 92;
                const y = (Math.random() - 0.5) * 58;
                const z = -24 - Math.random() * 96;

                this.starBasePositions[positionIndex] = x;
                this.starBasePositions[positionIndex + 1] = y;
                this.starBasePositions[positionIndex + 2] = z;

                this.starPositions[positionIndex] = x;
                this.starPositions[positionIndex + 1] = y;
                this.starPositions[positionIndex + 2] = z;

                this.starSeeds[seedIndex] = Math.random();
                this.starSeeds[seedIndex + 1] = Math.random();
                this.starSeeds[seedIndex + 2] = Math.random() * Math.PI * 2;
                this.starSeeds[seedIndex + 3] = 0.2 + Math.random() * 0.8;
            }

            this.starfieldGeometry.setAttribute('position', new THREE.BufferAttribute(this.starPositions, 3));
            this.starfieldGeometry.setAttribute('color', new THREE.BufferAttribute(this.starColors, 3));

            this.starfieldMaterial = new THREE.PointsMaterial({
                size: window.innerWidth < 768 ? 0.11 : 0.13,
                map: this.starTexture,
                transparent: true,
                vertexColors: true,
                depthWrite: false,
                sizeAttenuation: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });

            this.starfield = new THREE.Points(this.starfieldGeometry, this.starfieldMaterial);
            this.backgroundGroup.add(this.starfield);
            this.updateStarfield(0);
        }

        buildMilkyWay() {
            if (this.milkyWay) {
                this.backgroundGroup.remove(this.milkyWay);
                this.milkyWayGeometry.dispose();
                this.milkyWayMaterial.dispose();
            }

            this.milkyWayCount = this.prefersReducedMotion
                ? 720
                : window.innerWidth < 768
                    ? 1240
                    : 2300;

            this.milkyWayGeometry = new THREE.BufferGeometry();
            this.milkyWayPositions = new Float32Array(this.milkyWayCount * 3);
            this.milkyWayBasePositions = new Float32Array(this.milkyWayCount * 3);
            this.milkyWayColors = new Float32Array(this.milkyWayCount * 3);
            this.milkyWaySeeds = new Float32Array(this.milkyWayCount * 5);

            for (let index = 0; index < this.milkyWayCount; index += 1) {
                const positionIndex = index * 3;
                const seedIndex = index * 5;
                const along = (Math.random() - 0.5) * 66;
                const spread = this.randomGaussian() * 3.4;
                const x = along * 1.18 + spread * 1.7;
                const y = along * 0.22 - spread * 0.7 + Math.sin(along * 0.14) * 1.25;
                const z = -34 - Math.random() * 22 - Math.abs(spread) * 0.65;

                this.milkyWayBasePositions[positionIndex] = x;
                this.milkyWayBasePositions[positionIndex + 1] = y;
                this.milkyWayBasePositions[positionIndex + 2] = z;

                this.milkyWayPositions[positionIndex] = x;
                this.milkyWayPositions[positionIndex + 1] = y;
                this.milkyWayPositions[positionIndex + 2] = z;

                this.milkyWaySeeds[seedIndex] = along;
                this.milkyWaySeeds[seedIndex + 1] = spread;
                this.milkyWaySeeds[seedIndex + 2] = Math.random() * Math.PI * 2;
                this.milkyWaySeeds[seedIndex + 3] = Math.random();
                this.milkyWaySeeds[seedIndex + 4] = 0.25 + Math.random() * 0.75;
            }

            this.milkyWayGeometry.setAttribute('position', new THREE.BufferAttribute(this.milkyWayPositions, 3));
            this.milkyWayGeometry.setAttribute('color', new THREE.BufferAttribute(this.milkyWayColors, 3));

            this.milkyWayMaterial = new THREE.PointsMaterial({
                size: window.innerWidth < 768 ? 0.22 : 0.28,
                map: this.dustTexture,
                transparent: true,
                vertexColors: true,
                depthWrite: false,
                sizeAttenuation: true,
                opacity: 0.24,
                blending: THREE.AdditiveBlending
            });

            this.milkyWay = new THREE.Points(this.milkyWayGeometry, this.milkyWayMaterial);
            this.milkyWay.rotation.z = -0.38;
            this.milkyWay.rotation.x = -0.16;
            this.backgroundGroup.add(this.milkyWay);
            this.updateMilkyWay(0);
        }

        buildPixelGrid() {
            if (this.shadowGridInstances?.length) {
                this.shadowGridInstances.forEach((instance) => {
                    this.gridGroup.remove(instance);
                });
                this.shadowGridInstances = [];
            }

            if (this.gridInstances?.length) {
                this.gridInstances.forEach((instance) => {
                    this.gridGroup.remove(instance);
                });
                this.gridInstances = [];
            }

            if (this.pixelGridGeometry) {
                this.pixelGridGeometry.dispose();
            }

            if (this.pixelGridMaterial) {
                this.pixelGridMaterial.dispose();
            }

            if (this.pixelShadowMaterial) {
                this.pixelShadowMaterial.dispose();
            }

            const isCompact = window.innerWidth < 768;
            const entropy = THREE.MathUtils.clamp(this.gridEntropy, 0, 3);
            const safeEntropy = Math.max(entropy, 0.08);
            const density = THREE.MathUtils.clamp(this.gridDensity, 0, 1);
            const densityScale = Math.sqrt(density);
            const baseColumns = this.prefersReducedMotion ? (isCompact ? 36 : 64) : (isCompact ? 100 : 300);
            const baseRows = this.prefersReducedMotion ? (isCompact ? 36 : 64) : (isCompact ? 100 : 200);
            this.gridColumns = density <= 0 ? 0 : Math.max(1, Math.round(baseColumns * densityScale));
            this.gridRows = density <= 0 ? 0 : Math.max(1, Math.round(baseRows * densityScale));
            this.gridSpacing = isCompact ? 0.22 : 0.14;
            this.gridStackCount = 1;
            this.gridStackSpacing = isCompact ? 1.45 : 1.75;
            this.gridInteractionRadius = isCompact ? 3.45 : 3.9;
            this.gridLiftStrength = isCompact ? 1.42 : 1.55;
            this.gridPushStrength = isCompact ? 0.165 : 0.18;
            this.gridSpring = (this.prefersReducedMotion ? 0.09 : 0.065) / Math.sqrt(safeEntropy);
            this.gridFriction = THREE.MathUtils.clamp(
                (this.prefersReducedMotion ? 0.9 : 0.94) + (entropy - 1) * 0.045,
                0.82,
                0.985
            );
            this.gridHomePull = (this.prefersReducedMotion ? 0.018 : 0.008) / safeEntropy;
            this.gridDriftStrength = (isCompact ? 0.03 : 0.034) * entropy;
            this.gridDriftLift = (isCompact ? 0.038 : 0.042) * entropy;
            this.pixelCount = this.gridColumns * this.gridRows;

            this.pixelGridGeometry = new THREE.BufferGeometry();
            this.pixelPositions = new Float32Array(this.pixelCount * 3);
            this.pixelBasePositions = new Float32Array(this.pixelCount * 3);
            this.pixelColors = new Float32Array(this.pixelCount * 3);
            this.pixelBaseColors = new Float32Array(this.pixelCount * 3);
            this.pixelPaletteColors = new Float32Array(this.pixelCount * 3);
            this.pixelSeeds = new Float32Array(this.pixelCount * 3);
            this.pixelVelocities = new Float32Array(this.pixelCount * 3);
            this.pixelNeighborIndices = new Int32Array(this.pixelCount * 7);
            this.pixelNeighborIndices.fill(-1);
            this.pixelNeighborCounts = new Uint8Array(this.pixelCount);

            const xOffset = this.gridColumns > 0 ? (this.gridColumns - 1) * this.gridSpacing * 0.5 : 0;
            const zOffset = this.gridRows > 0 ? (this.gridRows - 1) * this.gridSpacing * 0.5 : 0;
            this.gridFieldHalfWidth = xOffset;
            this.gridFieldHalfDepth = zOffset;
            this.gridFieldRadius = Math.hypot(xOffset, zOffset) + this.gridSpacing * 6;
            let index = 0;

            for (let row = 0; row < this.gridRows; row += 1) {
                for (let col = 0; col < this.gridColumns; col += 1) {
                    const positionIndex = index * 3;
                    const seedIndex = index * 3;
                    const jitterX = (Math.random() - 0.5) * this.gridSpacing * 0.08;
                    const jitterZ = (Math.random() - 0.5) * this.gridSpacing * 0.08;
                    const x = col * this.gridSpacing - xOffset + jitterX;
                    const z = row * this.gridSpacing - zOffset + jitterZ;

                    this.pixelBasePositions[positionIndex] = x;
                    this.pixelBasePositions[positionIndex + 1] = 0;
                    this.pixelBasePositions[positionIndex + 2] = z;

                    this.pixelPositions[positionIndex] = x;
                    this.pixelPositions[positionIndex + 1] = 0;
                    this.pixelPositions[positionIndex + 2] = z;

                    this.pixelSeeds[seedIndex] = Math.random();
                    this.pixelSeeds[seedIndex + 1] = Math.hypot(x, z) / Math.max(xOffset, zOffset, 1);
                    this.pixelSeeds[seedIndex + 2] = Math.random() * Math.PI * 2;

                    index += 1;
                }
            }

            const neighborOffsetsEven = [
                [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1]
            ];
            const neighborOffsetsOdd = [
                [-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1], [1, -1]
            ];

            for (let row = 0; row < this.gridRows; row += 1) {
                for (let col = 0; col < this.gridColumns; col += 1) {
                    const pixelIndex = row * this.gridColumns + col;
                    const neighborBase = pixelIndex * 7;
                    const offsets = row % 2 === 0 ? neighborOffsetsEven : neighborOffsetsOdd;
                    let neighborCount = 0;

                    for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex += 1) {
                        const [colOffset, rowOffset] = offsets[offsetIndex];
                        const neighborCol = col + colOffset;
                        const neighborRow = row + rowOffset;

                        if (
                            neighborCol < 0
                            || neighborCol >= this.gridColumns
                            || neighborRow < 0
                            || neighborRow >= this.gridRows
                        ) {
                            continue;
                        }

                        this.pixelNeighborIndices[neighborBase + neighborCount] = neighborRow * this.gridColumns + neighborCol;
                        neighborCount += 1;
                    }

                    this.pixelNeighborCounts[pixelIndex] = neighborCount;
                }
            }

            const leaderPoints = [
                { col: Math.round((this.gridColumns - 1) * 0.5), row: Math.round((this.gridRows - 1) * 0.5) }
            ];

            this.flockLeaderIndices = leaderPoints.map(({ col, row }) => {
                const safeCol = THREE.MathUtils.clamp(col, 0, Math.max(0, this.gridColumns - 1));
                const safeRow = THREE.MathUtils.clamp(row, 0, Math.max(0, this.gridRows - 1));
                return safeRow * this.gridColumns + safeCol;
            });

            this.flockLeaderOrigins = this.flockLeaderIndices.map((leaderIndex) => {
                const positionIndex = leaderIndex * 3;
                return {
                    x: this.pixelBasePositions[positionIndex] * 0.4,
                    y: this.pixelBasePositions[positionIndex + 1],
                    z: this.pixelBasePositions[positionIndex + 2] * 0.4
                };
            });

            this.pixelGridGeometry.setAttribute('position', new THREE.BufferAttribute(this.pixelPositions, 3));
            this.pixelGridGeometry.setAttribute('color', new THREE.BufferAttribute(this.pixelColors, 3));

            this.pixelGridMaterial = new THREE.PointsMaterial({
                size: isCompact ? 0.11 : 0.075,
                transparent: true,
                vertexColors: true,
                depthWrite: false,
                sizeAttenuation: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            });
            this.pixelShadowMaterial = new THREE.PointsMaterial({
                size: isCompact ? 0.22 : 0.15,
                map: this.pixelShadowTexture,
                transparent: true,
                depthWrite: false,
                depthTest: false,
                sizeAttenuation: true,
                opacity: 0,
                blending: THREE.NormalBlending
            });

            this.gridInstances = [];
            this.shadowGridInstances = [];
            const stackOffset = ((this.gridStackCount - 1) * this.gridStackSpacing) * 0.5;
            const shadowOffsetX = isCompact ? 0.018 : 0.012;
            const shadowOffsetY = isCompact ? -0.055 : -0.035;
            const shadowOffsetZ = isCompact ? 0.018 : 0.012;

            for (let layer = 0; layer < this.gridStackCount; layer += 1) {
                const shadowGrid = new THREE.Points(this.pixelGridGeometry, this.pixelShadowMaterial);
                shadowGrid.position.x = shadowOffsetX;
                shadowGrid.position.y = layer * this.gridStackSpacing - stackOffset + shadowOffsetY;
                shadowGrid.position.z = layer * 0.02 - shadowOffsetZ;
                shadowGrid.renderOrder = 0;
                this.gridGroup.add(shadowGrid);
                this.shadowGridInstances.push(shadowGrid);

                const pixelGrid = new THREE.Points(this.pixelGridGeometry, this.pixelGridMaterial);
                pixelGrid.position.y = layer * this.gridStackSpacing - stackOffset;
                pixelGrid.position.z = layer * 0.02;
                pixelGrid.renderOrder = 1;
                this.gridGroup.add(pixelGrid);
                this.gridInstances.push(pixelGrid);
            }

            this.pixelGrid = this.gridInstances[Math.floor(this.gridInstances.length / 2)] || null;
            this.gridGroup.rotation.set(this.getGridTiltRadians(), 0, 0);
            this.gridGroup.scale.setScalar(this.gridScale);
            this.refreshGridPlane();
        }

        randomGaussian() {
            let u = 0;
            let v = 0;

            while (u === 0) {
                u = Math.random();
            }

            while (v === 0) {
                v = Math.random();
            }

            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        }

        getFlockLeaderPathPoint(time, profile, origin, phase = 0) {
            const spanX = profile.mainSpanX || (this.gridFieldHalfWidth || 1) * 0.3;
            const lift = profile.mainLift || 1;
            const depth = profile.mainDepth || (this.gridFieldHalfDepth || 1) * 0.16;
            const cycle = time * profile.speed + phase;
            const sweepX = Math.sin(cycle * 0.56) * spanX * 0.86;
            const sweepY = Math.cos(cycle * 0.31 + 0.42) * lift * 0.48;
            const sweepZ = Math.sin(cycle * 0.24 + 0.9) * depth * 1.85;
            const curlX = Math.cos(cycle * 0.82 + 0.35) * spanX * 0.12;
            const curlY = Math.sin(cycle * 0.88 + 1.15) * lift * 0.14;
            const curlZ = Math.cos(cycle * 0.63 + 0.18) * depth * 0.24;

            return {
                x: profile.mainCenterX + origin.x + sweepX + curlX,
                y: profile.mainCenterY + origin.y + sweepY + curlY,
                z: profile.mainCenterZ + origin.z + sweepZ + curlZ
            };
        }

        getFlockLeaderTargets(time, profile) {
            if (!this.flockLeaderIndices?.length || !this.flockLeaderOrigins?.length) {
                return [];
            }

            const origin = this.flockLeaderOrigins[0];
            const phase = this.flockLeaderPhases[0] || 0;
            const point = this.getFlockLeaderPathPoint(time, profile, origin, phase);
            const prevPoint = this.getFlockLeaderPathPoint(time - 0.22, profile, origin, phase);
            const nextPoint = this.getFlockLeaderPathPoint(time + 0.22, profile, origin, phase);
            const tangent = new THREE.Vector3(
                nextPoint.x - prevPoint.x,
                nextPoint.y - prevPoint.y,
                nextPoint.z - prevPoint.z
            ).normalize();
            const referenceAxis = Math.abs(tangent.y) > 0.86
                ? new THREE.Vector3(1, 0, 0)
                : new THREE.Vector3(0, 1, 0);
            const normal = new THREE.Vector3().crossVectors(tangent, referenceAxis).normalize();
            const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

            return [{
                pixelIndex: this.flockLeaderIndices[0],
                x: point.x,
                y: point.y,
                z: point.z,
                tangentX: tangent.x,
                tangentY: tangent.y,
                tangentZ: tangent.z,
                normalX: normal.x,
                normalY: normal.y,
                normalZ: normal.z,
                binormalX: binormal.x,
                binormalY: binormal.y,
                binormalZ: binormal.z
            }];
        }

        getFlockFormationState(time, profile) {
            const phase = ((time * profile.formationCycleRate) % 3 + 3) % 3;
            const getWeight = (center) => {
                const distance = Math.abs(phase - center);
                const wrappedDistance = Math.min(distance, 3 - distance);
                const raw = Math.max(0, 1 - wrappedDistance);
                return raw * raw * (3 - 2 * raw);
            };

            let spindle = getWeight(0);
            let comet = getWeight(1);
            let cloud = getWeight(2);
            const total = Math.max(0.0001, spindle + comet + cloud);

            spindle /= total;
            comet /= total;
            cloud /= total;

            const formationStrength = Math.max(spindle, comet, cloud);

            return {
                phase,
                spindle,
                comet,
                cloud,
                formationStrength,
                floatStrength: 1 - formationStrength * 0.9
            };
        }

        getGridTiltRadians() {
            return Math.abs(this.gridTiltX) > Math.PI * 2
                ? THREE.MathUtils.degToRad(this.gridTiltX)
                : this.gridTiltX;
        }

        refreshGridPlane() {
            const normal = new THREE.Vector3(0, 1, 0)
                .applyAxisAngle(new THREE.Vector3(1, 0, 0), this.getGridTiltRadians())
                .normalize();
            this.gridPlane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(0, 0, 0));
        }

        applyTheme() {
            const palette = this.getThemePalette();
            this.activePalette = palette;

            this.scene.fog = new THREE.FogExp2(palette.fogColor, palette.fogDensity);

            this.starfieldMaterial.opacity = palette.starOpacity;
            this.starfieldMaterial.blending = palette.starBlending;
            this.starfieldMaterial.needsUpdate = true;

            this.milkyWayMaterial.opacity = palette.milkyWayOpacity;
            this.milkyWayMaterial.blending = palette.milkyWayBlending;
            this.milkyWayMaterial.needsUpdate = true;

            this.pixelGridMaterial.opacity = palette.gridOpacity;
            this.pixelGridMaterial.blending = palette.gridBlending;
            this.pixelGridMaterial.needsUpdate = true;
            this.refreshPixelShadowAppearance();

            this.sphereFill.material.color.copy(palette.gridAccent);
            this.sphereFill.material.blending = palette.gridBlending;
            this.sphereFill.material.needsUpdate = true;

            this.sphereWire.material.color.copy(palette.gridHighlight);
            this.sphereWire.material.blending = palette.gridBlending;
            this.sphereWire.material.needsUpdate = true;

            this.shockwaveRing.material.color.copy(palette.gridHighlight);
            this.shockwaveRing.material.blending = palette.gridBlending;
            this.shockwaveRing.material.needsUpdate = true;

            for (let index = 0; index < this.starCount; index += 1) {
                const seedIndex = index * 4;
                const colorIndex = index * 3;
                const mixA = this.starSeeds[seedIndex];
                const mixB = this.starSeeds[seedIndex + 1];

                this.tempColorA.lerpColors(palette.starPalette[0], palette.starPalette[1], mixA);
                this.tempColorB.lerpColors(this.tempColorA, palette.starPalette[2], mixB * 0.4);

                this.starColors[colorIndex] = this.tempColorB.r;
                this.starColors[colorIndex + 1] = this.tempColorB.g;
                this.starColors[colorIndex + 2] = this.tempColorB.b;
            }

            for (let index = 0; index < this.milkyWayCount; index += 1) {
                const seedIndex = index * 5;
                const colorIndex = index * 3;
                const spread = Math.min(Math.abs(this.milkyWaySeeds[seedIndex + 1]) / 6, 1);
                const warmth = Math.min((this.milkyWaySeeds[seedIndex] + 33) / 66, 1);

                this.tempColorA.lerpColors(palette.milkyWayPalette[0], palette.milkyWayPalette[1], spread);
                this.tempColorB.lerpColors(this.tempColorA, palette.milkyWayPalette[2], warmth * 0.45);

                this.milkyWayColors[colorIndex] = this.tempColorB.r;
                this.milkyWayColors[colorIndex + 1] = this.tempColorB.g;
                this.milkyWayColors[colorIndex + 2] = this.tempColorB.b;
            }

            for (let index = 0; index < this.pixelCount; index += 1) {
                const seedIndex = index * 3;
                const colorIndex = index * 3;
                const seedMix = this.pixelSeeds[seedIndex];
                const radialMix = Math.min(this.pixelSeeds[seedIndex + 1], 1);
                const phaseSeed = this.pixelSeeds[seedIndex + 2];
                const hue = (
                    palette.gridHueShift
                    + seedMix * 0.68
                    + radialMix * 0.22
                    + (Math.sin(phaseSeed) * 0.08 + 0.08)
                ) % 1;
                const lightness = palette.gridLightnessBase + (1 - radialMix) * palette.gridLightnessRange;

                if (this.murmurationTone === 'mono') {
                    const monoMix = Math.min(1, 0.18 + seedMix * 0.42 + (1 - radialMix) * 0.24);
                    this.tempColorA.lerpColors(palette.gridMonoAccent, palette.gridMonoHighlight, monoMix);
                } else {
                    this.tempColorA.setHSL(hue, palette.gridSaturation, lightness);
                    this.tempColorB.setHSL(
                        (hue + 0.1) % 1,
                        Math.min(1, palette.gridSaturation * 1.05),
                        Math.min(0.82, lightness + 0.05)
                    );
                    this.tempColorA.lerp(this.tempColorB, 0.22 + seedMix * 0.18);
                }

                this.pixelPaletteColors[colorIndex] = this.tempColorA.r;
                this.pixelPaletteColors[colorIndex + 1] = this.tempColorA.g;
                this.pixelPaletteColors[colorIndex + 2] = this.tempColorA.b;
            }

            this.refreshPixelBaseColors(true);

            this.starfieldGeometry.attributes.color.needsUpdate = true;
            this.milkyWayGeometry.attributes.color.needsUpdate = true;
            this.pixelGridGeometry.attributes.color.needsUpdate = true;
        }

        updateStarfield(time) {
            for (let index = 0; index < this.starCount; index += 1) {
                const positionIndex = index * 3;
                const seedIndex = index * 4;
                const phase = this.starSeeds[seedIndex + 2];
                const drift = this.starSeeds[seedIndex + 3];

                this.starPositions[positionIndex] =
                    this.starBasePositions[positionIndex]
                    + Math.cos(time * 0.18 + phase) * 0.08 * drift;

                this.starPositions[positionIndex + 1] =
                    this.starBasePositions[positionIndex + 1]
                    + Math.sin(time * 0.24 + phase) * 0.11 * drift;

                this.starPositions[positionIndex + 2] = this.starBasePositions[positionIndex + 2];
            }

            this.starfieldGeometry.attributes.position.needsUpdate = true;
        }

        updateMilkyWay(time) {
            for (let index = 0; index < this.milkyWayCount; index += 1) {
                const positionIndex = index * 3;
                const seedIndex = index * 5;
                const phase = this.milkyWaySeeds[seedIndex + 2];
                const drift = this.milkyWaySeeds[seedIndex + 4];

                this.milkyWayPositions[positionIndex] =
                    this.milkyWayBasePositions[positionIndex]
                    + Math.sin(time * 0.11 + phase) * 0.22 * drift;

                this.milkyWayPositions[positionIndex + 1] =
                    this.milkyWayBasePositions[positionIndex + 1]
                    + Math.cos(time * 0.14 + phase) * 0.18 * drift;

                this.milkyWayPositions[positionIndex + 2] = this.milkyWayBasePositions[positionIndex + 2];
            }

            this.milkyWayGeometry.attributes.position.needsUpdate = true;
        }

        getSphereStageProfile() {
            if (this.sphereStage >= 2) {
                return {
                    completion: 1,
                    gravity: 1,
                    shellMix: 1,
                    scale: 1
                };
            }

            if (this.sphereStage === 1) {
                return {
                    completion: 0.78,
                    gravity: 0.84,
                    shellMix: 0.82,
                    scale: 0.96
                };
            }

            return {
                completion: 0.36,
                gravity: 0.52,
                shellMix: 0.28,
                scale: 0.9
            };
        }

        updateSphereState(delta) {
            if (this.sphereSizePreset === 'none') {
                this.sphereStage = 0;
                this.sphereVisible = 0;
                return;
            }

            const hasHoverTarget = this.hasPointer && this.hoverPoint.x < 9000;

            if (hasHoverTarget) {
                this.sphereCenterTarget.set(
                    this.hoverPoint.x,
                    this.sphereRadius * 0.94,
                    this.hoverPoint.z
                );
            }

            const shouldShowSphere = hasHoverTarget || this.sphereStage > 0;
            const visibilityTarget = shouldShowSphere ? 1 : 0;
            const visibilityLerp = shouldShowSphere ? 0.18 : 0.1;

            this.sphereVisible += (visibilityTarget - this.sphereVisible) * visibilityLerp;

            if (shouldShowSphere) {
                this.sphereCenter.lerp(this.sphereCenterTarget, hasHoverTarget ? 0.22 : 0.08);
            }

            if (this.burstActive) {
                this.burstProgress = Math.min(1, this.burstProgress + delta / this.burstDuration);
                if (this.burstProgress >= 1) {
                    this.burstActive = false;
                    this.sphereStage = 0;
                    this.sphereVisible = 0;
                }
            }
        }

        updateSphereVisuals(time) {
            this.sphereFill.visible = false;
            this.sphereWire.visible = false;
            this.sphereFill.material.opacity = 0;
            this.sphereWire.material.opacity = 0;

            if (this.burstActive) {
                const shockFade = Math.max(0, 1 - this.burstProgress);
                const shockScale = 1.1 + this.burstProgress * 10.5;

                this.shockwaveRing.visible = true;
                this.shockwaveRing.position.copy(this.burstOrigin);
                this.shockwaveRing.scale.setScalar(shockScale);
                this.shockwaveRing.material.opacity = 0.22 * shockFade * shockFade;
            } else {
                this.shockwaveRing.visible = false;
                this.shockwaveRing.material.opacity = 0;
            }
        }

        triggerBurst() {
            this.burstActive = true;
            this.burstProgress = 0;
            this.burstOrigin.copy(this.sphereCenter);
            this.sphereStage = 0;
        }

        isInteractiveEventTarget(target) {
            return Boolean(target?.closest('.navbar, .home-sidebar, .mobile-menu, .home-mobile-flockbar, footer, a, button, input, textarea, select, label, summary, details'));
        }

        setPointerFromClient(clientX, clientY, immediate = false) {
            this.hasPointer = true;
            this.pointerTarget.x = (clientX / window.innerWidth) * 2 - 1;
            this.pointerTarget.y = -((clientY / window.innerHeight) * 2 - 1);

            if (immediate) {
                this.pointer.copy(this.pointerTarget);
            }
        }

        projectClientPointToGrid(clientX, clientY, output = this.pointerProjectPoint) {
            this.pointerProjectNdc.x = (clientX / window.innerWidth) * 2 - 1;
            this.pointerProjectNdc.y = -((clientY / window.innerHeight) * 2 - 1);
            this.raycaster.setFromCamera(this.pointerProjectNdc, this.camera);

            if (!this.raycaster.ray.intersectPlane(this.gridPlane, output)) {
                return false;
            }

            this.gridGroup.worldToLocal(output);
            return true;
        }

        updateSphereTargetFromPoint(point, syncCenter = false) {
            this.sphereCenterTarget.set(
                point.x,
                this.sphereRadius * 0.94,
                point.z
            );

            if (syncCenter) {
                this.sphereCenter.copy(this.sphereCenterTarget);
            }
        }

        advanceSphereInteraction(clientX, clientY, target = null) {
            if (this.sphereSizePreset === 'none') {
                return;
            }

            if (this.isInteractiveEventTarget(target) || this.burstActive) {
                return;
            }

            const hasGridPoint = this.projectClientPointToGrid(clientX, clientY, this.pointerProjectPoint);
            const hasSphereTarget = hasGridPoint || this.sphereVisible > 0.05 || this.sphereStage > 0;

            if (!hasSphereTarget) {
                return;
            }

            if (hasGridPoint) {
                this.hoverPoint.copy(this.pointerProjectPoint);
                this.updateSphereTargetFromPoint(
                    this.pointerProjectPoint,
                    this.sphereVisible < 0.08 && this.sphereStage === 0
                );
            }

            if (this.sphereStage === 0) {
                this.sphereStage = 1;
                return;
            }

            if (this.sphereStage === 1) {
                this.sphereStage = 2;
                return;
            }

            this.triggerBurst();
        }

        updatePixelGrid(time, delta) {
            if (this.hasPointer) {
                this.raycaster.setFromCamera(this.pointer, this.camera);
                if (this.raycaster.ray.intersectPlane(this.gridPlane, this.hoverWorldPoint)) {
                    this.hoverPoint.copy(this.hoverWorldPoint);
                    this.gridGroup.worldToLocal(this.hoverPoint);
                } else {
                    this.hoverPoint.set(9999, 9999, 9999);
                }
            } else {
                this.hoverPoint.set(9999, 9999, 9999);
            }

            const hasHover = this.sphereSizePreset !== 'none' && this.hoverPoint.x < 9000;
            this.updateSphereState(delta);
            const sphereProfile = this.getSphereStageProfile();
            const sphereAttractionActive = !this.burstActive && (this.sphereVisible > 0.02 || this.sphereStage > 0 || hasHover);
            const murmuration = this.getMurmurationProfile(time);
            const murmurationActive = Boolean(murmuration);
            const flockStyleActive = murmurationActive && murmuration.style === 'split';
            const flockLeaderTargets = flockStyleActive
                ? this.getFlockLeaderTargets(time, murmuration)
                : null;
            const flockFormationState = flockStyleActive
                ? this.getFlockFormationState(time, murmuration)
                : null;
            const sphereInfluenceRadius = this.sphereInfluenceRadius * (this.sphereStage >= 2 ? 2 : this.sphereStage === 1 ? 1.5 : 1);
            const burstWaveRadius = (this.gridFieldRadius + this.sphereRadius * 4) * this.burstProgress;
            const burstWaveWidth = Math.max(1.2, this.gridSpacing * 16);

            for (let index = 0; index < this.pixelCount; index += 1) {
                const positionIndex = index * 3;
                const seedIndex = index * 3;
                const baseX = this.pixelBasePositions[positionIndex];
                const baseY = this.pixelBasePositions[positionIndex + 1];
                const baseZ = this.pixelBasePositions[positionIndex + 2];
                const seedMix = this.pixelSeeds[seedIndex];
                const radialMix = this.pixelSeeds[seedIndex + 1];
                const seedPhase = this.pixelSeeds[seedIndex + 2];
                const positions = this.pixelPositions;
                const velocities = this.pixelVelocities;
                const currentX = positions[positionIndex];
                const currentY = positions[positionIndex + 1];
                const currentZ = positions[positionIndex + 2];
                const driftX =
                    Math.sin(time * 0.42 + seedPhase + baseZ * 0.08) * this.gridDriftStrength
                    + Math.cos(time * 0.18 + baseX * 0.06 + seedPhase) * this.gridDriftStrength * 0.45;
                const driftY =
                    Math.sin(time * 0.56 + seedPhase + baseX * 0.09) * this.gridDriftLift
                    + Math.cos(time * 0.31 + baseZ * 0.08 - seedPhase) * this.gridDriftLift * 0.7;
                const driftZ =
                    Math.cos(time * 0.38 - seedPhase + baseX * 0.08) * this.gridDriftStrength
                    + Math.sin(time * 0.21 + baseZ * 0.06 + seedPhase) * this.gridDriftStrength * 0.4;
                let targetX = currentX + driftX;
                let targetY = currentY + driftY;
                let targetZ = currentZ + driftZ;
                let highlightMix = 0;
                let flockHighlightMix = 0;
                const homePull = flockStyleActive
                    ? (sphereAttractionActive ? 0.0008 : this.burstActive ? 0 : 0.0002)
                    : sphereAttractionActive ? this.gridHomePull * 0.45 : this.burstActive ? 0 : this.gridHomePull;

                targetX += (baseX - targetX) * homePull;
                targetY += (baseY - targetY) * homePull * 0.7;
                targetZ += (baseZ - targetZ) * homePull;

                if (murmurationActive) {
                    const clusterSeed = (seedMix * 0.72 + radialMix * 0.34 + (Math.sin(seedPhase) * 0.08 + 0.08)) % 1;
                    const flockRole = murmuration.singleFlock
                        ? 0
                        : clusterSeed < 0.64 ? 0 : clusterSeed < 0.82 ? 1 : 2;
                    const isMainFlock = flockRole === 0;
                    const roleCenterX = isMainFlock
                        ? murmuration.mainCenterX
                        : flockRole === 1
                            ? murmuration.leftCenterX
                            : murmuration.rightCenterX;
                    const roleCenterY = isMainFlock
                        ? murmuration.mainCenterY
                        : flockRole === 1
                            ? murmuration.leftCenterY
                            : murmuration.rightCenterY;
                    const roleCenterZ = isMainFlock
                        ? murmuration.mainCenterZ
                        : flockRole === 1
                            ? murmuration.leftCenterZ
                            : murmuration.rightCenterZ;
                    const localU = this.gridFieldHalfWidth > 0 ? baseX / this.gridFieldHalfWidth : 0;
                    const localV = this.gridFieldHalfDepth > 0 ? baseZ / this.gridFieldHalfDepth : 0;
                    const orbitPhase = seedPhase + time * murmuration.speed + seedMix * Math.PI * 2;
                    let patternX = roleCenterX;
                    let patternY = roleCenterY;
                    let patternZ = roleCenterZ;
                    let patternMixScale = 1;

                    if (murmuration.style === 'halo') {
                        const orbitScale = isMainFlock
                            ? 0.54 + (1 - radialMix) * 0.74
                            : 0.4 + (1 - radialMix) * 0.48;
                        const radiusX = (isMainFlock ? murmuration.mainRadiusX : murmuration.sideRadiusX) * orbitScale;
                        const radiusZ = (isMainFlock ? murmuration.mainRadiusZ : murmuration.sideRadiusZ) * orbitScale;
                        const lift = isMainFlock ? murmuration.mainLift : murmuration.sideLift;
                        patternX = roleCenterX + Math.cos(orbitPhase + localU * 2.1) * radiusX;
                        patternY = roleCenterY + Math.sin(orbitPhase * 1.7 + localV * 3.2) * lift * (0.66 + (1 - radialMix) * 0.34);
                        patternZ = roleCenterZ + Math.sin(orbitPhase + localV * 2.4) * radiusZ;
                    } else if (murmuration.style === 'ribbon') {
                        const ribbonSpan = isMainFlock ? murmuration.mainSpanX : murmuration.sideSpanX;
                        const ribbonDepth = isMainFlock ? murmuration.mainDepth : murmuration.sideDepth;
                        const lift = isMainFlock ? murmuration.mainLift : murmuration.sideLift;
                        const ribbonU = isMainFlock ? (seedMix - 0.5) * 1.5 : (seedMix - 0.5) * 1.16;
                        patternX = roleCenterX + ribbonU * ribbonSpan;
                        patternY = roleCenterY + Math.sin(ribbonU * 4.8 + time * murmuration.speed + seedPhase) * lift + Math.cos(localV * 3.4 + time * 0.8 + seedPhase) * (isMainFlock ? 0.22 : 0.16);
                        patternZ = roleCenterZ + Math.cos(ribbonU * 3.2 + time * 0.74 + seedPhase) * ribbonDepth + localV * this.gridFieldHalfDepth * (isMainFlock ? 0.06 : 0.035);
                    } else if (murmuration.style === 'split') {
                        const cycle = time * murmuration.speed;
                        const breakupWave = (Math.sin(cycle * 0.54 + clusterSeed * Math.PI * 2) + 1) * 0.5;
                        const formation = flockFormationState || {
                            spindle: 1,
                            comet: 0,
                            cloud: 0,
                            formationStrength: 1,
                            floatStrength: 0
                        };
                        const leaderTarget = flockLeaderTargets?.[0] || {
                            pixelIndex: -1,
                            x: roleCenterX,
                            y: roleCenterY,
                            z: roleCenterZ,
                            tangentX: 1,
                            tangentY: 0,
                            tangentZ: 0,
                            normalX: 0,
                            normalY: 1,
                            normalZ: 0,
                            binormalX: 0,
                            binormalY: 0,
                            binormalZ: 1
                        };
                        const isLeaderPixel = leaderTarget.pixelIndex === index;
                        const subgroupPhase = seedPhase * 0.72 + clusterSeed * Math.PI * 2;
                        const tangentX = leaderTarget.tangentX;
                        const tangentY = leaderTarget.tangentY;
                        const tangentZ = leaderTarget.tangentZ;
                        const normalX = leaderTarget.normalX;
                        const normalY = leaderTarget.normalY;
                        const normalZ = leaderTarget.normalZ;
                        const binormalX = leaderTarget.binormalX;
                        const binormalY = leaderTarget.binormalY;
                        const binormalZ = leaderTarget.binormalZ;
                        const spindleT = seedMix * 2 - 1;
                        const spindleEnvelope = Math.pow(Math.max(0, 1 - Math.abs(spindleT)), murmuration.spindleTaper);
                        const spindlePulse = 0.86 + Math.sin(cycle * murmuration.spindlePulseSpeed + subgroupPhase * 0.4) * 0.14;
                        const spindleRadius = murmuration.spindleRadius
                            * spindlePulse
                            * (0.16 + spindleEnvelope * 0.84)
                            * (0.7 + (1 - radialMix) * 0.26);
                        const spindleTravel = spindleT * murmuration.spindleLength
                            + Math.sin(cycle * 0.34 + subgroupPhase * 0.55 + spindleT * 2.8) * murmuration.spindleLength * 0.05;
                        const spindleAngle = subgroupPhase
                            + Math.sin(cycle * 0.22 + localU * 2.1) * 0.24
                            + Math.cos(cycle * 0.18 + localV * 1.5) * 0.16;
                        const spindleCos = Math.cos(spindleAngle);
                        const spindleSin = Math.sin(spindleAngle);
                        const spindleX = leaderTarget.x
                            + tangentX * spindleTravel
                            + (normalX * spindleCos + binormalX * spindleSin) * spindleRadius;
                        const spindleY = leaderTarget.y
                            + tangentY * spindleTravel
                            + (normalY * spindleCos + binormalY * spindleSin) * spindleRadius;
                        const spindleZ = leaderTarget.z
                            + tangentZ * spindleTravel
                            + (normalZ * spindleCos + binormalZ * spindleSin) * spindleRadius;

                        const cometProgress = seedMix;
                        const cometHeadWeight = Math.pow(1 - cometProgress, 0.58);
                        const cometRadius = murmuration.cometRadius
                            * (0.12 + cometHeadWeight * 0.96)
                            * (0.74 + (1 - radialMix) * 0.22);
                        const cometAngle = subgroupPhase * 0.78 + Math.sin(cycle * 0.19 + cometProgress * 2.2) * 0.28;
                        const cometCos = Math.cos(cometAngle);
                        const cometSin = Math.sin(cometAngle);
                        const cometTrail = -cometProgress * murmuration.cometLength
                            + Math.sin(cycle * 0.16 + subgroupPhase) * murmuration.cometLength * 0.04;
                        const cometWake = (1 - cometHeadWeight) * murmuration.cometLength * 0.06;
                        const cometX = leaderTarget.x
                            + tangentX * cometTrail
                            + (normalX * cometCos + binormalX * cometSin) * cometRadius
                            + binormalX * cometWake;
                        const cometY = leaderTarget.y
                            + tangentY * cometTrail
                            + (normalY * cometCos + binormalY * cometSin) * cometRadius
                            + normalY * cometWake * 0.52;
                        const cometZ = leaderTarget.z
                            + tangentZ * cometTrail
                            + (normalZ * cometCos + binormalZ * cometSin) * cometRadius
                            + binormalZ * cometWake;

                        const branchProgressRaw = THREE.MathUtils.clamp((seedMix - 0.08) / 0.84, 0, 1);
                        const branchProgress = branchProgressRaw * branchProgressRaw * (3 - 2 * branchProgressRaw);
                        const branchSign = Math.sin(subgroupPhase) >= 0 ? 1 : -1;
                        const branchSpread = branchSign * murmuration.branchSpread * branchProgress;
                        const branchLift = Math.sin(subgroupPhase * 1.16 + cycle * 0.21) * murmuration.branchLift * (0.3 + branchProgress * 0.7);
                        const branchCloudRadius = murmuration.branchCloudRadius
                            * (0.26 + branchProgress * 0.86)
                            * (0.82 + (1 - radialMix) * 0.24);
                        const branchAngle = subgroupPhase + Math.sin(cycle * 0.18 + branchProgress * 2.8) * 0.36;
                        const branchCos = Math.cos(branchAngle);
                        const branchSin = Math.sin(branchAngle);
                        const branchTravel = (seedMix - 0.3) * murmuration.branchLength;
                        const branchX = leaderTarget.x
                            + tangentX * branchTravel
                            + binormalX * branchSpread
                            + normalX * branchLift
                            + (normalX * branchCos + binormalX * branchSin) * branchCloudRadius;
                        const branchY = leaderTarget.y
                            + tangentY * branchTravel
                            + binormalY * branchSpread
                            + normalY * branchLift
                            + (normalY * branchCos + binormalY * branchSin) * branchCloudRadius;
                        const branchZ = leaderTarget.z
                            + tangentZ * branchTravel
                            + binormalZ * branchSpread
                            + normalZ * branchLift
                            + (normalZ * branchCos + binormalZ * branchSin) * branchCloudRadius;

                        const breakupAngle = subgroupPhase + cycle * 0.46;
                        const breakupRadius = murmuration.freeFloatStrength
                            * (0.18 + breakupWave * 0.46)
                            * formation.floatStrength;
                        const breakupX = (normalX * Math.cos(breakupAngle) + binormalX * Math.sin(breakupAngle)) * breakupRadius;
                        const breakupY = (normalY * Math.cos(breakupAngle) + binormalY * Math.sin(breakupAngle)) * breakupRadius * 0.72;
                        const breakupZ = (normalZ * Math.cos(breakupAngle) + binormalZ * Math.sin(breakupAngle)) * breakupRadius;
                        const freeDriftX = Math.sin(cycle * 0.31 + subgroupPhase * 0.82) * murmuration.freeFloatStrength
                            + Math.cos(cycle * 0.17 + localV * 2.1) * murmuration.freeFloatStrength * 0.42;
                        const freeDriftY = Math.cos(cycle * 0.27 + subgroupPhase * 0.68) * murmuration.freeFloatStrength * 0.66;
                        const freeDriftZ = Math.sin(cycle * 0.23 + subgroupPhase * 0.9) * murmuration.freeFloatStrength;
                        const formationX =
                            spindleX * formation.spindle
                            + cometX * formation.comet
                            + branchX * formation.cloud;
                        const formationY =
                            spindleY * formation.spindle
                            + cometY * formation.comet
                            + branchY * formation.cloud;
                        const formationZ =
                            spindleZ * formation.spindle
                            + cometZ * formation.comet
                            + branchZ * formation.cloud;
                        const anchorX = formationX + breakupX + freeDriftX * formation.floatStrength;
                        const anchorY = formationY + breakupY + freeDriftY * formation.floatStrength;
                        const anchorZ = formationZ + breakupZ + freeDriftZ * formation.floatStrength;

                        const neighborBase = index * 7;
                        const neighborCount = this.pixelNeighborCounts ? this.pixelNeighborCounts[index] : 0;
                        let neighborX = anchorX;
                        let neighborY = anchorY;
                        let neighborZ = anchorZ;
                        let alignmentX = 0;
                        let alignmentY = 0;
                        let alignmentZ = 0;
                        let separationX = 0;
                        let separationY = 0;
                        let separationZ = 0;

                        if (neighborCount > 0) {
                            let sumX = 0;
                            let sumY = 0;
                            let sumZ = 0;
                            let sumVelocityX = 0;
                            let sumVelocityY = 0;
                            let sumVelocityZ = 0;

                            for (let neighborIndex = 0; neighborIndex < neighborCount; neighborIndex += 1) {
                                const linkedIndex = this.pixelNeighborIndices[neighborBase + neighborIndex];
                                if (linkedIndex < 0) {
                                    continue;
                                }

                                const linkedPositionIndex = linkedIndex * 3;
                                sumX += positions[linkedPositionIndex];
                                sumY += positions[linkedPositionIndex + 1];
                                sumZ += positions[linkedPositionIndex + 2];
                                sumVelocityX += velocities[linkedPositionIndex];
                                sumVelocityY += velocities[linkedPositionIndex + 1];
                                sumVelocityZ += velocities[linkedPositionIndex + 2];

                                const neighborDx = currentX - positions[linkedPositionIndex];
                                const neighborDy = currentY - positions[linkedPositionIndex + 1];
                                const neighborDz = currentZ - positions[linkedPositionIndex + 2];
                                const neighborDistSq = neighborDx * neighborDx + neighborDy * neighborDy + neighborDz * neighborDz;

                                if (neighborDistSq > 0.0001 && neighborDistSq < murmuration.neighborSpacingSq) {
                                    const neighborDist = Math.sqrt(neighborDistSq);
                                    const separationInfluence = 1 - neighborDist / murmuration.neighborSpacing;
                                    const normalizedInfluence = separationInfluence * separationInfluence;
                                    separationX += (neighborDx / neighborDist) * normalizedInfluence;
                                    separationY += (neighborDy / neighborDist) * normalizedInfluence;
                                    separationZ += (neighborDz / neighborDist) * normalizedInfluence;
                                }
                            }

                            neighborX = sumX / neighborCount;
                            neighborY = sumY / neighborCount;
                            neighborZ = sumZ / neighborCount;
                            alignmentX = (sumVelocityX / neighborCount) * murmuration.alignmentStrength;
                            alignmentY = (sumVelocityY / neighborCount) * murmuration.alignmentStrength;
                            alignmentZ = (sumVelocityZ / neighborCount) * murmuration.alignmentStrength;
                            separationX = (separationX / neighborCount) * murmuration.separationStrength;
                            separationY = (separationY / neighborCount) * murmuration.separationStrength;
                            separationZ = (separationZ / neighborCount) * murmuration.separationStrength;
                        }

                        const neighborMix = 0.34 + formation.floatStrength * 0.44 + breakupWave * 0.12;
                        const anchorMix = murmuration.shapeGrip * (0.14 + formation.formationStrength * 0.66);
                        const currentFlowX = tangentX * Math.sin(cycle * 0.26 + seedPhase * 0.04) * murmuration.mainSpanX * 0.06;
                        const currentFlowY = tangentY * Math.cos(cycle * 0.32 + seedPhase * 0.05) * murmuration.mainLift * 0.1;
                        const currentFlowZ = tangentZ * Math.cos(cycle * 0.21 + seedPhase * 0.06) * murmuration.mainDepth * 0.12;

                        patternX = neighborX + (anchorX - neighborX) * anchorMix + alignmentX + separationX + currentFlowX;
                        patternY = neighborY + (anchorY - neighborY) * anchorMix + alignmentY + separationY + currentFlowY;
                        patternZ = neighborZ + (anchorZ - neighborZ) * anchorMix + alignmentZ + separationZ + currentFlowZ;
                        patternX += (currentX - patternX) * Math.min(0.72, neighborMix * 0.22);
                        patternY += (currentY - patternY) * Math.min(0.72, neighborMix * 0.22);
                        patternZ += (currentZ - patternZ) * Math.min(0.72, neighborMix * 0.22);
                        patternMixScale = 0.12 + formation.formationStrength * 0.32;

                        if (isLeaderPixel) {
                            patternX = leaderTarget.x;
                            patternY = leaderTarget.y;
                            patternZ = leaderTarget.z;
                            patternMixScale = 0.52;
                        }
                    }

                    const patternMix = (isMainFlock ? murmuration.mainStrength : murmuration.sideStrength) * patternMixScale * (sphereAttractionActive ? 0.28 : 1);
                    targetX += (patternX - targetX) * patternMix;
                    targetY += (patternY - targetY) * patternMix;
                    targetZ += (patternZ - targetZ) * patternMix;
                    const roleHighlight = patternMix * (isMainFlock ? 1.28 : 1.06);
                    flockHighlightMix = Math.max(flockHighlightMix, roleHighlight);
                    highlightMix = Math.max(highlightMix, roleHighlight);
                }
                if (sphereAttractionActive) {
                    const centerDx = currentX - this.sphereCenter.x;
                    const centerDy = currentY - this.sphereCenter.y;
                    const centerDz = currentZ - this.sphereCenter.z;
                    const sphereDist = Math.hypot(centerDx, centerDy, centerDz);

                    if (sphereDist < sphereInfluenceRadius) {
                        const influence = 1 - sphereDist / sphereInfluenceRadius;
                        const eased = influence * influence * (3 - 2 * influence);
                        const directionLength = Math.max(sphereDist, 0.0001);
                        const dirX = centerDx / directionLength;
                        const dirY = centerDy / directionLength;
                        const dirZ = centerDz / directionLength;
                        const gravityRadius = this.sphereRadius * (0.18 + sphereProfile.gravity * 0.16);
                        const shellX = this.sphereCenter.x + dirX * this.sphereRadius;
                        const shellY = this.sphereCenter.y + dirY * this.sphereRadius;
                        const shellZ = this.sphereCenter.z + dirZ * this.sphereRadius;
                        const gravityX = this.sphereCenter.x + dirX * gravityRadius;
                        const gravityY = this.sphereCenter.y + dirY * gravityRadius;
                        const gravityZ = this.sphereCenter.z + dirZ * gravityRadius;
                        const gravityMix = Math.min(1, eased * (0.4 + sphereProfile.gravity * 0.68) * this.sphereVisible);
                        const shellMix = Math.min(1, eased * sphereProfile.shellMix * this.sphereVisible);
                        const swirl = (1 - sphereProfile.completion) * eased * 0.12;

                        targetX += (gravityX - targetX) * gravityMix;
                        targetY += (gravityY - targetY) * gravityMix;
                        targetZ += (gravityZ - targetZ) * gravityMix;

                        targetX += (shellX - targetX) * shellMix;
                        targetY += (shellY - targetY) * shellMix;
                        targetZ += (shellZ - targetZ) * shellMix;

                        targetX += Math.sin(time * 1.8 + seedPhase) * swirl;
                        targetY += Math.cos(time * 2.1 + seedPhase) * swirl * 0.9;
                        targetZ += Math.sin(time * 1.6 - seedPhase) * swirl;
                        highlightMix = Math.max(highlightMix, eased * (0.45 + sphereProfile.completion * 0.45));
                    }
                } else if (hasHover && !this.burstActive) {
                    const dx = currentX - this.hoverPoint.x;
                    const dz = currentZ - this.hoverPoint.z;
                    const dist = Math.hypot(dx, dz);

                    if (dist < this.gridInteractionRadius) {
                        const influence = 1 - dist / this.gridInteractionRadius;
                        const eased = influence * influence * (3 - 2 * influence);
                        const wave = Math.sin(time * 6.4 - dist * 2.2) * 0.08;

                        targetY += eased * (this.gridLiftStrength * 0.28) + wave * eased;
                        highlightMix = eased * 0.3;
                    }
                }

                if (this.burstActive) {
                    const burstDx = currentX - this.burstOrigin.x;
                    const burstDy = currentY - this.burstOrigin.y;
                    const burstDz = currentZ - this.burstOrigin.z;
                    const burstDist = Math.hypot(burstDx, burstDy, burstDz);
                    const distanceToWave = Math.abs(burstDist - burstWaveRadius);

                    if (distanceToWave < burstWaveWidth) {
                        const waveInfluence = 1 - distanceToWave / burstWaveWidth;
                        const waveEase = waveInfluence * waveInfluence * (3 - 2 * waveInfluence);
                        const outwardLength = Math.max(burstDist, 0.0001);
                        const outX = burstDx / outwardLength;
                        const outY = burstDy / outwardLength;
                        const outZ = burstDz / outwardLength;
                        const shock = waveEase * (0.22 + (1 - this.burstProgress) * 0.26);

                        velocities[positionIndex] += outX * shock;
                        velocities[positionIndex + 1] += outY * shock * 0.65 + waveEase * 0.06;
                        velocities[positionIndex + 2] += outZ * shock;

                        targetX += outX * waveEase * 0.22;
                        targetY += outY * waveEase * 0.14 + waveEase * 0.08;
                        targetZ += outZ * waveEase * 0.22;
                        highlightMix = Math.max(highlightMix, waveEase);
                    }
                }

                velocities[positionIndex] += (targetX - positions[positionIndex]) * this.gridSpring;
                velocities[positionIndex + 1] += (targetY - positions[positionIndex + 1]) * this.gridSpring;
                velocities[positionIndex + 2] += (targetZ - positions[positionIndex + 2]) * this.gridSpring;

                velocities[positionIndex] *= this.gridFriction;
                velocities[positionIndex + 1] *= this.gridFriction;
                velocities[positionIndex + 2] *= this.gridFriction;

                positions[positionIndex] += velocities[positionIndex];
                positions[positionIndex + 1] += velocities[positionIndex + 1];
                positions[positionIndex + 2] += velocities[positionIndex + 2];

                const colorIndex = positionIndex;
                this.tempColorA.setRGB(
                    this.pixelBaseColors[colorIndex],
                    this.pixelBaseColors[colorIndex + 1],
                    this.pixelBaseColors[colorIndex + 2]
                );

                if (highlightMix > 0.001) {
                    const pulseMix = 0.5 + 0.5 * Math.sin(time * 4.4 - Math.hypot(baseX, baseZ) * 0.14);
                    const isMonoMode = this.murmurationTone === 'mono';

                    if (isMonoMode) {
                        this.tempColorB.lerpColors(this.activePalette.gridMonoAccent, this.activePalette.gridMonoHighlight, pulseMix);
                        this.tempColorA.lerp(this.tempColorB, highlightMix * 0.82);
                    } else {
                        this.tempColorB.lerpColors(this.activePalette.gridAccent, this.activePalette.gridHighlight, pulseMix);
                        this.tempColorA.lerp(this.tempColorB, highlightMix * 0.82);
                    }
                }
                this.pixelColors[colorIndex] += (this.tempColorA.r - this.pixelColors[colorIndex]) * (highlightMix > 0 ? 0.22 : 0.08);
                this.pixelColors[colorIndex + 1] += (this.tempColorA.g - this.pixelColors[colorIndex + 1]) * (highlightMix > 0 ? 0.22 : 0.08);
                this.pixelColors[colorIndex + 2] += (this.tempColorA.b - this.pixelColors[colorIndex + 2]) * (highlightMix > 0 ? 0.22 : 0.08);
            }

            this.pixelGridGeometry.attributes.position.needsUpdate = true;
            this.pixelGridGeometry.attributes.color.needsUpdate = true;
        }

        updateSceneTransforms(time) {
            this.backgroundGroup.rotation.z = -0.08 + time * 0.003;
            this.backgroundGroup.position.x = this.pointer.x * 0.9;
            this.backgroundGroup.position.y = this.pointer.y * 0.45 - this.scroll * 1.1;
            this.gridGroup.rotation.x = this.getGridTiltRadians();
            this.gridGroup.rotation.y = 0;
            this.gridGroup.scale.setScalar(this.gridScale);
            this.gridGroup.position.y = 0;
        }

        animate(timestamp) {
            if (!this.isVisible) {
                this.rafId = 0;
                return;
            }

            this.rafId = window.requestAnimationFrame(this.animate);

            if (this.lastFrameTime === null) {
                this.lastFrameTime = timestamp;
            }

            const delta = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
            this.lastFrameTime = timestamp;

            this.pointer.lerp(this.pointerTarget, this.prefersReducedMotion ? 0.035 : 0.08);
            this.scroll += (this.scrollTarget - this.scroll) * 0.06;

            const time = timestamp * 0.001;
            this.updateStarfield(time);
            this.updateMilkyWay(time);
            this.updatePixelGrid(time, delta);
            this.updateSceneTransforms(time);
            this.updateSphereVisuals(time);

            this.camera.position.set(
                0,
                this.cameraBaseY + this.cameraTravelY * this.scroll,
                this.cameraBaseZ + this.cameraTravelZ * this.scroll
            );
            this.camera.lookAt(0, this.cameraLookY + this.cameraLookTravelY * this.scroll, 0);
            this.renderer.render(this.scene, this.camera);
        }

        start() {
            if (!this.rafId) {
                this.lastFrameTime = null;
                this.rafId = window.requestAnimationFrame(this.animate);
            }
        }

        stop() {
            if (this.rafId) {
                window.cancelAnimationFrame(this.rafId);
                this.rafId = 0;
                this.lastFrameTime = null;
            }
        }

        handlePointerMove(event) {
            if (this.isControlDragActive) {
                return;
            }

            if (this.activeTouchPointerId !== null && event.pointerId === this.activeTouchPointerId) {
                this.touchTapTravel = Math.max(
                    this.touchTapTravel,
                    Math.hypot(event.clientX - this.touchTapStartX, event.clientY - this.touchTapStartY)
                );
                this.setPointerFromClient(event.clientX, event.clientY, true);
                return;
            }

            if (event.target?.closest('.navbar, .home-sidebar, .mobile-menu, .home-mobile-flockbar, footer')) {
                this.handlePointerLeave();
                return;
            }

            this.setPointerFromClient(event.clientX, event.clientY);
        }

        handlePointerDown(event) {
            if (this.isControlDragActive || event.pointerType === 'mouse' || this.sphereSizePreset === 'none') {
                return;
            }

            if (this.isInteractiveEventTarget(event.target)) {
                return;
            }

            this.activeTouchPointerId = event.pointerId;
            this.touchTapStartX = event.clientX;
            this.touchTapStartY = event.clientY;
            this.touchTapTravel = 0;
            this.setPointerFromClient(event.clientX, event.clientY, true);

            if (this.projectClientPointToGrid(event.clientX, event.clientY, this.pointerProjectPoint)) {
                this.hoverPoint.copy(this.pointerProjectPoint);
                this.updateSphereTargetFromPoint(
                    this.pointerProjectPoint,
                    this.sphereVisible < 0.08 && this.sphereStage === 0
                );
            }
        }

        handlePointerUp(event) {
            if (this.activeTouchPointerId === null || event.pointerId !== this.activeTouchPointerId) {
                return;
            }

            const wasTap = this.touchTapTravel < 12;
            this.setPointerFromClient(event.clientX, event.clientY, true);

            if (wasTap) {
                this.suppressClickUntil = performance.now() + 450;
                this.advanceSphereInteraction(event.clientX, event.clientY, event.target);
            }

            this.activeTouchPointerId = null;
            this.touchTapTravel = 0;
            this.handlePointerLeave();
        }

        handlePointerCancel(event) {
            if (this.activeTouchPointerId === null || event.pointerId !== this.activeTouchPointerId) {
                return;
            }

            this.activeTouchPointerId = null;
            this.touchTapTravel = 0;
            this.handlePointerLeave();
        }

        handlePointerLeave() {
            this.hasPointer = false;
            this.pointerTarget.set(2.5, 2.5);
            this.hoverPoint.set(9999, 9999, 9999);
        }

        handleClick(event) {
            if (this.sphereSizePreset === 'none' || performance.now() < this.suppressClickUntil) {
                return;
            }

            this.advanceSphereInteraction(event.clientX, event.clientY, event.target);
        }

        handleScroll() {
            const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            this.scrollTarget = Math.min(window.scrollY / maxScroll, 1);
        }

        handleResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.handleScroll();
            this.buildBackdrop();
            this.buildPixelGrid();
            this.applyTheme();
        }

        handleVisibilityChange() {
            this.isVisible = !document.hidden;

            if (this.isVisible) {
                this.start();
                return;
            }

            this.stop();
        }

        handleReducedMotionChange(event) {
            this.prefersReducedMotion = event.matches;
            this.buildBackdrop();
            this.buildPixelGrid();
            this.applyTheme();
        }

        addEventListeners() {
            window.addEventListener('pointerdown', this.handlePointerDown);
            window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
            window.addEventListener('pointerup', this.handlePointerUp);
            window.addEventListener('pointercancel', this.handlePointerCancel);
            window.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
            window.addEventListener('blur', this.handlePointerLeave);
            window.addEventListener('click', this.handleClick);
            window.addEventListener('resize', this.handleResize, { passive: true });
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            document.addEventListener('visibilitychange', this.handleVisibilityChange);

            if (typeof this.prefersReducedMotionQuery.addEventListener === 'function') {
                this.prefersReducedMotionQuery.addEventListener('change', this.handleReducedMotionChange);
            } else if (typeof this.prefersReducedMotionQuery.addListener === 'function') {
                this.prefersReducedMotionQuery.addListener(this.handleReducedMotionChange);
            }

            this.themeObserver = new MutationObserver(() => this.applyTheme());
            this.themeObserver.observe(this.root, {
                attributes: true,
                attributeFilter: ['class']
            });

            this.handleScroll();
        }
    }

    HomeBackgroundScene.prototype.updateGridMotionProfile = function (isCompact = window.innerWidth < 768) {
        const entropy = THREE.MathUtils.clamp(this.gridEntropy, 0, 3);
        const safeEntropy = Math.max(entropy, 0.08);

        this.gridInteractionRadius = isCompact ? 3.45 : 3.9;
        this.gridLiftStrength = isCompact ? 1.42 : 1.55;
        this.gridPushStrength = isCompact ? 0.165 : 0.18;
        this.gridSpring = (this.prefersReducedMotion ? 0.09 : 0.065) / Math.sqrt(safeEntropy);
        this.gridFriction = THREE.MathUtils.clamp(
            (this.prefersReducedMotion ? 0.9 : 0.94) + (entropy - 1) * 0.045,
            0.82,
            0.985
        );
        this.gridHomePull = (this.prefersReducedMotion ? 0.018 : 0.008) / safeEntropy;
        this.gridDriftStrength = (isCompact ? 0.03 : 0.034) * entropy;
        this.gridDriftLift = (isCompact ? 0.038 : 0.042) * entropy;
    };

    HomeBackgroundScene.prototype.syncEntropyControl = function () {
        if (this.entropySlider) {
            this.entropySlider.value = this.gridEntropy.toFixed(2);
        }
    };

    HomeBackgroundScene.prototype.getGridEntropyColorMix = function () {
        const revealStart = 0.2;
        const revealFull = 1.2;
        const normalized = THREE.MathUtils.clamp((this.gridEntropy - revealStart) / (revealFull - revealStart), 0, 1);
        return Math.pow(normalized, 0.7);
    };

    HomeBackgroundScene.prototype.getLowEntropyShadowMix = function () {
        const fadeEnd = 0.2;
        const normalized = 1 - THREE.MathUtils.clamp(this.gridEntropy / fadeEnd, 0, 1);
        return normalized * normalized * (3 - 2 * normalized);
    };

    HomeBackgroundScene.prototype.getSceneBackgroundColor = function () {
        const backgroundColor = window.getComputedStyle(document.body).backgroundColor;

        if (backgroundColor) {
            try {
                this.tempColorC.setStyle(backgroundColor);
                return this.tempColorC;
            } catch (error) {
                // Fall through to theme defaults if the computed style cannot be parsed.
            }
        }

        if (this.murmurationTone === 'mono') {
            this.tempColorC.set(0xffffff);
            return this.tempColorC;
        }

        this.tempColorC.set(this.root.classList.contains('light-theme') ? 0xf7f2e8 : 0x070d1d);
        return this.tempColorC;
    };

    HomeBackgroundScene.prototype.refreshPixelBaseColors = function (syncVisibleColors = false) {
        if (!this.pixelPaletteColors || !this.pixelBaseColors || !this.pixelColors || !this.pixelGridGeometry) {
            return;
        }

        const revealMix = this.getGridEntropyColorMix();
        const backgroundColor = this.getSceneBackgroundColor();

        for (let index = 0; index < this.pixelCount; index += 1) {
            const colorIndex = index * 3;
            this.tempColorA.setRGB(
                this.pixelPaletteColors[colorIndex],
                this.pixelPaletteColors[colorIndex + 1],
                this.pixelPaletteColors[colorIndex + 2]
            );
            this.tempColorB.lerpColors(backgroundColor, this.tempColorA, revealMix);

            this.pixelBaseColors[colorIndex] = this.tempColorB.r;
            this.pixelBaseColors[colorIndex + 1] = this.tempColorB.g;
            this.pixelBaseColors[colorIndex + 2] = this.tempColorB.b;

            if (syncVisibleColors) {
                this.pixelColors[colorIndex] = this.tempColorB.r;
                this.pixelColors[colorIndex + 1] = this.tempColorB.g;
                this.pixelColors[colorIndex + 2] = this.tempColorB.b;
            }
        }

        if (syncVisibleColors && this.pixelGridGeometry.attributes.color) {
            this.pixelGridGeometry.attributes.color.needsUpdate = true;
        }
    };

    HomeBackgroundScene.prototype.refreshPixelShadowAppearance = function () {
        if (!this.pixelShadowMaterial || !this.activePalette) {
            return;
        }

        this.pixelShadowMaterial.color.copy(this.activePalette.gridShadowColor);
        this.pixelShadowMaterial.opacity = this.activePalette.gridShadowOpacity * this.getLowEntropyShadowMix();
        this.pixelShadowMaterial.needsUpdate = true;
    };

    HomeBackgroundScene.prototype.getEntropyLabel = function (value) {
        const entropy = THREE.MathUtils.clamp(Number(value) || 0, 0, 3);

        if (entropy <= 0.001) {
            return 'None';
        }

        if (entropy < 1.5) {
            return 'Low';
        }

        if (entropy < 2.25) {
            return 'Medium';
        }

        return 'High';
    };

    HomeBackgroundScene.prototype.getDensityPresetConfig = function (preset) {
        const configMap = {
            none: { label: 'None', value: 0, angle: 225 },
            some: { label: 'Some', value: 0.05, angle: 315 },
            many: { label: 'Many', value: 0.5, angle: 45 },
            lots: { label: 'Lots', value: 1, angle: 135 }
        };

        return configMap[preset] ?? configMap.lots;
    };

    HomeBackgroundScene.prototype.getDensityPresetIndex = function (preset) {
        const presetOrder = ['none', 'some', 'many', 'lots'];
        const presetIndex = presetOrder.indexOf(preset);
        return presetIndex >= 0 ? presetIndex : presetOrder.length - 1;
    };

    HomeBackgroundScene.prototype.getKnobPointerAngle = function (event, knob) {
        const rect = knob.getBoundingClientRect();
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const rawAngle = THREE.MathUtils.radToDeg(Math.atan2(dx, -dy));
        return ((rawAngle % 360) + 360) % 360;
    };

    HomeBackgroundScene.prototype.resolveContinuousAngle = function (targetAngle, referenceAngle) {
        let resolvedAngle = targetAngle;

        while (resolvedAngle - referenceAngle > 180) {
            resolvedAngle -= 360;
        }

        while (resolvedAngle - referenceAngle < -180) {
            resolvedAngle += 360;
        }

        return resolvedAngle;
    };

    HomeBackgroundScene.prototype.getNearestKnobPreset = function (angle, presetOrder, getConfig) {
        let nearestPreset = presetOrder[0];
        let nearestAngle = getConfig.call(this, nearestPreset).angle;
        let nearestDistance = Infinity;

        presetOrder.forEach((preset) => {
            const resolvedAngle = this.resolveContinuousAngle(getConfig.call(this, preset).angle, angle);
            const distance = Math.abs(resolvedAngle - angle);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPreset = preset;
                nearestAngle = resolvedAngle;
            }
        });

        return {
            preset: nearestPreset,
            angle: nearestAngle
        };
    };

    HomeBackgroundScene.prototype.bindPresetKnob = function (knob, options) {
        if (!knob) {
            return;
        }

        const {
            presetOrder,
            getConfig,
            getCurrentPreset,
            getCurrentDisplayAngle,
            setPreset,
            syncControl,
            getLastPreset,
            angleVar,
            setDisplayAngle
        } = options;

        const syncAria = () => {
            knob.setAttribute('role', 'slider');
            knob.setAttribute('aria-valuemin', '0');
            knob.setAttribute('aria-valuemax', String(presetOrder.length - 1));
            syncControl.call(this);
        };

        const updateFromPointer = (event) => {
            const pointerAngle = this.resolveContinuousAngle(
                this.getKnobPointerAngle(event, knob),
                dragAngle
            );
            dragAngle = pointerAngle;
            setDisplayAngle.call(this, pointerAngle);
            knob.style.setProperty(angleVar, `${pointerAngle}deg`);
        };

        let dragAngle = getCurrentDisplayAngle.call(this);

        const startDrag = (event) => {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            const startX = event.clientX;
            const startY = event.clientY;
            let isDragging = false;

            event.preventDefault();
            event.stopPropagation();

            if (typeof knob.setPointerCapture === 'function') {
                knob.setPointerCapture(event.pointerId);
            }

            dragAngle = getCurrentDisplayAngle.call(this);

            const finishInteraction = (pointerEvent, commitClick = true) => {
                if (pointerEvent.pointerId !== event.pointerId) {
                    return;
                }

                this.isControlDragActive = false;
                knob.classList.remove('is-dragging');

                if (typeof knob.releasePointerCapture === 'function' && knob.hasPointerCapture?.(pointerEvent.pointerId)) {
                    knob.releasePointerCapture(pointerEvent.pointerId);
                }

                knob.removeEventListener('pointermove', handleDrag);
                knob.removeEventListener('pointerup', handlePointerUp);
                knob.removeEventListener('pointercancel', handlePointerCancel);

                if (isDragging) {
                    const snappedPreset = this.getNearestKnobPreset(dragAngle, presetOrder, getConfig);
                    setPreset.call(this, snappedPreset.preset, { displayAngle: snappedPreset.angle });
                } else if (commitClick) {
                    const currentIndex = presetOrder.indexOf(getCurrentPreset.call(this));
                    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
                    const nextIndex = (safeIndex + 1) % presetOrder.length;
                    setPreset.call(this, presetOrder[nextIndex], {
                        displayAngle: getCurrentDisplayAngle.call(this)
                    });
                }

                pointerEvent.preventDefault();
                pointerEvent.stopPropagation();
            };

            const handleDrag = (pointerEvent) => {
                if (pointerEvent.pointerId !== event.pointerId) {
                    return;
                }

                const travel = Math.hypot(pointerEvent.clientX - startX, pointerEvent.clientY - startY);

                if (!isDragging) {
                    if (travel < 6) {
                        return;
                    }

                    isDragging = true;
                    this.isControlDragActive = true;
                    knob.classList.add('is-dragging');
                }

                updateFromPointer(pointerEvent);
                pointerEvent.preventDefault();
                pointerEvent.stopPropagation();
            };

            const handlePointerUp = (pointerEvent) => finishInteraction(pointerEvent, true);
            const handlePointerCancel = (pointerEvent) => finishInteraction(pointerEvent, false);

            knob.addEventListener('pointermove', handleDrag);
            knob.addEventListener('pointerup', handlePointerUp);
            knob.addEventListener('pointercancel', handlePointerCancel);
        };

        knob.addEventListener('pointerdown', startDrag);
        knob.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                const currentIndex = presetOrder.indexOf(getCurrentPreset.call(this));
                const nextIndex = Math.min(presetOrder.length - 1, currentIndex + 1);
                setPreset.call(this, presetOrder[nextIndex]);
                return;
            }

            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                const currentIndex = presetOrder.indexOf(getCurrentPreset.call(this));
                const nextIndex = Math.max(0, currentIndex - 1);
                setPreset.call(this, presetOrder[nextIndex]);
                return;
            }

            if (event.key === 'Home') {
                event.preventDefault();
                setPreset.call(this, presetOrder[0]);
                return;
            }

            if (event.key === 'End') {
                event.preventDefault();
                setPreset.call(this, getLastPreset);
            }
        });

        syncAria();
    };

    HomeBackgroundScene.prototype.syncDensityControl = function () {
        const config = this.getDensityPresetConfig(this.gridDensityPreset);

        if (this.densityKnob) {
            this.densityKnob.style.setProperty('--density-knob-angle', `${this.densityKnobDisplayAngle}deg`);
            this.densityKnob.setAttribute('aria-label', `Adjust bird density. Current amount: ${config.label}`);
            this.densityKnob.setAttribute('aria-valuenow', String(this.getDensityPresetIndex(this.gridDensityPreset)));
            this.densityKnob.setAttribute('aria-valuetext', config.label);
        }

        if (this.densityValue) {
            this.densityValue.textContent = config.label;
        }
    };

    HomeBackgroundScene.prototype.stepDensityPreset = function (direction = 1) {
        const presetOrder = ['none', 'some', 'many', 'lots'];
        const currentIndex = this.getDensityPresetIndex(this.gridDensityPreset);
        const nextIndex = (currentIndex + direction + presetOrder.length) % presetOrder.length;
        this.setGridDensityPreset(presetOrder[nextIndex]);
    };

    HomeBackgroundScene.prototype.setGridEntropy = function (value) {
        const nextEntropy = THREE.MathUtils.clamp(Number(value) || 0, 0, 3);
        this.gridEntropy = nextEntropy;
        this.updateGridMotionProfile(window.innerWidth < 768);
        this.syncEntropyControl();
        this.refreshPixelBaseColors(true);
        this.refreshPixelShadowAppearance();
    };

    HomeBackgroundScene.prototype.setGridDensityPreset = function (preset, options = {}) {
        const nextPreset = ['none', 'some', 'many', 'lots'].includes(preset) ? preset : 'lots';
        const config = this.getDensityPresetConfig(nextPreset);
        const referenceAngle = options.displayAngle ?? this.densityKnobDisplayAngle;
        this.gridDensityPreset = nextPreset;
        this.gridDensity = config.value;
        this.densityKnobDisplayAngle = this.resolveContinuousAngle(config.angle, referenceAngle);
        this.syncDensityControl();
        this.buildPixelGrid();
        this.applyTheme();
    };

    HomeBackgroundScene.prototype.bindDensityControl = function () {
        this.densityKnob = document.querySelector('[data-density-knob]');
        this.densityValue = document.querySelector('[data-density-value]');

        this.bindPresetKnob(this.densityKnob, {
            presetOrder: ['none', 'some', 'many', 'lots'],
            getConfig: this.getDensityPresetConfig,
            getCurrentPreset: function () {
                return this.gridDensityPreset;
            },
            getCurrentDisplayAngle: function () {
                return this.densityKnobDisplayAngle;
            },
            setPreset: this.setGridDensityPreset,
            syncControl: this.syncDensityControl,
            getLastPreset: 'lots',
            angleVar: '--density-knob-angle',
            setDisplayAngle: function (angle) {
                this.densityKnobDisplayAngle = angle;
            }
        });
    };

    HomeBackgroundScene.prototype.getSpherePresetConfig = function (preset) {
        const configMap = {
            none: { label: 'None', radius: 0, influenceRadius: 0, angle: 225 },
            small: { label: 'Neutron', radius: 0.5, influenceRadius: 1.5, angle: 315 },
            medium: { label: 'Dwarf', radius: 2.35, influenceRadius: 5.4, angle: 45 },
            large: { label: 'Giant', radius: 5, influenceRadius: 9, angle: 135 }
        };

        return configMap[preset] ?? configMap.medium;
    };

    HomeBackgroundScene.prototype.getSpherePresetIndex = function (preset) {
        const presetOrder = ['none', 'small', 'medium', 'large'];
        const presetIndex = presetOrder.indexOf(preset);
        return presetIndex >= 0 ? presetIndex : 2;
    };

    HomeBackgroundScene.prototype.syncSphereControl = function () {
        const config = this.getSpherePresetConfig(this.sphereSizePreset);

        if (this.sphereSizeKnob) {
            this.sphereSizeKnob.style.setProperty('--sphere-knob-angle', `${this.sphereKnobDisplayAngle}deg`);
            this.sphereSizeKnob.setAttribute('aria-label', `Adjust sun size. Current size: ${config.label}`);
            this.sphereSizeKnob.setAttribute('aria-valuenow', String(this.getSpherePresetIndex(this.sphereSizePreset)));
            this.sphereSizeKnob.setAttribute('aria-valuetext', config.label);
        }

        if (this.sphereSizeValue) {
            this.sphereSizeValue.textContent = config.label;
        }
    };

    HomeBackgroundScene.prototype.setSphereSizePreset = function (preset, options = {}) {
        const nextPreset = ['none', 'small', 'medium', 'large'].includes(preset) ? preset : 'medium';
        const config = this.getSpherePresetConfig(nextPreset);
        const referenceAngle = options.displayAngle ?? this.sphereKnobDisplayAngle;

        this.sphereSizePreset = nextPreset;
        this.sphereRadius = config.radius;
        this.sphereInfluenceRadius = config.influenceRadius;
        this.sphereKnobDisplayAngle = this.resolveContinuousAngle(config.angle, referenceAngle);

        if (nextPreset === 'none') {
            this.burstActive = false;
            this.burstProgress = 0;
            this.sphereStage = 0;
            this.sphereVisible = 0;
            this.shockwaveRing.visible = false;
            this.shockwaveRing.material.opacity = 0;
        }

        this.syncSphereControl();
    };

    HomeBackgroundScene.prototype.stepSphereSizePreset = function (direction = 1) {
        const presetOrder = ['none', 'small', 'medium', 'large'];
        const currentIndex = this.getSpherePresetIndex(this.sphereSizePreset);
        const nextIndex = (currentIndex + direction + presetOrder.length) % presetOrder.length;
        this.setSphereSizePreset(presetOrder[nextIndex]);
    };

    HomeBackgroundScene.prototype.bindSphereControl = function () {
        this.sphereSizeKnob = document.querySelector('[data-sphere-size-knob]');
        this.sphereSizeValue = document.querySelector('[data-sphere-size-value]');

        this.bindPresetKnob(this.sphereSizeKnob, {
            presetOrder: ['none', 'small', 'medium', 'large'],
            getConfig: this.getSpherePresetConfig,
            getCurrentPreset: function () {
                return this.sphereSizePreset;
            },
            getCurrentDisplayAngle: function () {
                return this.sphereKnobDisplayAngle;
            },
            setPreset: this.setSphereSizePreset,
            syncControl: this.syncSphereControl,
            getLastPreset: 'large',
            angleVar: '--sphere-knob-angle',
            setDisplayAngle: function (angle) {
                this.sphereKnobDisplayAngle = angle;
            }
        });
    };

    HomeBackgroundScene.prototype.getMurmurationProfile = function (time) {
        if (!this.murmurationStyle || this.murmurationStyle === 'none' || this.burstActive) {
            return null;
        }

        const entropy = THREE.MathUtils.clamp(this.gridEntropy, 0, 3);
        const fieldX = this.gridFieldHalfWidth || 1;
        const fieldZ = this.gridFieldHalfDepth || 1;
        const profile = {
            style: this.murmurationStyle,
            speed: 0.72,
            singleFlock: false,
            mainCenterX: Math.sin(time * 0.34) * 0.92,
            mainCenterY: 0.48 + Math.cos(time * 0.44 + 0.35) * 0.42,
            mainCenterZ: Math.sin(time * 0.36) * fieldZ * 0.08,
            leftCenterX: -fieldX * 0.34 + Math.cos(time * 0.41) * 0.58,
            leftCenterY: 0.2 + Math.sin(time * 0.52 + 1.1) * 0.28,
            leftCenterZ: -fieldZ * 0.14 + Math.sin(time * 0.47) * fieldZ * 0.06,
            rightCenterX: fieldX * 0.34 + Math.sin(time * 0.37) * 0.58,
            rightCenterY: 0.2 + Math.cos(time * 0.49 + 0.9) * 0.28,
            rightCenterZ: fieldZ * 0.14 + Math.cos(time * 0.43) * fieldZ * 0.06,
            mainStrength: 0.22 + Math.min(0.18, entropy * 0.06),
            sideStrength: 0.13 + Math.min(0.1, entropy * 0.04),
            mainLift: 1.08,
            sideLift: 0.76,
            mainRadiusX: fieldX * 0.18,
            mainRadiusZ: fieldZ * 0.13,
            sideRadiusX: fieldX * 0.11,
            sideRadiusZ: fieldZ * 0.08,
            mainSpanX: fieldX * 0.28,
            mainDepth: fieldZ * 0.12,
            sideSpanX: fieldX * 0.18,
            sideDepth: fieldZ * 0.09,
            breakupStrength: 0,
            rejoinStrength: 0,
            alignmentStrength: 0
        };

        if (this.murmurationStyle === 'halo') {
            profile.speed = 0.66;
            profile.mainLift = 1.22;
            profile.sideLift = 0.9;
            profile.mainRadiusX = fieldX * 0.22;
            profile.mainRadiusZ = fieldZ * 0.16;
            profile.sideRadiusX = fieldX * 0.16;
            profile.sideRadiusZ = fieldZ * 0.11;
        } else if (this.murmurationStyle === 'ribbon') {
            profile.speed = 0.82;
            profile.mainLift = 0.92;
            profile.sideLift = 0.66;
            profile.mainSpanX = fieldX * 0.42;
            profile.mainDepth = fieldZ * 0.14;
            profile.sideSpanX = fieldX * 0.24;
            profile.sideDepth = fieldZ * 0.08;
        } else if (this.murmurationStyle === 'split') {
            profile.speed = 0.74;
            profile.singleFlock = true;
            profile.mainCenterX = Math.sin(time * 0.14) * fieldX * 0.12;
            profile.mainCenterY = 0.22 + Math.sin(time * 0.19 + 0.5) * 0.18;
            profile.mainCenterZ = Math.cos(time * 0.1 + 0.6) * fieldZ * 0.09;
            profile.mainLift = 1.02;
            profile.mainSpanX = fieldX * 0.22;
            profile.mainDepth = fieldZ * 0.16;
            profile.mainRadiusX = fieldX * 0.14;
            profile.mainRadiusZ = fieldZ * 0.16;
            profile.mainStrength = 0.1 + Math.min(0.05, entropy * 0.02);
            profile.breakupStrength = 0.12 + Math.min(0.14, entropy * 0.04);
            profile.rejoinStrength = 0.24 + Math.min(0.08, entropy * 0.03);
            profile.alignmentStrength = 0.08 + Math.min(0.04, entropy * 0.02);
            profile.spindleLength = Math.max(fieldX * 0.28, fieldZ * 0.58);
            profile.spindleRadius = Math.max(this.gridSpacing * 20, Math.min(fieldX * 0.28, fieldZ * 0.42));
            profile.spindleTaper = 1.3;
            profile.spindleTwist = Math.PI * 1.25;
            profile.spindlePulseSpeed = 0.68;
            profile.shapeGrip = 0.08 + Math.min(0.03, entropy * 0.015);
            profile.formationCycleRate = 0.11;
            profile.freeFloatStrength = this.gridSpacing * (18 + entropy * 6.4);
            profile.cometLength = Math.max(fieldX * 0.24, fieldZ * 0.48);
            profile.cometRadius = Math.max(this.gridSpacing * 18, Math.min(fieldX * 0.18, fieldZ * 0.28));
            profile.branchLength = Math.max(fieldX * 0.18, fieldZ * 0.34);
            profile.branchSpread = Math.max(this.gridSpacing * 18, Math.min(fieldX * 0.3, fieldZ * 0.34));
            profile.branchLift = Math.max(this.gridSpacing * 6, fieldX * 0.07);
            profile.branchCloudRadius = Math.max(this.gridSpacing * 14, Math.min(fieldX * 0.18, fieldZ * 0.24));
            profile.neighborSpacing = this.gridSpacing * (18 + entropy * 4.5);
            profile.neighborSpacingSq = profile.neighborSpacing * profile.neighborSpacing;
            profile.separationStrength = this.gridSpacing * (16 + entropy * 5);
            profile.sideStrength = 0;
        }

        return profile;
    };

    HomeBackgroundScene.prototype.syncMurmurationControls = function () {
        if (!this.murmurationButtons?.length) {
            return;
        }

        this.murmurationButtons.forEach((button) => {
            const isActive = button.dataset.murmurationStyle === this.murmurationStyle;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    };

    HomeBackgroundScene.prototype.setMurmurationStyle = function (style, options = {}) {
        const normalizedStyle = ['halo', 'ribbon', 'split', 'none'].includes(style) ? style : 'none';
        const nextStyle = options.toggle === false
            ? normalizedStyle
            : (normalizedStyle === this.murmurationStyle ? 'none' : normalizedStyle);
        const shouldApplyEntropyPreset = options.applyEntropyPreset !== false;
        this.murmurationStyle = nextStyle;

        if (shouldApplyEntropyPreset) {
            if (nextStyle === 'split') {
                this.setGridEntropy(2);
            } else if (nextStyle === 'halo' || nextStyle === 'ribbon') {
                this.setGridEntropy(0.8);
            }
        }

        this.syncMurmurationControls();
    };

    HomeBackgroundScene.prototype.bindMurmurationControls = function () {
        this.murmurationButtons = Array.from(document.querySelectorAll('[data-murmuration-style]'));

        if (!this.murmurationButtons.length) {
            return;
        }

        this.syncMurmurationControls();
        this.murmurationButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.setMurmurationStyle(button.dataset.murmurationStyle);
            });
        });
    };

    HomeBackgroundScene.prototype.syncMurmurationToneControl = function () {
        if (!this.murmurationToneButton) {
            return;
        }

        const isMono = this.murmurationTone === 'mono';
        if (isMono) {
            this.root.dataset.homeTone = 'mono';
        } else {
            this.root.removeAttribute('data-home-tone');
        }
        this.murmurationToneButton.classList.toggle('is-active', isMono);
        this.murmurationToneButton.setAttribute('aria-pressed', String(isMono));
        this.murmurationToneButton.setAttribute('aria-label', isMono ? 'Turn Kurosawa mode off' : 'Turn Kurosawa mode on');
        this.murmurationToneButton.dataset.toneTarget = isMono ? 'off' : 'kurosawa';
        if (this.murmurationToneLabel) {
            this.murmurationToneLabel.textContent = 'Kurosawa';
        }
    };

    HomeBackgroundScene.prototype.setMurmurationTone = function (tone, options = {}) {
        const shouldApplyEntropyPreset = options.applyEntropyPreset !== false && !this.sceneOnlyView;
        this.murmurationTone = tone === 'mono' ? 'mono' : 'default';

        if (shouldApplyEntropyPreset) {
            this.setGridEntropy(this.murmurationTone === 'mono' ? 3 : 0);
        }

        this.syncMurmurationToneControl();
        this.applyTheme();

        if (this.musicEnabled) {
            this.syncMusicSource();
        }
    };

    HomeBackgroundScene.prototype.bindMurmurationToneControl = function () {
        this.murmurationToneButton = document.querySelector('[data-murmuration-tone-toggle]');

        if (!this.murmurationToneButton) {
            return;
        }

        this.murmurationToneLabel = this.murmurationToneButton.querySelector('[data-murmuration-tone-label]');
        this.syncMurmurationToneControl();
        this.murmurationToneButton.addEventListener('click', () => {
            this.setMurmurationTone(this.murmurationTone === 'mono' ? 'default' : 'mono');
        });
    };

    HomeBackgroundScene.prototype.getMusicTrackForTone = function (tone) {
        if (this.sceneOnlyView) {
            return {
                key: 'murmurations',
                sources: [
                    {
                        src: 'Assets/music/murmurations.webm',
                        type: 'audio/webm; codecs="opus"'
                    }
                ]
            };
        }

        if (tone !== 'mono') {
            return {
                key: 'murmurations',
                sources: [
                    {
                        src: 'Assets/music/murmurations.webm',
                        type: 'audio/webm; codecs="opus"'
                    }
                ]
            };
        }

        return {
            key: 'yojimbo-theme-portfolio-128k',
            sources: [
                {
                    src: 'Assets/music/yojimbo-theme-portfolio-128k.webm',
                    type: 'audio/webm; codecs="opus"'
                },
                {
                    src: 'Assets/music/yojimbo-theme-portfolio-128k.mp4',
                    type: 'audio/mp4'
                }
            ]
        };
    };

    HomeBackgroundScene.prototype.resolveMusicTrackSource = function (audio, track) {
        const sources = Array.isArray(track?.sources) ? track.sources : [];

        for (let index = 0; index < sources.length; index += 1) {
            const source = sources[index];
            if (!source?.src) {
                continue;
            }

            if (!source.type) {
                return source.src;
            }

            const support = audio.canPlayType(source.type);
            if (support === 'probably' || support === 'maybe') {
                return source.src;
            }
        }

        return sources[0]?.src || '';
    };

    HomeBackgroundScene.prototype.ensureMusicAudio = function () {
        if (!this.musicAudio) {
            this.musicAudio = new Audio();
            this.musicAudio.loop = true;
            this.musicAudio.preload = 'none';
            this.musicAudio.volume = 0.55;
        }

        return this.musicAudio;
    };

    HomeBackgroundScene.prototype.syncMusicControl = function () {
        if (!this.musicToggleButton) {
            return;
        }

        const isActive = Boolean(this.musicEnabled);
        this.musicToggleButton.classList.toggle('is-active', isActive);
        this.musicToggleButton.setAttribute('aria-pressed', String(isActive));
        this.musicToggleButton.setAttribute('aria-label', isActive ? 'Mute soundtrack' : 'Play soundtrack');
    };

    HomeBackgroundScene.prototype.syncMusicSource = function (options = {}) {
        const audio = this.ensureMusicAudio();
        const nextTrack = this.getMusicTrackForTone(this.murmurationTone);
        const nextTrackKey = nextTrack?.key || '';
        const nextSrc = this.resolveMusicTrackSource(audio, nextTrack);
        const currentTrackKey = audio.dataset.trackKey || '';
        const currentSrc = audio.dataset.trackSrc || '';

        if (currentTrackKey === nextTrackKey && currentSrc === nextSrc && !options.forceRestart) {
            if (this.musicEnabled) {
                const playPromise = audio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {
                        this.musicEnabled = false;
                        this.syncMusicControl();
                    });
                }
            }
            return;
        }

        const shouldResume = this.musicEnabled;
        audio.pause();
        audio.src = nextSrc;
        audio.dataset.trackKey = nextTrackKey;
        audio.dataset.trackSrc = nextSrc;
        audio.load();

        if (!shouldResume) {
            return;
        }

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                this.musicEnabled = false;
                this.syncMusicControl();
            });
        }
    };

    HomeBackgroundScene.prototype.setMusicEnabled = function (enabled) {
        this.musicEnabled = Boolean(enabled);

        if (!this.musicEnabled) {
            if (this.musicAudio) {
                this.musicAudio.pause();
            }
            this.syncMusicControl();
            return;
        }

        this.syncMusicSource({ forceRestart: !this.musicAudio || !this.musicAudio.dataset.trackSrc });
        this.syncMusicControl();
    };

    HomeBackgroundScene.prototype.bindMusicControl = function () {
        this.musicToggleButton = document.querySelector('[data-music-toggle]');

        if (!this.musicToggleButton) {
            return;
        }

        this.syncMusicControl();
        this.musicToggleButton.addEventListener('click', () => {
            this.setMusicEnabled(!this.musicEnabled);
        });
    };

    HomeBackgroundScene.prototype.applySceneViewPreset = function (sceneOnly) {
        this.sceneOnlyView = Boolean(sceneOnly);
        const isCompactViewport = window.innerWidth < 768;

        if (sceneOnly) {
            this.setGridDensityPreset('lots');
            this.setSphereSizePreset('none');
            this.setMurmurationStyle('halo', { toggle: false, applyEntropyPreset: true });
            this.setMurmurationTone('mono', { applyEntropyPreset: false });
            this.setGridEntropy(0.8);
            this.setMusicEnabled(true);
            return;
        }

        this.setGridDensityPreset('lots');
        this.setSphereSizePreset('small');
        this.setMurmurationStyle('none', { toggle: false, applyEntropyPreset: true });
        this.setMurmurationTone('default', { applyEntropyPreset: false });
        this.setGridEntropy(0);
    };

    HomeBackgroundScene.prototype.bindEntropyControl = function () {
        this.entropySlider = document.querySelector('[data-entropy-slider]');
        this.entropyValue = document.querySelector('[data-entropy-value]');

        if (!this.entropySlider) {
            return;
        }

        this.syncEntropyControl();
        this.entropySlider.addEventListener('input', (event) => {
            this.setGridEntropy(event.target.value);
        });
    };
    function initHomeBackground() {
        const container = document.getElementById('three-container');
        if (!container || typeof THREE === 'undefined') {
            return;
        }

        const scene = new HomeBackgroundScene(container);
        scene.bindEntropyControl();
        scene.bindDensityControl();
        scene.bindSphereControl();
        scene.bindMurmurationControls();
        scene.bindMurmurationToneControl();
        scene.bindMusicControl();
        scene.applySceneViewPreset(document.body.classList.contains('home-alt--scene-only'));
        window.addEventListener('home-scene-view', (event) => {
            scene.applySceneViewPreset(Boolean(event.detail?.sceneOnly));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeBackground, { once: true });
    } else {
        initHomeBackground();
    }
})();





