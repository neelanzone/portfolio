(() => {
    const canvas = document.querySelector('.pixel-field');
    if (!canvas || !window.matchMedia('(min-width: 900px)').matches) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let points = [];
    let targetScroll = window.scrollY || 0;
    let scrollState = targetScroll;
    let rafId = 0;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildPoints();
        draw();
    }

    function buildPoints() {
        points = [];
        const centerX = width * 0.5;
        const centerY = height * 0.42;
        const spacing = 28;

        for (let y = -spacing; y <= height + spacing; y += spacing) {
            for (let x = -spacing; x <= width + spacing; x += spacing) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.hypot(dx, dy);
                const edge = Math.min(distance / Math.max(width, height), 1);
                const spread = 1 + edge * 0.55;
                const alpha = 0.03 + edge * 0.13;
                const size = 1 + edge * 1.15;
                points.push({ x, y, dx, dy, distance, edge, spread, alpha, size });
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const wave = scrollState * 0.0045;

        for (const point of points) {
            const directionX = point.distance === 0 ? 0 : point.dx / point.distance;
            const directionY = point.distance === 0 ? 0 : point.dy / point.distance;
            const outward = point.edge * 26;
            const sway = Math.sin(wave + point.y * 0.024 + point.x * 0.006) * (5 + point.edge * 16);
            const lift = Math.cos(wave * 0.8 + point.x * 0.018) * (2 + point.edge * 8);
            const px = point.x + directionX * outward + sway;
            const py = point.y + directionY * outward * 0.2 + lift;
            ctx.fillStyle = `rgba(255, 255, 255, ${point.alpha})`;
            ctx.fillRect(px, py, point.size, point.size);
        }
    }

    function tick() {
        scrollState += (targetScroll - scrollState) * 0.08;
        draw();
        rafId = window.requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', () => {
        targetScroll = window.scrollY || 0;
    }, { passive: true });

    resize();
    if (!rafId) {
        tick();
    }
})();
