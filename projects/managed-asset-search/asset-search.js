(function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-asset-video-rate]')).forEach(function (video) {
        var rate = Number.parseFloat(video.dataset.assetVideoRate || '1');
        var startAt = Number.parseFloat(video.dataset.assetVideoStart || '0');
        var primeVideo = function () {
            if (Number.isFinite(rate) && rate > 0) {
                video.playbackRate = rate;
            }
            if (Number.isFinite(startAt) && startAt > 0) {
                try {
                    video.currentTime = Math.min(startAt, Math.max(0, video.duration || startAt));
                } catch (error) {}
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        };
        if (video.readyState >= 1) {
            primeVideo();
        } else {
            video.addEventListener('loadedmetadata', primeVideo, { once: true });
        }
    });

    var getThemeKey = function () {
        return document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
    };

    var drawRoundedRect = function (context, x, y, width, height, radius) {
        var clamped = Math.min(radius, width / 2, height / 2);
        context.beginPath();
        context.moveTo(x + clamped, y);
        context.lineTo(x + width - clamped, y);
        context.quadraticCurveTo(x + width, y, x + width, y + clamped);
        context.lineTo(x + width, y + height - clamped);
        context.quadraticCurveTo(x + width, y + height, x + width - clamped, y + height);
        context.lineTo(x + clamped, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - clamped);
        context.lineTo(x, y + clamped);
        context.quadraticCurveTo(x, y, x + clamped, y);
        context.closePath();
    };

    var appendMapChildren = function (nodeMap, nodes, links, parentId, labels, options) {
        var parent = nodeMap.get(parentId);
        if (!parent) {
            return;
        }
        var addNode = function (node) {
            var normalized = Object.assign({ color: '#f0eee7', type: 'cluster', labelSize: 'small', interactive: true }, node);
            nodes.push(normalized);
            nodeMap.set(normalized.id, normalized);
            if (normalized.parent) {
                links.push([normalized.parent, normalized.id]);
            }
            return normalized;
        };
        var origin = new window.THREE.Vector3(parent.position[0], parent.position[1], parent.position[2]);
        var axis = new window.THREE.Vector3(options.axis[0], options.axis[1], options.axis[2]).normalize();
        var normal = new window.THREE.Vector3(-axis.y, axis.x, options.normalZ || 0.1).normalize();
        var depth = new window.THREE.Vector3(0, 0, 1);
        var itemsPerLayer = options.itemsPerLayer || labels.length;
        labels.forEach(function (label, index) {
            var layer = Math.floor(index / itemsPerLayer);
            var indexInLayer = index % itemsPerLayer;
            var countForLayer = Math.min(itemsPerLayer, labels.length - layer * itemsPerLayer);
            var spreadT = countForLayer === 1 ? 0 : indexInLayer / (countForLayer - 1);
            var spread = (spreadT - 0.5) * options.fan;
            var depthWave = Math.sin(spreadT * Math.PI) * options.depth;
            var radial = options.distance + layer * options.layerGap;
            var position = origin.clone().add(axis.clone().multiplyScalar(radial)).add(normal.clone().multiplyScalar(spread)).add(depth.clone().multiplyScalar(depthWave + layer * (options.zLayerStep || 0)));
            addNode({ id: parentId + '-' + String(index + 1).padStart(2, '0'), parent: parentId, label: label, type: options.nodeType || 'branch', labelSize: options.labelSize || 'tiny', color: options.color || parent.color, position: [position.x, position.y, position.z] });
        });
    };

    var buildSystemMapData = function () {
        var nodes = [];
        var links = [];
        var nodeMap = new Map();
        var addNode = function (node) {
            var normalized = Object.assign({ color: '#f0eee7', type: 'cluster', labelSize: 'small', interactive: true }, node);
            nodes.push(normalized);
            nodeMap.set(normalized.id, normalized);
            if (normalized.parent) {
                links.push([normalized.parent, normalized.id]);
            }
            return normalized;
        };
        addNode({ id: 'asset-search-root', label: 'Asset Search', type: 'root', labelSize: 'large', color: '#fff3e2', position: [0, 0, 0] });
        [
            { id: 'marketing', label: 'Marketing', position: [-4.4, 2.6, -0.8], color: '#ffbe86' },
            { id: 'architecture', label: 'Architecture', position: [-2.9, -3.35, 1.1], color: '#e6ddd0' },
            { id: 'hospitality', label: 'Hospitality', position: [2.9, 3.1, -1.2], color: '#f3af7d' },
            { id: 'homes', label: 'Homes', position: [5.1, -0.4, 1.4], color: '#ffd0a4' },
            { id: 'upcoming-projects', label: 'Upcoming Projects', position: [0.2, 4.95, 0.7], color: '#d9e5ff' },
            { id: 'quality-assurance', label: 'Quality and Assurance', position: [-5.55, -0.8, -1.5], color: '#c9d5ea' },
            { id: 'manufacturing', label: 'Manufacturing', position: [1.4, -5.05, -0.9], color: '#a7c8ff' }
        ].forEach(function (hub) {
            addNode({ id: hub.id, parent: 'asset-search-root', label: hub.label, type: 'hub', labelSize: 'medium', color: hub.color, position: hub.position });
        });
        appendMapChildren(nodeMap, nodes, links, 'marketing', ['Campaign Kits', 'Brochures', 'Social Cuts'], { axis: [-1, 0.2, 0.1], distance: 1.65, fan: 2.3, depth: 0.7, layerGap: 0.7, itemsPerLayer: 3, color: '#ffcfaa' });
        appendMapChildren(nodeMap, nodes, links, 'architecture', ['Drawings', 'Renders', 'Wayfinding'], { axis: [-0.85, -0.25, 0.1], distance: 1.55, fan: 2.1, depth: 0.7, layerGap: 0.6, itemsPerLayer: 3, color: '#efe5d9' });
        appendMapChildren(nodeMap, nodes, links, 'upcoming-projects', ['Prelaunch', 'Approvals', 'Investment Packs'], { axis: [0, 1, 0.05], distance: 1.45, fan: 2.4, depth: 0.8, layerGap: 0.7, itemsPerLayer: 3, color: '#d7e5ff' });
        appendMapChildren(nodeMap, nodes, links, 'quality-assurance', ['Site Audits', 'Specifications', 'Punch Lists'], { axis: [-1, -0.05, -0.12], distance: 1.55, fan: 2.2, depth: 0.75, layerGap: 0.6, itemsPerLayer: 3, color: '#bfd0ea' });
        appendMapChildren(nodeMap, nodes, links, 'manufacturing', ['Components', 'Finishes', 'Vendor Packs'], { axis: [0.3, -1, -0.08], distance: 1.75, fan: 2.4, depth: 0.78, layerGap: 0.75, itemsPerLayer: 3, color: '#a8caff' });
        appendMapChildren(nodeMap, nodes, links, 'hospitality', ['Hospitality 01', 'Hospitality 02', 'Hospitality 03'], { axis: [1, 0.25, 0.1], distance: 1.9, fan: 2.1, depth: 0.8, layerGap: 0.75, itemsPerLayer: 3, color: '#f8cba7' });
        appendMapChildren(nodeMap, nodes, links, 'homes', Array.from({ length: 24 }, function (_, index) { return 'Home ' + String(index + 1).padStart(2, '0'); }), { axis: [1, 0.08, 0.06], distance: 2, fan: 6.4, depth: 1.6, layerGap: 1.08, zLayerStep: 0.12, itemsPerLayer: 8, color: '#ffd8b5' });
        return { nodes: nodes, links: links, scale: 0.9, rotationX: 0.14, rotationY: -0.3, cameraZ: 18, pivotId: 'asset-search-root', packetMode: 'return-home', autoPulseDelay: 620, autoPulseBurstCount: 5, maxActivePulses: 34, focusZoom: 12.2 };
    };

    var buildBeforeDamMapData = function () {
        var nodes = [];
        var links = [];
        var nodeMap = new Map();
        var addNode = function (node) {
            var normalized = Object.assign({ color: '#f0eee7', type: 'cluster', labelSize: 'small', interactive: true }, node);
            nodes.push(normalized);
            nodeMap.set(normalized.id, normalized);
            if (normalized.parent) {
                links.push([normalized.parent, normalized.id]);
            }
            return normalized;
        };
        addNode({ id: 'marketing', label: 'Marketing', type: 'root', labelSize: 'large', color: '#fff3e2', position: [0, 0, 0] });
        [
            { id: 'architecture', label: 'Architecture', position: [-4.7, -2.7, 1.1], color: '#e6ddd0' },
            { id: 'hospitality', label: 'Hospitality', position: [3.9, 3.4, -1.1], color: '#f3af7d' },
            { id: 'homes', label: 'Homes', position: [5.4, -0.3, 1.35], color: '#ffd0a4' },
            { id: 'upcoming-projects', label: 'Upcoming Projects', position: [0.15, 5.3, 0.65], color: '#d9e5ff' },
            { id: 'quality-assurance', label: 'Quality and Assurance', position: [-5.45, 0.35, -1.45], color: '#c9d5ea' },
            { id: 'manufacturing', label: 'Manufacturing', position: [1.7, -5.2, -0.95], color: '#a7c8ff' }
        ].forEach(function (hub) {
            addNode({ id: hub.id, parent: 'marketing', label: hub.label, type: 'hub', labelSize: 'medium', color: hub.color, position: hub.position });
        });
        appendMapChildren(nodeMap, nodes, links, 'marketing', ['Campaign Kits', 'Brochures', 'Social Cuts'], { axis: [-1, 0.05, 0.08], distance: 1.75, fan: 2.1, depth: 0.55, layerGap: 0.62, itemsPerLayer: 3, color: '#ffcfaa' });
        appendMapChildren(nodeMap, nodes, links, 'architecture', ['Drawings', 'Renders', 'Wayfinding'], { axis: [-0.92, -0.18, 0.08], distance: 1.6, fan: 2.0, depth: 0.6, layerGap: 0.62, itemsPerLayer: 3, color: '#efe5d9' });
        appendMapChildren(nodeMap, nodes, links, 'upcoming-projects', ['Prelaunch', 'Approvals', 'Investment Packs'], { axis: [0, 1, 0.05], distance: 1.45, fan: 2.2, depth: 0.65, layerGap: 0.65, itemsPerLayer: 3, color: '#d7e5ff' });
        appendMapChildren(nodeMap, nodes, links, 'quality-assurance', ['Site Audits', 'Specifications', 'Punch Lists'], { axis: [-1, 0, -0.1], distance: 1.55, fan: 2.0, depth: 0.68, layerGap: 0.6, itemsPerLayer: 3, color: '#bfd0ea' });
        appendMapChildren(nodeMap, nodes, links, 'manufacturing', ['Components', 'Finishes', 'Vendor Packs'], { axis: [0.3, -1, -0.05], distance: 1.72, fan: 2.2, depth: 0.72, layerGap: 0.72, itemsPerLayer: 3, color: '#a8caff' });
        appendMapChildren(nodeMap, nodes, links, 'hospitality', ['Hospitality 01', 'Hospitality 02', 'Hospitality 03'], { axis: [1, 0.2, 0.1], distance: 1.85, fan: 2.0, depth: 0.72, layerGap: 0.7, itemsPerLayer: 3, color: '#f8cba7' });
        appendMapChildren(nodeMap, nodes, links, 'homes', Array.from({ length: 24 }, function (_, index) { return 'Home ' + String(index + 1).padStart(2, '0'); }), { axis: [1, 0.06, 0.06], distance: 1.95, fan: 6.8, depth: 1.45, layerGap: 1.02, zLayerStep: 0.11, itemsPerLayer: 8, color: '#ffd8b5' });
        return { nodes: nodes, links: links, scale: 0.92, rotationX: 0.11, rotationY: -0.18, cameraZ: 18.5, pivotId: 'marketing', packetMode: 'marketing-bottleneck', autoPulseDelay: 420, autoPulseBurstCount: 5, maxActivePulses: 42, focusZoom: 11.6 };
    };

    var buildInformationArchitectureData = function () {
        var nodes = [];
        var links = [];
        var addNode = function (node) {
            nodes.push(Object.assign({ color: '#ebe6dd', type: 'cluster', labelSize: 'small', interactive: true }, node));
            if (node.parent) {
                links.push([node.parent, node.id]);
            }
        };
        addNode({ id: 'metadata-library', label: 'Metadata Library', type: 'root', labelSize: 'large', color: '#fff1df', position: [-7.9, 0, 0] });
        [
            { label: 'Project', y: 5.4, color: '#ffc992', children: ['Residential', 'Hospitality', 'Commercial', 'Upcoming'], groups: ['Phase', 'Location', 'Typology'] },
            { label: 'Asset Type', y: 2.7, color: '#f0dfcb', children: ['Render', 'Drawing', 'Photo', 'Video'], groups: ['Format', 'View', 'Revision'] },
            { label: 'Discipline', y: 0, color: '#dce6f8', children: ['Architecture', 'Interiors', 'Landscape', 'Services'], groups: ['Scope', 'Package', 'Approval'] },
            { label: 'Usage', y: -2.7, color: '#f4c8a7', children: ['Sales', 'Marketing', 'Construction', 'QA'], groups: ['Audience', 'Channel', 'Campaign'] },
            { label: 'Lifecycle', y: -5.4, color: '#c9daf8', children: ['Concept', 'Review', 'Release', 'Archive'], groups: ['Status', 'Rights', 'Retention'] }
        ].forEach(function (domain, domainIndex) {
            var domainId = 'domain-' + domainIndex;
            addNode({ id: domainId, parent: 'metadata-library', label: domain.label, type: 'hub', labelSize: 'medium', color: domain.color, position: [-3.9, domain.y, domainIndex % 2 === 0 ? 0.4 : -0.5] });
            domain.children.forEach(function (childLabel, childIndex) {
                var childId = domainId + '-set-' + childIndex;
                var childY = domain.y + (childIndex - 1.5) * 1.24;
                var childZ = (childIndex % 2 === 0 ? -0.45 : 0.45) + domainIndex * 0.03;
                addNode({ id: childId, parent: domainId, label: childLabel, type: 'cluster', labelSize: 'small', color: domain.color, position: [-0.6, childY, childZ] });
                domain.groups.forEach(function (groupLabel, groupIndex) {
                    var groupId = childId + '-group-' + groupIndex;
                    var groupY = childY + (groupIndex - 1) * 0.46;
                    var groupZ = childZ + (groupIndex - 1) * 0.18;
                    addNode({ id: groupId, parent: childId, label: groupLabel, type: 'branch', labelSize: 'tiny', color: domain.color, position: [2.5, groupY, groupZ] });
                    Array.from({ length: 5 }).forEach(function (_, leafIndex) {
                        addNode({ id: groupId + '-tag-' + leafIndex, parent: groupId, label: '', type: 'leaf', labelSize: 'tiny', color: domain.color, interactive: false, position: [6.8 + leafIndex * 0.1, groupY + (leafIndex - 2) * 0.13, groupZ + (leafIndex % 2 === 0 ? -0.16 : 0.16)] });
                    });
                });
            });
        });
        return { nodes: nodes, links: links, scale: 0.86, rotationX: 0.02, rotationY: -0.08, cameraZ: 17, pivotId: 'metadata-library', packetMode: 'none', autoPulseDelay: 4000, autoPulseBurstCount: 0, maxActivePulses: 0, focusZoom: 12.8 };
    };

    function AssetSearchStage(container, initialMap) {
        if (!container || !window.THREE) {
            return;
        }
        this.container = container;
        this.activeMap = initialMap || 'after';
        this.themeKey = getThemeKey();
        this.theme = this.getThemePalette(this.themeKey);
        this.scene = new window.THREE.Scene();
        this.camera = new window.THREE.PerspectiveCamera(38, 1, 0.1, 120);
        this.cameraBaseZ = 18;
        this.cameraCurrentZ = this.cameraBaseZ;
        this.cameraTargetZ = this.cameraBaseZ;
        this.minCameraZ = 10;
        this.maxCameraZ = 28;
        this.camera.position.set(0, 0, this.cameraCurrentZ);
        this.renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = window.THREE.sRGBEncoding;
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        this.pointer = new window.THREE.Vector2();
        this.raycaster = new window.THREE.Raycaster();
        this.graphOrbit = new window.THREE.Group();
        this.graphGroup = new window.THREE.Group();
        this.graphOrbit.add(this.graphGroup);
        this.scene.add(this.graphOrbit);
        this.nodes = [];
        this.nodeEntriesById = new Map();
        this.parentLookup = new Map();
        this.childLookup = new Map();
        this.pulses = [];
        this.dragging = false;
        this.dragMoved = false;
        this.pointerId = null;
        this.hoveredId = null;
        this.lastAutoPulse = 0;
        this.autoPulseDelay = 1850;
        this.autoPulseBurstCount = 1;
        this.maxActivePulses = 8;
        this.scrollLockTimeout = null;
        this.frameId = 0;
        this.active = true;
        this.visible = true;
        this.documentVisible = !document.hidden;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.graphTargetOffset = new window.THREE.Vector3();
        this.dragOrigin = null;
        this.currentMapData = null;
        this.lineMaterial = null;
        this.clock = new window.THREE.Clock();
        this.textures = this.createTextures();
        this.geometries = {
            root: new window.THREE.SphereGeometry(1, 28, 28),
            hub: new window.THREE.SphereGeometry(1, 20, 20),
            cluster: new window.THREE.SphereGeometry(1, 16, 16),
            branch: new window.THREE.SphereGeometry(1, 14, 14),
            leaf: new window.THREE.SphereGeometry(1, 10, 10),
            pulse: new window.THREE.SphereGeometry(1, 18, 18)
        };
        this.setupScene();
        this.attachEvents();
        this.handleResize();
        this.setMap(this.activeMap);
        this.updateLoopState();
    }

    AssetSearchStage.prototype.getThemePalette = function (themeKey) {
        if (themeKey === 'light') {
            return {
                labelFill: 'rgba(22, 30, 48, 0.76)',
                labelStroke: 'rgba(255, 255, 255, 0.18)',
                labelText: 'rgba(255, 255, 255, 0.96)',
                starPrimary: '#141414',
                starSecondary: '#4b4b4b',
                starOpacity: 0.08,
                starSize: 0.05,
                ambientIntensity: 1.08,
                keyColor: '#f0eee8',
                keyIntensity: 1.25,
                fillColor: '#9d9d9d',
                fillIntensity: 0.92,
                lineOpacitySystem: 0.28,
                lineOpacityInformation: 0.22,
                pulseColor: '#2f6bff',
                pulseScale: 0.082,
                nodeRootColor: '#111111',
                nodeHubColor: '#1c1c1c',
                nodeClusterColor: '#2a2a2a',
                nodeBranchColor: '#383838',
                nodeLeafColor: '#4d4d4d',
                nodeEmissive: 0.08,
                nodeLeafEmissive: 0.04,
                nodeHalo: 0.045,
                nodeLeafHalo: 0.012
            };
        }
        return {
            labelFill: 'rgba(9, 9, 9, 0.72)',
            labelStroke: 'rgba(255, 255, 255, 0.12)',
            labelText: 'rgba(247, 240, 231, 0.92)',
            starPrimary: '#c8d8ff',
            starSecondary: '#ffb586',
            starOpacity: 0.34,
            starSize: 0.08,
            ambientIntensity: 1.04,
            keyColor: '#ffca94',
            keyIntensity: 2.35,
            fillColor: '#8db7ff',
            fillIntensity: 1.8,
            lineOpacitySystem: 0.32,
            lineOpacityInformation: 0.26,
            pulseColor: '#54a0ff',
            pulseScale: 0.092,
            nodeEmissive: 0.48,
            nodeLeafEmissive: 0.22,
            nodeHalo: 0.18,
            nodeLeafHalo: 0.04
        };
    };

    AssetSearchStage.prototype.createTextures = function () {
        var glowCanvas = document.createElement('canvas');
        glowCanvas.width = 128;
        glowCanvas.height = 128;
        var glowContext = glowCanvas.getContext('2d');
        var glowGradient = glowContext.createRadialGradient(64, 64, 8, 64, 64, 54);
        glowGradient.addColorStop(0, 'rgba(255,255,255,1)');
        glowGradient.addColorStop(0.34, 'rgba(255,255,255,0.9)');
        glowGradient.addColorStop(0.72, 'rgba(255,255,255,0.16)');
        glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
        glowContext.fillStyle = glowGradient;
        glowContext.fillRect(0, 0, 128, 128);
        var pulseCanvas = document.createElement('canvas');
        pulseCanvas.width = 192;
        pulseCanvas.height = 96;
        var pulseContext = pulseCanvas.getContext('2d');
        var pulseGradient = pulseContext.createRadialGradient(96, 48, 8, 96, 48, 54);
        pulseGradient.addColorStop(0, 'rgba(255,255,255,1)');
        pulseGradient.addColorStop(0.18, 'rgba(255,255,255,0.98)');
        pulseGradient.addColorStop(0.58, 'rgba(255,255,255,0.26)');
        pulseGradient.addColorStop(1, 'rgba(255,255,255,0)');
        pulseContext.fillStyle = pulseGradient;
        pulseContext.fillRect(0, 0, 192, 96);
        return { glow: new window.THREE.CanvasTexture(glowCanvas), pulse: new window.THREE.CanvasTexture(pulseCanvas) };
    };

    AssetSearchStage.prototype.setupScene = function () {
        this.ambientLight = new window.THREE.AmbientLight(0xffffff, 1);
        this.keyLight = new window.THREE.PointLight(0xffffff, 2, 80);
        this.fillLight = new window.THREE.PointLight(0xffffff, 1.8, 80);
        this.keyLight.position.set(9, 9, 16);
        this.fillLight.position.set(-12, -8, 12);
        this.scene.add(this.ambientLight, this.keyLight, this.fillLight);
        var geometry = new window.THREE.BufferGeometry();
        var pointCount = 720;
        var positions = new Float32Array(pointCount * 3);
        var colors = new Float32Array(pointCount * 3);
        for (var index = 0; index < pointCount; index += 1) {
            var offset = index * 3;
            positions[offset] = (Math.random() - 0.5) * 34;
            positions[offset + 1] = (Math.random() - 0.5) * 22;
            positions[offset + 2] = (Math.random() - 0.5) * 24;
            colors[offset] = 1;
            colors[offset + 1] = 1;
            colors[offset + 2] = 1;
        }
        geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new window.THREE.BufferAttribute(colors, 3));
        this.starfield = new window.THREE.Points(geometry, new window.THREE.PointsMaterial({ size: this.theme.starSize, transparent: true, opacity: this.theme.starOpacity, depthWrite: false, blending: window.THREE.AdditiveBlending, vertexColors: true }));
        this.scene.add(this.starfield);
        this.applySceneTheme();
    };

    AssetSearchStage.prototype.applySceneTheme = function () {
        this.theme = this.getThemePalette(this.themeKey);
        if (this.ambientLight) {
            this.ambientLight.intensity = this.theme.ambientIntensity;
        }
        if (this.keyLight) {
            this.keyLight.color.set(this.theme.keyColor);
            this.keyLight.intensity = this.theme.keyIntensity;
        }
        if (this.fillLight) {
            this.fillLight.color.set(this.theme.fillColor);
            this.fillLight.intensity = this.theme.fillIntensity;
        }
        if (this.starfield) {
            this.starfield.material.opacity = this.theme.starOpacity;
            this.starfield.material.size = this.theme.starSize;
            var colors = this.starfield.geometry.getAttribute('color');
            for (var index = 0; index < colors.count; index += 1) {
                var shade = new window.THREE.Color(index % 5 === 0 ? this.theme.starSecondary : this.theme.starPrimary);
                colors.setXYZ(index, shade.r, shade.g, shade.b);
            }
            colors.needsUpdate = true;
        }
        if (this.lineMaterial) {
            this.lineMaterial.opacity = this.activeMap === 'information' ? this.theme.lineOpacityInformation : this.theme.lineOpacitySystem;
            this.lineMaterial.needsUpdate = true;
        }
    };

    AssetSearchStage.prototype.getNodeVisualColor = function (node) {
        if (this.themeKey !== 'light') {
            return node.color;
        }
        if (node.type === 'root') {
            return this.theme.nodeRootColor;
        }
        if (node.type === 'hub') {
            return this.theme.nodeHubColor;
        }
        if (node.type === 'branch') {
            return this.theme.nodeBranchColor;
        }
        if (node.type === 'leaf') {
            return this.theme.nodeLeafColor;
        }
        return this.theme.nodeClusterColor;
    };

    AssetSearchStage.prototype.attachEvents = function () {
        var self = this;
        var canvas = this.renderer.domElement;
        this.handleResize = this.handleResize.bind(this);
        this.animate = this.animate.bind(this);
        canvas.addEventListener('pointerdown', function (event) {
            if (event.button !== 0) {
                return;
            }
            self.pointerId = event.pointerId;
            self.dragging = true;
            self.dragMoved = false;
            self.dragOrigin = { x: event.clientX, y: event.clientY, rotationX: self.targetRotationX, rotationY: self.targetRotationY };
            if (canvas.setPointerCapture) {
                canvas.setPointerCapture(event.pointerId);
            }
            self.updatePointer(event);
        });
        canvas.addEventListener('pointermove', function (event) {
            self.updatePointer(event);
            if (self.dragging && self.dragOrigin) {
                var dx = (event.clientX - self.dragOrigin.x) / Math.max(1, self.container.clientWidth);
                var dy = (event.clientY - self.dragOrigin.y) / Math.max(1, self.container.clientHeight);
                self.targetRotationY = self.dragOrigin.rotationY + dx * 2.3;
                self.targetRotationX = Math.max(-0.6, Math.min(0.55, self.dragOrigin.rotationX + dy * 1.8));
                self.dragMoved = self.dragMoved || Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;
                self.setHovered(null);
            } else {
                self.updateHover();
            }
        });
        var releasePointer = function (event) {
            if (self.dragging && !self.dragMoved && self.hoveredId) {
                self.focusNode(self.hoveredId);
                self.triggerNodePulse(self.hoveredId, 1.05);
            }
            self.dragging = false;
            self.dragOrigin = null;
            if (canvas.releasePointerCapture && self.pointerId !== null) {
                try {
                    canvas.releasePointerCapture(self.pointerId);
                } catch (error) {}
            }
            self.pointerId = null;
            self.updatePointer(event);
            self.updateHover();
        };
        canvas.addEventListener('pointerup', releasePointer);
        canvas.addEventListener('pointercancel', releasePointer);
        canvas.addEventListener('pointerleave', function () {
            if (!self.dragging) {
                self.setHovered(null);
            }
        });
        this.container.addEventListener('wheel', function (event) {
            event.preventDefault();
            event.stopPropagation();
            self.lockPageScroll();
            self.cameraTargetZ = Math.max(self.minCameraZ, Math.min(self.maxCameraZ, self.cameraTargetZ + event.deltaY * 0.012));
            self.emitZoomChange();
        }, { passive: false });
        this.container.addEventListener('pointerleave', function () {
            self.unlockPageScroll();
        });
        if (window.ResizeObserver) {
            this.resizeObserver = new window.ResizeObserver(this.handleResize);
            this.resizeObserver.observe(this.container);
        } else {
            window.addEventListener('resize', this.handleResize);
        }
        if (window.IntersectionObserver) {
            this.visibilityObserver = new window.IntersectionObserver(function (entries) {
                self.visible = entries[0] ? entries[0].isIntersecting : true;
                self.updateLoopState();
            }, { threshold: 0.1 });
            this.visibilityObserver.observe(this.container);
        }
        document.addEventListener('visibilitychange', function () {
            self.documentVisible = !document.hidden;
            self.updateLoopState();
        });
    };

    AssetSearchStage.prototype.handleResize = function () {
        var width = Math.max(1, this.container.clientWidth);
        var height = Math.max(1, this.container.clientHeight);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    };

    AssetSearchStage.prototype.getZoomProgress = function () {
        if (this.maxCameraZ === this.minCameraZ) {
            return 0;
        }
        return Math.max(0, Math.min(1, (this.maxCameraZ - this.cameraTargetZ) / (this.maxCameraZ - this.minCameraZ)));
    };

    AssetSearchStage.prototype.emitZoomChange = function () {
        if (!this.container || typeof window.CustomEvent !== 'function') {
            return;
        }
        this.container.dispatchEvent(new window.CustomEvent('assetsearchzoomchange', {
            bubbles: true,
            detail: { stage: this, progress: this.getZoomProgress() }
        }));
    };

    AssetSearchStage.prototype.setZoomProgress = function (progress, options) {
        var settings = options || {};
        var clamped = Math.max(0, Math.min(1, progress));
        var nextZ = this.maxCameraZ - clamped * (this.maxCameraZ - this.minCameraZ);
        this.cameraTargetZ = nextZ;
        if (settings.immediate) {
            this.camera.position.z = nextZ;
        }
        if (!settings.silent) {
            this.emitZoomChange();
        }
    };

    AssetSearchStage.prototype.lockPageScroll = function () {
        var self = this;
        document.body.classList.add('asset-search-scroll-locked');
        if (this.scrollLockTimeout) {
            window.clearTimeout(this.scrollLockTimeout);
        }
        this.scrollLockTimeout = window.setTimeout(function () {
            self.unlockPageScroll();
        }, 180);
    };

    AssetSearchStage.prototype.unlockPageScroll = function () {
        if (this.scrollLockTimeout) {
            window.clearTimeout(this.scrollLockTimeout);
            this.scrollLockTimeout = null;
        }
        document.body.classList.remove('asset-search-scroll-locked');
    };

    AssetSearchStage.prototype.makeLabelSprite = function (text, node) {
        if (!text) {
            return null;
        }
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var fontSize = node.labelSize === 'large' ? 30 : node.labelSize === 'medium' ? 22 : node.labelSize === 'small' ? 18 : 16;
        var fontWeight = node.labelSize === 'large' ? 700 : 600;
        var fontFamily = node.labelSize === 'large' ? '"Instrument Sans", sans-serif' : '"Space Mono", monospace';
        context.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;
        var paddingX = node.labelSize === 'tiny' ? 20 : 26;
        var paddingY = node.labelSize === 'tiny' ? 14 : 18;
        var textWidth = Math.ceil(context.measureText(text).width);
        canvas.width = textWidth + paddingX * 2;
        canvas.height = fontSize + paddingY * 2;
        context.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        drawRoundedRect(context, 2, 2, canvas.width - 4, canvas.height - 4, 18);
        context.fillStyle = this.theme.labelFill;
        context.fill();
        context.strokeStyle = this.theme.labelStroke;
        context.lineWidth = 2;
        context.stroke();
        context.fillStyle = this.theme.labelText;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        var texture = new window.THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        var material = new window.THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
        var sprite = new window.THREE.Sprite(material);
        var width = node.labelSize === 'large' ? 2.8 : node.labelSize === 'medium' ? 2.2 : node.labelSize === 'small' ? 1.65 : 1.42;
        var ratio = canvas.height / canvas.width;
        sprite.scale.set(width, width * ratio, 1);
        return sprite;
    };

    AssetSearchStage.prototype.disposeChild = function (child) {
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(function (material) {
                    if (material.map) {
                        material.map.dispose();
                    }
                    material.dispose();
                });
            } else {
                if (child.material.map) {
                    child.material.map.dispose();
                }
                child.material.dispose();
            }
        }
        if (child.geometry) {
            child.geometry.dispose();
        }
    };

    AssetSearchStage.prototype.clearPulse = function (pulse) {
        if (!pulse) {
            return;
        }
        if (pulse.group && pulse.group.parent) {
            pulse.group.parent.remove(pulse.group);
        }
        if (pulse.body && pulse.body.parent) {
            pulse.body.parent.remove(pulse.body);
        }
        if (pulse.glow && pulse.glow.material) {
            pulse.glow.material.dispose();
        }
        if (pulse.body && pulse.body.material) {
            pulse.body.material.dispose();
        }
    };

    AssetSearchStage.prototype.clearGraph = function () {
        while (this.graphGroup.children.length) {
            var child = this.graphGroup.children[0];
            this.graphGroup.remove(child);
            this.disposeChild(child);
        }
        this.pulses.forEach(this.clearPulse.bind(this));
        this.nodes = [];
        this.nodeEntriesById = new Map();
        this.parentLookup = new Map();
        this.childLookup = new Map();
        this.pulses = [];
        this.hoveredId = null;
        this.lineMaterial = null;
    };

    AssetSearchStage.prototype.setMap = function (mapKey, options) {
        options = options || {};
        var preserveView = Boolean(options.preserveView);
        var mapData = mapKey === 'information' ? buildInformationArchitectureData() : mapKey === 'before' ? buildBeforeDamMapData() : buildSystemMapData();
        this.activeMap = mapKey;
        this.currentMapData = mapData;
        this.clearGraph();
        this.applySceneTheme();
        var linePositions = [];
        var lineColors = [];
        var lookup = new Map();
        var stage = this;
        mapData.nodes.forEach(function (node) { lookup.set(node.id, node); });
        mapData.links.forEach(function (pair) {
            var start = lookup.get(pair[0]);
            var end = lookup.get(pair[1]);
            if (!start || !end) {
                return;
            }
            linePositions.push(start.position[0], start.position[1], start.position[2], end.position[0], end.position[1], end.position[2]);
            var startColor = new window.THREE.Color(stage.getNodeVisualColor(start));
            var endColor = new window.THREE.Color(stage.getNodeVisualColor(end));
            lineColors.push(startColor.r, startColor.g, startColor.b, endColor.r, endColor.g, endColor.b);
        });
        var lineGeometry = new window.THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(lineColors, 3));
        this.lineMaterial = new window.THREE.LineBasicMaterial({ transparent: true, opacity: mapKey === 'information' ? this.theme.lineOpacityInformation : this.theme.lineOpacitySystem, vertexColors: true });
        this.graphGroup.add(new window.THREE.LineSegments(lineGeometry, this.lineMaterial));
        var self = this;
        mapData.nodes.forEach(function (node) {
            self.parentLookup.set(node.id, node.parent || null);
            if (node.parent) {
                var children = self.childLookup.get(node.parent) || [];
                children.push(node.id);
                self.childLookup.set(node.parent, children);
            }
            var geometryKey = node.type === 'root' ? 'root' : node.type === 'hub' ? 'hub' : node.type === 'leaf' ? 'leaf' : node.type === 'branch' ? 'branch' : 'cluster';
            var visualColor = self.getNodeVisualColor(node);
            var material = new window.THREE.MeshStandardMaterial({ color: visualColor, emissive: visualColor, emissiveIntensity: node.type === 'leaf' ? self.theme.nodeLeafEmissive : self.theme.nodeEmissive, roughness: 0.34, metalness: 0.12, transparent: true, opacity: node.type === 'leaf' ? 0.82 : 0.96 });
            var mesh = new window.THREE.Mesh(self.geometries[geometryKey], material);
            var baseScale = node.type === 'root' ? 0.4 : node.type === 'hub' ? 0.24 : node.type === 'branch' ? 0.12 : node.type === 'leaf' ? 0.042 : 0.14;
            mesh.scale.setScalar(baseScale);
            mesh.position.set(node.position[0], node.position[1], node.position[2]);
            mesh.userData.nodeId = node.id;
            var halo = new window.THREE.Sprite(new window.THREE.SpriteMaterial({ map: self.textures.glow, color: visualColor, transparent: true, opacity: node.type === 'leaf' ? self.theme.nodeLeafHalo : self.theme.nodeHalo, depthWrite: false, blending: window.THREE.AdditiveBlending }));
            var haloScale = node.type === 'leaf' ? 0.36 : baseScale * 7.2;
            halo.scale.set(haloScale, haloScale, 1);
            halo.position.copy(mesh.position);
            var label = self.makeLabelSprite(node.label, node);
            if (label) {
                label.userData.nodeId = node.id;
                label.position.set(node.position[0], node.position[1] + baseScale * (node.type === 'root' ? 6.2 : 5.2), node.position[2]);
            }
            self.graphGroup.add(halo);
            self.graphGroup.add(mesh);
            if (label) {
                self.graphGroup.add(label);
            }
            var entry = { id: node.id, config: node, mesh: mesh, halo: halo, label: label, baseScale: baseScale, pulse: 0 };
            self.nodes.push(entry);
            self.nodeEntriesById.set(node.id, entry);
        });
        this.graphGroup.scale.setScalar(mapData.scale);
        this.autoPulseDelay = mapData.autoPulseDelay || 1850;
        this.autoPulseBurstCount = Math.max(0, mapData.autoPulseBurstCount || 0);
        this.maxActivePulses = Math.max(0, mapData.maxActivePulses || 0);
        if (!preserveView) {
            this.graphTargetOffset.set(0, 0, 0);
            this.graphGroup.position.set(0, 0, 0);
            this.targetRotationX = mapData.rotationX;
            this.targetRotationY = mapData.rotationY;
            this.rotationX = mapData.rotationX;
            this.rotationY = mapData.rotationY;
            this.cameraCurrentZ = mapData.cameraZ || this.cameraBaseZ;
            this.cameraTargetZ = this.cameraCurrentZ;
            this.camera.position.z = this.cameraCurrentZ;
        }
        this.graphOrbit.rotation.set(this.rotationX, this.rotationY, 0);
        this.lastAutoPulse = 0;
        this.emitZoomChange();
    };

    AssetSearchStage.prototype.resetView = function (options) {
        var mapData = this.currentMapData;
        var immediate = options && options.immediate;
        if (!mapData) {
            return;
        }
        this.graphTargetOffset.set(0, 0, 0);
        this.targetRotationX = mapData.rotationX;
        this.targetRotationY = mapData.rotationY;
        this.cameraTargetZ = mapData.cameraZ || this.cameraBaseZ;
        this.setHovered(null);
        if (immediate) {
            this.graphGroup.position.set(0, 0, 0);
            this.rotationX = this.targetRotationX;
            this.rotationY = this.targetRotationY;
            this.graphOrbit.rotation.set(this.rotationX, this.rotationY, 0);
            this.camera.position.z = this.cameraTargetZ;
        }
        this.emitZoomChange();
    };

    AssetSearchStage.prototype.setTheme = function (themeKey) {
        if (themeKey === this.themeKey) {
            return;
        }
        this.themeKey = themeKey;
        this.theme = this.getThemePalette(themeKey);
        this.setMap(this.activeMap, { preserveView: true });
    };

    AssetSearchStage.prototype.updatePointer = function (event) {
        var rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    AssetSearchStage.prototype.updateHover = function () {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        var targets = [];
        this.nodes.forEach(function (entry) {
            if (entry.config.interactive === false) {
                return;
            }
            targets.push(entry.mesh);
            if (entry.label) {
                targets.push(entry.label);
            }
        });
        var intersections = this.raycaster.intersectObjects(targets, false);
        var hit = intersections[0];
        this.setHovered(hit ? hit.object.userData.nodeId : null);
    };

    AssetSearchStage.prototype.setHovered = function (nodeId) {
        if (this.hoveredId === nodeId) {
            return;
        }
        this.hoveredId = nodeId;
        this.renderer.domElement.style.cursor = nodeId ? 'pointer' : (this.dragging ? 'grabbing' : 'grab');
    };

    AssetSearchStage.prototype.getNeighbors = function (nodeId) {
        var neighbors = [];
        var parentId = this.parentLookup.get(nodeId);
        if (parentId) {
            neighbors.push(parentId);
        }
        (this.childLookup.get(nodeId) || []).forEach(function (childId) {
            neighbors.push(childId);
        });
        return neighbors;
    };

    AssetSearchStage.prototype.focusNode = function (nodeId) {
        var entry = this.nodeEntriesById.get(nodeId);
        if (!entry) {
            return;
        }
        var pivotPosition = entry.mesh.position.clone();
        var focusEntries = [entry].concat(this.getNeighbors(nodeId).map(function (neighborId) {
            return this.nodeEntriesById.get(neighborId);
        }, this).filter(Boolean));
        var focusRadius = 0.9;
        focusEntries.forEach(function (focusEntry) {
            focusRadius = Math.max(focusRadius, focusEntry.mesh.position.distanceTo(pivotPosition));
        });
        this.graphTargetOffset.copy(pivotPosition).multiplyScalar(-(this.graphGroup.scale.x || 1));
        this.cameraTargetZ = Math.max(this.minCameraZ, Math.min(this.maxCameraZ, ((this.currentMapData && this.currentMapData.focusZoom) || 12) + focusRadius * 0.5));
        entry.pulse = Math.max(entry.pulse, 1.15);
        focusEntries.forEach(function (focusEntry, index) {
            if (index === 0) {
                return;
            }
            focusEntry.pulse = Math.max(focusEntry.pulse, 0.72);
        });
        this.emitZoomChange();
    };

    AssetSearchStage.prototype.getAncestorChain = function (nodeId) {
        var chain = [];
        var currentId = nodeId;
        while (currentId) {
            chain.push(currentId);
            currentId = this.parentLookup.get(currentId);
        }
        return chain;
    };

    AssetSearchStage.prototype.buildPathBetween = function (startId, endId) {
        if (!startId || !endId) {
            return [];
        }
        if (startId === endId) {
            return [startId];
        }
        var startChain = this.getAncestorChain(startId);
        var endChain = this.getAncestorChain(endId);
        var startIndexMap = new Map();
        startChain.forEach(function (id, index) { startIndexMap.set(id, index); });
        var lca = null;
        var endLcaIndex = -1;
        for (var index = 0; index < endChain.length; index += 1) {
            if (startIndexMap.has(endChain[index])) {
                lca = endChain[index];
                endLcaIndex = index;
                break;
            }
        }
        if (!lca) {
            return [startId, endId];
        }
        var startLcaIndex = startIndexMap.get(lca);
        var pathUp = startChain.slice(0, startLcaIndex + 1);
        var pathDown = endChain.slice(0, endLcaIndex).reverse();
        return pathUp.concat(pathDown);
    };

    AssetSearchStage.prototype.pickRelayTarget = function (originId) {
        var pivotId = this.currentMapData && this.currentMapData.pivotId;
        var candidates = this.nodes.filter(function (entry) {
            return entry.config.interactive !== false && entry.id !== originId && entry.id !== pivotId && entry.config.type !== 'root';
        });
        if (!candidates.length) {
            return pivotId || originId;
        }
        var preferred = candidates.filter(function (entry) {
            return entry.config.type === 'hub' || entry.config.type === 'branch' || entry.config.type === 'cluster';
        });
        var selection = preferred.length ? preferred : candidates;
        return selection[Math.floor(Math.random() * selection.length)].id;
    };

    AssetSearchStage.prototype.getSegmentKey = function (fromId, toId) {
        return fromId < toId ? fromId + '::' + toId : toId + '::' + fromId;
    };

    AssetSearchStage.prototype.getRouteLoad = function (nodeIds) {
        var self = this;
        var segmentCounts = new Map();
        this.pulses.forEach(function (pulse) {
            var activeFrom = pulse.nodeIds[pulse.segmentIndex];
            var activeTo = pulse.nodeIds[pulse.segmentIndex + 1];
            if (!activeFrom || !activeTo) {
                return;
            }
            var activeKey = self.getSegmentKey(activeFrom, activeTo);
            segmentCounts.set(activeKey, (segmentCounts.get(activeKey) || 0) + 1);
        });
        var maxLoad = 0;
        for (var index = 0; index < nodeIds.length - 1; index += 1) {
            var nextLoad = (segmentCounts.get(this.getSegmentKey(nodeIds[index], nodeIds[index + 1])) || 0) + 1;
            maxLoad = Math.max(maxLoad, nextLoad);
        }
        return maxLoad;
    };

    AssetSearchStage.prototype.getPacketColor = function (loadLevel) {
        if ((this.currentMapData && this.currentMapData.packetMode) !== 'marketing-bottleneck') {
            return this.theme.pulseColor;
        }
        if (loadLevel >= 5) {
            return '#ff5545';
        }
        if (loadLevel >= 3) {
            return '#ffd452';
        }
        return this.theme.pulseColor;
    };

    AssetSearchStage.prototype.buildPacketRoute = function (nodeId) {
        var pivotId = this.currentMapData && this.currentMapData.pivotId;
        var packetMode = this.currentMapData && this.currentMapData.packetMode;
        if (packetMode === 'return-home') {
            var homeId = nodeId === pivotId ? this.pickRelayTarget(nodeId) : nodeId;
            var inbound = this.buildPathBetween(homeId, pivotId);
            if (homeId !== 'marketing' && Math.random() < 0.5) {
                var routeToMarketing = this.buildPathBetween(pivotId, 'marketing').slice(1);
                var routeBackFromMarketing = this.buildPathBetween('marketing', pivotId).slice(1);
                return inbound.concat(routeToMarketing, routeBackFromMarketing, inbound.slice(0, -1).reverse());
            }
            return inbound.concat(inbound.slice(0, -1).reverse());
        }
        if (packetMode === 'marketing-bottleneck') {
            var originId = nodeId === pivotId ? this.pickRelayTarget(nodeId) : nodeId;
            var targetId = this.pickRelayTarget(originId);
            var inboundRoute = this.buildPathBetween(originId, pivotId);
            var outboundRoute = this.buildPathBetween(pivotId, targetId).slice(1);
            return inboundRoute.concat(outboundRoute);
        }
        return [];
    };

    AssetSearchStage.prototype.createPulse = function (nodeIds) {
        var packetMode = this.currentMapData && this.currentMapData.packetMode;
        if (!packetMode || packetMode === 'none') {
            return;
        }
        var self = this;
        var compactNodeIds = nodeIds.filter(function (nodeId, index) {
            return index === 0 || nodeId !== nodeIds[index - 1];
        });
        var points = compactNodeIds.map(function (nodeId) {
            var entry = self.nodeEntriesById.get(nodeId);
            return entry ? entry.mesh.position.clone() : null;
        }).filter(Boolean);
        if (points.length < 2) {
            return;
        }
        var loadLevel = this.getRouteLoad(compactNodeIds);
        var body = new window.THREE.Mesh(this.geometries.pulse, new window.THREE.MeshBasicMaterial({ color: this.getPacketColor(loadLevel), transparent: true, opacity: 0.96, depthWrite: false }));
        body.scale.setScalar(this.theme.pulseScale);
        body.position.copy(points[0]);
        this.graphGroup.add(body);
        if (this.pulses.length >= this.maxActivePulses) {
            this.clearPulse(this.pulses.shift());
        }
        this.pulses.push({ body: body, points: points, nodeIds: compactNodeIds, segmentIndex: 0, progress: 0, speed: packetMode === 'marketing-bottleneck' ? 6.4 : 5.5 });
    };

    AssetSearchStage.prototype.triggerNodePulse = function (nodeId, strength) {
        var entry = this.nodeEntriesById.get(nodeId);
        if (!entry) {
            return;
        }
        entry.pulse = Math.max(entry.pulse, strength || 1);
        var route = this.buildPacketRoute(nodeId);
        if (route.length > 1) {
            this.createPulse(route);
        }
    };

    AssetSearchStage.prototype.updateLoopState = function () {
        var shouldRun = this.active && this.visible && this.documentVisible;
        if (shouldRun && !this.frameId) {
            this.frameId = window.requestAnimationFrame(this.animate);
        } else if (!shouldRun && this.frameId) {
            window.cancelAnimationFrame(this.frameId);
            this.frameId = 0;
        }
    };

    AssetSearchStage.prototype.setActive = function (active) {
        this.active = active;
        this.updateLoopState();
    };

    AssetSearchStage.prototype.animate = function (time) {
        this.frameId = 0;
        var delta = Math.min(this.clock.getDelta(), 0.033);
        this.rotationY += (this.targetRotationY - this.rotationY) * 0.08;
        this.rotationX += (this.targetRotationX - this.rotationX) * 0.08;
        this.camera.position.z += (this.cameraTargetZ - this.camera.position.z) * 0.16;
        this.graphGroup.position.lerp(this.graphTargetOffset, 0.14);
        this.graphOrbit.rotation.y = this.rotationY + Math.sin(time * 0.00012) * 0.025;
        this.graphOrbit.rotation.x = this.rotationX + Math.cos(time * 0.00018) * 0.012;
        this.starfield.rotation.y += delta * 0.008;
        this.starfield.rotation.x = Math.sin(time * 0.00008) * 0.04;
        if (this.currentMapData && this.currentMapData.packetMode !== 'none' && time - this.lastAutoPulse > this.autoPulseDelay) {
            var pivotId = this.currentMapData && this.currentMapData.pivotId;
            var candidates = this.nodes.filter(function (entry) {
                return entry.config.interactive !== false && entry.id !== pivotId && entry.config.type !== 'root' && entry.config.type !== 'leaf';
            });
            for (var burstIndex = 0; burstIndex < this.autoPulseBurstCount; burstIndex += 1) {
                var next = candidates[Math.floor(Math.random() * candidates.length)];
                if (next) {
                    this.triggerNodePulse(next.id, 0.75);
                }
            }
            this.lastAutoPulse = time;
        }
        this.nodes.forEach(function (entry) {
            entry.pulse *= 0.9;
            var isHovered = entry.id === this.hoveredId;
            var targetScale = entry.baseScale * (1 + entry.pulse * 0.32 + (isHovered ? 0.16 : 0));
            entry.mesh.scale.lerp(new window.THREE.Vector3(targetScale, targetScale, targetScale), 0.18);
            entry.mesh.material.emissiveIntensity = entry.config.type === 'leaf' ? 0.18 + entry.pulse * 0.36 + (isHovered ? 0.14 : 0) : 0.38 + entry.pulse * 0.72 + (isHovered ? 0.18 : 0);
            entry.halo.material.opacity = (entry.config.type === 'leaf' ? 0.03 : 0.15) + entry.pulse * 0.24 + (isHovered ? 0.08 : 0);
            var haloScale = entry.config.type === 'leaf' ? 0.34 + entry.pulse * 0.18 : entry.baseScale * (7 + entry.pulse * 2.6 + (isHovered ? 0.75 : 0));
            entry.halo.scale.set(haloScale, haloScale, 1);
            if (entry.label) {
                entry.label.material.opacity = entry.config.labelSize === 'large' ? 1 : 0.88 + entry.pulse * 0.08 + (isHovered ? 0.05 : 0);
            }
        }, this);
        this.pulses = this.pulses.filter(function (pulse) {
            var start = pulse.points[pulse.segmentIndex];
            var end = pulse.points[pulse.segmentIndex + 1];
            if (!start || !end) {
                this.clearPulse(pulse);
                return false;
            }
            var segmentLength = Math.max(start.distanceTo(end), 0.001);
            pulse.progress += delta * pulse.speed / segmentLength;
            if (pulse.progress >= 1) {
                var reachedId = pulse.nodeIds[Math.min(pulse.segmentIndex + 1, pulse.nodeIds.length - 1)];
                var reachedEntry = this.nodeEntriesById.get(reachedId);
                if (reachedEntry) {
                    reachedEntry.pulse = Math.max(reachedEntry.pulse, 0.76);
                }
                pulse.segmentIndex += 1;
                pulse.progress = 0;
                if (pulse.segmentIndex >= pulse.points.length - 1) {
                    this.clearPulse(pulse);
                    return false;
                }
                start = pulse.points[pulse.segmentIndex];
                end = pulse.points[pulse.segmentIndex + 1];
            }
            pulse.body.position.copy(start).lerp(end, pulse.progress);
            pulse.body.material.opacity = 0.74 + Math.sin(pulse.progress * Math.PI) * 0.16;
            return true;
        }, this);
        this.renderer.render(this.scene, this.camera);
        this.updateLoopState();
    };

    var inlineStageContainers = Array.prototype.slice.call(document.querySelectorAll('[data-asset-map-stage="inline"]'));
    var modalStageContainer = document.querySelector('[data-asset-map-stage="modal"]');
    var modalRoot = document.getElementById('asset-search-map-modal');
    var videoModalRoot = document.getElementById('asset-search-video-modal');
    var videoModalStage = document.querySelector('[data-asset-video-modal-stage]');
    var videoModalTitle = document.querySelector('[data-asset-video-modal-title]');
    var videoModalCopy = document.querySelector('[data-asset-video-modal-copy]');
    var expandButtons = Array.prototype.slice.call(document.querySelectorAll('[data-asset-map-expand]'));
    var resetButtons = Array.prototype.slice.call(document.querySelectorAll('[data-asset-map-reset]'));
    var closeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-asset-map-close]'));
    var videoExpandButtons = Array.prototype.slice.call(document.querySelectorAll('[data-asset-video-expand]'));
    var videoCloseButtons = Array.prototype.slice.call(document.querySelectorAll('[data-asset-video-close]'));
    var toggleButtons = Array.prototype.slice.call(document.querySelectorAll('[data-asset-map-toggle]'));
    var zoomInputs = Array.prototype.slice.call(document.querySelectorAll('[data-asset-map-zoom]'));
    var copyShells = Array.prototype.slice.call(document.querySelectorAll('[data-asset-map-copy-shell]'));
    var stages = [];
    var modalStage = null;
    var initialStageMap = inlineStageContainers[0] && inlineStageContainers[0].dataset.assetMapDefault
        ? inlineStageContainers[0].dataset.assetMapDefault
        : ((toggleButtons.find(function (button) { return button.classList.contains('is-active'); }) || {}).dataset || {}).assetMapToggle || 'after';
    var currentMap = initialStageMap === 'before' || initialStageMap === 'after' || initialStageMap === 'information' ? initialStageMap : 'after';
    var currentTheme = getThemeKey();
    var lastFocusedElement = null;
    var lastVideoFocusedElement = null;

    var clamp = function (value, min, max) {
        return Math.max(min, Math.min(max, value));
    };

    var syncZoomControls = function (progress) {
        var normalized = clamp(Number.isFinite(progress) ? progress : 0.56, 0, 1);
        var nextValue = String(Math.round(normalized * 100));
        zoomInputs.forEach(function (input) {
            input.value = nextValue;
        });
    };

    var syncCopyShells = function () {
        copyShells.forEach(function (shell) {
            var sources = Array.prototype.slice.call(shell.querySelectorAll('[data-asset-map-copy-source]'));
            var activeSource = shell.querySelector('[data-asset-map-copy-source="' + currentMap + '"]') || sources[0] || null;
            var title = shell.querySelector('[data-asset-map-copy-title]');
            var body = shell.querySelector('[data-asset-map-copy-body]');
            if (!activeSource) {
                return;
            }
            shell.dataset.activeMap = currentMap;
            if (title) {
                title.textContent = activeSource.dataset.assetMapCopySourceTitle || '';
            }
            if (body) {
                body.textContent = activeSource.dataset.assetMapCopySourceBody || '';
            }
        });
    };

    var applyZoomValue = function (rawValue) {
        var progress = clamp(Number.parseFloat(rawValue || '0') / 100, 0, 1);
        stages.forEach(function (stage) {
            stage.setZoomProgress(progress);
        });
        syncZoomControls(progress);
    };

    var syncModalBodyLock = function () {
        var isMapOpen = modalRoot && !modalRoot.hidden;
        var isVideoOpen = videoModalRoot && !videoModalRoot.hidden;
        document.body.classList.toggle('asset-search-modal-open', Boolean(isMapOpen || isVideoOpen));
    };

    var createYouTubeEmbedUrl = function (videoId, options) {
        var settings = Object.assign({ autoplay: false, muted: false, controls: true, loop: false }, options);
        var params = ['rel=0', 'modestbranding=1', 'playsinline=1', 'iv_load_policy=3', 'autoplay=' + (settings.autoplay ? '1' : '0'), 'controls=' + (settings.controls ? '1' : '0')];
        if (settings.muted) {
            params.push('mute=1');
        }
        if (settings.loop) {
            params.push('loop=1');
            params.push('playlist=' + encodeURIComponent(videoId));
        }
        return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId) + '?' + params.join('&');
    };

    var clearVideoModal = function () {
        if (videoModalStage) {
            videoModalStage.innerHTML = '';
        }
    };

    var openVideoModal = function (button) {
        if (!videoModalRoot || !videoModalStage || !button) {
            return;
        }
        var provider = button.dataset.assetVideoProvider || 'local';
        var title = button.dataset.assetVideoTitle || 'Asset Search video';
        lastVideoFocusedElement = document.activeElement;
        clearVideoModal();
        if (videoModalTitle) {
            videoModalTitle.textContent = title;
        }
        if (videoModalCopy) {
            videoModalCopy.textContent = provider === 'youtube' ? 'Playing the embedded YouTube walkthrough inside a fullscreen lightbox.' : 'Playing the embedded local walkthrough inside a fullscreen lightbox.';
        }
        if (provider === 'youtube' && button.dataset.assetVideoId) {
            var iframe = document.createElement('iframe');
            iframe.className = 'asset-search__video-modal-player';
            iframe.src = createYouTubeEmbedUrl(button.dataset.assetVideoId, { autoplay: true, muted: false, controls: true, loop: false });
            iframe.title = title;
            iframe.loading = 'eager';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            iframe.setAttribute('allowfullscreen', '');
            videoModalStage.appendChild(iframe);
        } else if (button.dataset.assetVideoSrc) {
            var video = document.createElement('video');
            video.className = 'asset-search__video-modal-player';
            video.src = button.dataset.assetVideoSrc;
            video.controls = true;
            video.autoplay = true;
            video.preload = 'auto';
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            videoModalStage.appendChild(video);
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        }
        videoModalRoot.hidden = false;
        syncModalBodyLock();
    };

    var closeVideoModal = function () {
        if (!videoModalRoot) {
            return;
        }
        videoModalRoot.hidden = true;
        clearVideoModal();
        syncModalBodyLock();
        if (lastVideoFocusedElement && typeof lastVideoFocusedElement.focus === 'function') {
            lastVideoFocusedElement.focus();
        }
    };

    videoExpandButtons.forEach(function (button) { button.addEventListener('click', function () { openVideoModal(button); }); });
    videoCloseButtons.forEach(function (button) { button.addEventListener('click', closeVideoModal); });
    if (videoModalRoot) {
        videoModalRoot.addEventListener('click', function (event) {
            if (event.target === videoModalRoot) {
                closeVideoModal();
            }
        });
    }

    var activateMap = function (mapKey) {
        currentMap = mapKey === 'before' || mapKey === 'after' || mapKey === 'information' ? mapKey : 'after';
        toggleButtons.forEach(function (button) {
            var isActive = button.dataset.assetMapToggle === currentMap;
            button.classList.toggle('is-active', isActive);
            if (button.hasAttribute('aria-pressed')) {
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            }
            if (button.hasAttribute('aria-expanded')) {
                button.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            }
        });
        syncCopyShells();
        stages.forEach(function (stage) { stage.setMap(currentMap); });
        if (stages[0] && typeof stages[0].getZoomProgress === 'function') {
            syncZoomControls(stages[0].getZoomProgress());
        }
    };

    var resetMaps = function () {
        stages.forEach(function (stage) { stage.resetView(); });
        if (stages[0] && typeof stages[0].getZoomProgress === 'function') {
            syncZoomControls(stages[0].getZoomProgress());
        }
    };

    var syncStageThemes = function () {
        var nextTheme = getThemeKey();
        if (nextTheme === currentTheme) {
            return;
        }
        currentTheme = nextTheme;
        stages.forEach(function (stage) { stage.setTheme(nextTheme); });
    };

    document.addEventListener('assetsearchzoomchange', function (event) {
        var detail = event && event.detail ? event.detail : null;
        if (!detail || !Number.isFinite(detail.progress)) {
            return;
        }
        var progress = clamp(detail.progress, 0, 1);
        stages.forEach(function (stage) {
            if (detail.stage && stage !== detail.stage) {
                stage.setZoomProgress(progress, { silent: true });
            }
        });
        syncZoomControls(progress);
    });

    zoomInputs.forEach(function (input) {
        input.addEventListener('input', function () {
            applyZoomValue(input.value);
        });
    });

    if (!window.THREE) {
        inlineStageContainers.concat(modalStageContainer ? [modalStageContainer] : []).forEach(function (container) {
            if (!container) {
                return;
            }
            var fallback = document.createElement('p');
            fallback.className = 'asset-search__map-fallback';
            fallback.textContent = 'Interactive WebGL preview is unavailable right now, but the fullscreen stage is wired in for the live build.';
            container.appendChild(fallback);
        });
        return;
    }

    inlineStageContainers.forEach(function (container) {
        stages.push(new AssetSearchStage(container, currentMap));
    });

    var ensureModalStage = function () {
        if (!modalStage && modalStageContainer) {
            modalStage = new AssetSearchStage(modalStageContainer, currentMap);
            modalStage.setActive(false);
            stages.push(modalStage);
        }
        return modalStage;
    };

    var openModal = function () {
        if (!modalRoot) {
            return;
        }
        lastFocusedElement = document.activeElement;
        modalRoot.hidden = false;
        syncModalBodyLock();
        ensureModalStage();
        if (modalStage) {
            modalStage.setMap(currentMap);
            modalStage.setActive(true);
        }
    };

    var closeModal = function () {
        if (!modalRoot) {
            return;
        }
        modalRoot.hidden = true;
        syncModalBodyLock();
        if (modalStage) {
            modalStage.setActive(false);
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    };

    toggleButtons.forEach(function (button) { button.addEventListener('click', function () { activateMap(button.dataset.assetMapToggle); }); });
    resetButtons.forEach(function (button) { button.addEventListener('click', resetMaps); });
    expandButtons.forEach(function (button) { button.addEventListener('click', openModal); });
    closeButtons.forEach(function (button) { button.addEventListener('click', closeModal); });
    if (modalRoot) {
        modalRoot.addEventListener('click', function (event) {
            if (event.target === modalRoot) {
                closeModal();
            }
        });
    }
    if (window.MutationObserver) {
        var themeObserver = new window.MutationObserver(syncStageThemes);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') {
            return;
        }
        if (videoModalRoot && !videoModalRoot.hidden) {
            closeVideoModal();
            return;
        }
        if (modalRoot && !modalRoot.hidden) {
            closeModal();
        }
    });

    activateMap(currentMap);
})();

















