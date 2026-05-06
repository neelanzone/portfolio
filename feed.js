import * as THREE from 'three';

const MAX_ROTATE_X = 5;
const MAX_ROTATE_Y = 7.5;
const MAX_SHIFT_X = 3;
const MAX_SHIFT_Y = 2;
const GLOSS_PARALLAX = 0.08;
const GLOSS_INTENSITY = 0.34;
const GLOSS_RIM_STRENGTH = 0.12;
const GLOSS_ALPHA_MAX = 0.22;
const GLOSS_COLOR = new THREE.Vector3(0.58, 0.78, 1.0);
const LERP = 0.10;

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function ensureThreeContainer(card, mediaWrap) {
    const existingContainer = Array.from(card.children)
        .find(child => child.classList.contains('feed-card__three-container'));
    if (existingContainer) {
        const linkedCaption = existingContainer.querySelector('.feed-card__caption');
        if (linkedCaption) card.insertBefore(linkedCaption, existingContainer.nextSibling);
        return existingContainer;
    }

    const threeContainer = document.createElement('div');
    threeContainer.className = 'feed-card__three-container';
    card.insertBefore(threeContainer, card.firstChild);
    threeContainer.appendChild(mediaWrap);

    return threeContainer;
}

function initCard(card) {
    if (card.dataset.threeCardReady === 'true') return;

    const mediaWrap = card.querySelector('.feed-card__media-wrap');
    if (!mediaWrap) return;

    const threeContainer = ensureThreeContainer(card, mediaWrap);
    card.dataset.threeCardReady = 'true';

    function trySetup() {
        const width = mediaWrap.offsetWidth;
        const height = mediaWrap.offsetHeight;
        if (!width || !height) {
            setTimeout(trySetup, 60);
            return;
        }
        setupCard(card, threeContainer, mediaWrap, width, height);
    }

    trySetup();
}

function setupCard(card, threeContainer, mediaWrap, width, height) {
    const feedStrip = card.closest('.feed-strip');
    const canvas = document.createElement('canvas');
    canvas.className = 'feed-card__three-canvas';
    canvas.style.mixBlendMode = 'overlay';
    mediaWrap.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        0.1,
        10
    );
    camera.position.z = 1;

    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const glossMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uCursor: { value: new THREE.Vector2(0.5, 0.5) },
            uIntensity: { value: 0.0 },
            uAspect: { value: width / height },
            uTilt: { value: new THREE.Vector2(0.0, 0.0) },
            uColor: { value: GLOSS_COLOR },
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec2 uCursor;
            uniform float uIntensity;
            uniform float uAspect;
            uniform vec2 uTilt;
            uniform vec3 uColor;
            varying vec2 vUv;

            void main() {
                vec2 diff = (vUv - uCursor) * vec2(uAspect, 1.0);
                float dist = length(diff);
                float spot = smoothstep(0.72, 0.0, dist) * uIntensity;
                float rim = clamp(
                    (vUv.x - 0.5) * uTilt.x + (vUv.y - 0.5) * uTilt.y,
                    0.0,
                    1.0
                ) * uIntensity * ${GLOSS_RIM_STRENGTH.toFixed(2)};

                gl_FragColor = vec4(uColor, clamp(spot + rim, 0.0, ${GLOSS_ALPHA_MAX.toFixed(2)}));
            }
        `,
        transparent: true,
        depthWrite: false,
    });

    const glossMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glossMaterial);
    cardGroup.add(glossMesh);

    let targetCursorX = 0.5;
    let targetCursorY = 0.5;
    let currentCursorX = 0.5;
    let currentCursorY = 0.5;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let targetShiftX = 0;
    let targetShiftY = 0;
    let currentShiftX = 0;
    let currentShiftY = 0;
    let targetIntensity = 0;
    let currentIntensity = 0;

    function resizeRenderer() {
        const nextWidth = mediaWrap.offsetWidth;
        const nextHeight = mediaWrap.offsetHeight;
        if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;

        width = nextWidth;
        height = nextHeight;
        renderer.setSize(width, height, false);
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();
        glossMaterial.uniforms.uAspect.value = width / height;
        glossMesh.geometry.dispose();
        glossMesh.geometry = new THREE.PlaneGeometry(width, height);
    }

    function isCardInteractive() {
        return feedStrip?.classList.contains('is-feed-hover-active')
            || feedStrip?.classList.contains('is-rail-active');
    }

    function updatePointerTargets(event) {
        const mediaRect = mediaWrap.getBoundingClientRect();
        if (!mediaRect.width || !mediaRect.height) return;

        const isInsideMedia = event.clientX >= mediaRect.left
            && event.clientX <= mediaRect.right
            && event.clientY >= mediaRect.top
            && event.clientY <= mediaRect.bottom;
        if (!isCardInteractive() || !isInsideMedia) {
            resetPointerTargets();
            return;
        }

        const mediaX = clamp01((event.clientX - mediaRect.left) / mediaRect.width);
        const mediaY = clamp01((event.clientY - mediaRect.top) / mediaRect.height);

        targetCursorX = mediaX;
        targetCursorY = 1 - mediaY;
        targetRotateY = (mediaX - 0.5) * 2 * MAX_ROTATE_Y;
        targetRotateX = -(mediaY - 0.5) * 2 * MAX_ROTATE_X;
        targetShiftX = (mediaX - 0.5) * 2 * MAX_SHIFT_X;
        targetShiftY = (mediaY - 0.5) * 2 * MAX_SHIFT_Y;
        targetIntensity = GLOSS_INTENSITY;
    }

    function resetPointerTargets() {
        targetRotateX = 0;
        targetRotateY = 0;
        targetShiftX = 0;
        targetShiftY = 0;
        targetIntensity = 0;
    }

    window.addEventListener('pointermove', updatePointerTargets, { passive: true });
    threeContainer.addEventListener('pointerleave', resetPointerTargets);
    threeContainer.addEventListener('pointercancel', resetPointerTargets);
    window.addEventListener('resize', resizeRenderer, { passive: true });

    (function tick() {
        requestAnimationFrame(tick);

        currentCursorX += (targetCursorX - currentCursorX) * LERP;
        currentCursorY += (targetCursorY - currentCursorY) * LERP;
        currentRotateX += (targetRotateX - currentRotateX) * LERP;
        currentRotateY += (targetRotateY - currentRotateY) * LERP;
        currentShiftX += (targetShiftX - currentShiftX) * LERP;
        currentShiftY += (targetShiftY - currentShiftY) * LERP;
        currentIntensity += (targetIntensity - currentIntensity) * LERP;

        const isActive = currentIntensity > 0.003
            || Math.abs(currentRotateX) > 0.003
            || Math.abs(currentRotateY) > 0.003
            || Math.abs(currentShiftX) > 0.003
            || Math.abs(currentShiftY) > 0.003;

        threeContainer.style.transform = isActive
            ? `translate3d(${currentShiftX.toFixed(3)}px, ${currentShiftY.toFixed(3)}px, 0) rotateX(${currentRotateX.toFixed(3)}deg) rotateY(${currentRotateY.toFixed(3)}deg)`
            : '';

        cardGroup.position.x = currentShiftX * GLOSS_PARALLAX;
        cardGroup.position.y = -currentShiftY * GLOSS_PARALLAX;
        glossMaterial.uniforms.uCursor.value.set(currentCursorX, currentCursorY);
        glossMaterial.uniforms.uIntensity.value = currentIntensity;
        glossMaterial.uniforms.uTilt.value.set(
            currentRotateY / MAX_ROTATE_Y,
            -currentRotateX / MAX_ROTATE_X
        );

        renderer.render(scene, camera);
    })();
}

window.addEventListener('load', () => {
    document.querySelectorAll('.feed-card').forEach(initCard);
});
