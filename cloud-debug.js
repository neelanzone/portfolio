/* Cloud Debug — toggle with Ctrl+Shift+D
   Drag clouds to reposition, use ▲/▼ to adjust z-index,
   then click "Apply & Close" to commit or "Copy CSS" to grab the output. */

(function () {
    'use strict';

    let active      = false;
    let cloudStates = [];
    let panel       = null;
    let dragging    = null;
    let dragOX      = 0;
    let dragOY      = 0;

    /* ── Inject debug styles ─────────────────────────────── */
    const style = document.createElement('style');
    style.textContent = `
        .cloud-debug-handle {
            position: fixed;
            z-index: 9998;
            cursor: grab;
            box-sizing: border-box;
            border: 1.5px dashed rgba(255,255,255,0.55);
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            background: rgba(0,0,0,0.18);
            backdrop-filter: blur(4px);
            transition: border-color 0.15s ease;
            user-select: none;
        }
        .cloud-debug-handle:hover  { border-color: rgba(255,255,255,0.9); }
        .cloud-debug-handle.is-dragging { cursor: grabbing; border-color: #fff; }
        .cloud-debug-label {
            font: 700 11px/1 'Instrument Sans', sans-serif;
            color: #fff;
            background: rgba(0,0,0,0.45);
            border-radius: 3px;
            padding: 2px 5px;
            letter-spacing: 0.04em;
        }
        .cloud-debug-z {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .cloud-debug-z-btn {
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.4);
            border-radius: 3px;
            color: #fff;
            font-size: 9px;
            width: 18px;
            height: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            line-height: 1;
            transition: background 0.1s ease;
        }
        .cloud-debug-z-btn:hover { background: rgba(255,255,255,0.35); }
        .cloud-debug-z-val {
            font: 600 10px/1 'Instrument Sans', monospace;
            color: #fff;
            min-width: 22px;
            text-align: center;
        }
        .cloud-debug-drag {
            font: 400 9px/1 'Instrument Sans', sans-serif;
            color: rgba(255,255,255,0.55);
            letter-spacing: 0.04em;
        }

        /* ── Panel ── */
        .cloud-debug-panel {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            z-index: 9999;
            width: 320px;
            background: rgba(8,16,44,0.92);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 10px;
            padding: 1rem;
            font-family: 'Instrument Sans', sans-serif;
            color: #edf4ff;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .cloud-debug-panel-title {
            font: 600 12px/1 'Instrument Sans', sans-serif;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.55);
            margin-bottom: 0.6rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cloud-debug-panel-title kbd {
            font: 400 10px/1 monospace;
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
            padding: 2px 5px;
        }
        .cloud-debug-output {
            font: 400 11px/1.6 monospace;
            color: #a8d4ff;
            background: rgba(0,0,0,0.3);
            border-radius: 6px;
            padding: 0.6rem 0.75rem;
            margin: 0 0 0.75rem;
            white-space: pre;
            overflow-x: auto;
        }
        .cloud-debug-panel-actions {
            display: flex;
            gap: 0.5rem;
        }
        .cloud-debug-panel-actions button {
            flex: 1;
            font: 600 12px/1 'Instrument Sans', sans-serif;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.2);
            transition: opacity 0.15s ease;
        }
        .cloud-debug-panel-actions button:hover { opacity: 0.8; }
        #cloud-debug-copy  { background: rgba(255,255,255,0.1); color: #fff; }
        #cloud-debug-apply { background: #1D62AF; color: #fff; border-color: #1D62AF; }
    `;
    document.head.appendChild(style);

    /* ── Helpers ─────────────────────────────────────────── */
    function cloudNum(el) {
        const m = (el.className || '').match(/cloud-bg--(\d+)/);
        return m ? parseInt(m[1]) : '?';
    }

    function toTopPct(y) {
        return ((y / window.innerHeight) * 100).toFixed(1);
    }

    function generateCSS() {
        return cloudStates.map((s) => {
            const tPct  = toTopPct(s.y);
            const cls   = `cloud-bg--${s.num}`;
            return `.${cls} { top: ${tPct}%; z-index: ${s.zIndex}; }`;
        }).join('\n');
    }

    function updatePanel() {
        if (!panel) return;
        panel.querySelector('.cloud-debug-output').textContent = generateCSS();
    }

    /* ── Enter debug ─────────────────────────────────────── */
    function enter() {
        active = true;
        cloudStates = [];

        document.querySelectorAll('.cloud-bg').forEach((cloud) => {
            const rect  = cloud.getBoundingClientRect();
            const cs    = getComputedStyle(cloud);
            const zIndex = parseInt(cs.zIndex) || 0;
            const num   = cloudNum(cloud);

            cloud.style.animationPlayState = 'paused';
            cloud.style.transform          = 'none';
            cloud.style.left               = rect.left + 'px';
            cloud.style.top                = rect.top  + 'px';

            const state = { el: cloud, num, x: rect.left, y: rect.top, zIndex };
            cloudStates.push(state);

            /* Handle */
            const h = document.createElement('div');
            h.className = 'cloud-debug-handle';
            h.innerHTML = `
                <div class="cloud-debug-label">cloud ${num}</div>
                <div class="cloud-debug-z">
                    <button class="cloud-debug-z-btn" data-dir="up">▲</button>
                    <span class="cloud-debug-z-val">z ${zIndex}</span>
                    <button class="cloud-debug-z-btn" data-dir="dn">▼</button>
                </div>
                <div class="cloud-debug-drag">⠿ drag</div>
            `;
            h.style.left   = rect.left   + 'px';
            h.style.top    = rect.top    + 'px';
            h.style.width  = rect.width  + 'px';
            h.style.height = Math.max(rect.height, 48) + 'px';

            /* Drag */
            h.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.cloud-debug-z-btn')) return;
                dragging = state;
                dragOX   = e.clientX - state.x;
                dragOY   = e.clientY - state.y;
                h.setPointerCapture(e.pointerId);
                h.classList.add('is-dragging');
                e.preventDefault();
            });
            h.addEventListener('pointermove', (e) => {
                if (dragging !== state) return;
                state.x = e.clientX - dragOX;
                state.y = e.clientY - dragOY;
                cloud.style.left = state.x + 'px';
                cloud.style.top  = state.y + 'px';
                h.style.left     = state.x + 'px';
                h.style.top      = state.y + 'px';
                updatePanel();
            });
            h.addEventListener('pointerup', () => {
                if (dragging === state) {
                    dragging = null;
                    h.classList.remove('is-dragging');
                }
            });

            /* Z controls */
            h.addEventListener('click', (e) => {
                const btn = e.target.closest('.cloud-debug-z-btn');
                if (!btn) return;
                btn.dataset.dir === 'up' ? state.zIndex++ : state.zIndex = Math.max(0, state.zIndex - 1);
                cloud.style.zIndex = state.zIndex;
                h.querySelector('.cloud-debug-z-val').textContent = `z ${state.zIndex}`;
                updatePanel();
            });

            document.body.appendChild(h);
            state.handle = h;
        });

        /* Panel */
        panel = document.createElement('div');
        panel.className = 'cloud-debug-panel';
        panel.innerHTML = `
            <div class="cloud-debug-panel-title">
                Cloud Debug
                <kbd>Ctrl+Shift+D</kbd>
            </div>
            <pre class="cloud-debug-output"></pre>
            <div class="cloud-debug-panel-actions">
                <button id="cloud-debug-copy">Copy CSS</button>
                <button id="cloud-debug-apply">Apply &amp; Close</button>
            </div>
        `;
        panel.querySelector('#cloud-debug-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(generateCSS()).then(() => {
                const btn = panel.querySelector('#cloud-debug-copy');
                btn.textContent = 'Copied!';
                setTimeout(() => { if (panel) btn.textContent = 'Copy CSS'; }, 1500);
            });
        });
        panel.querySelector('#cloud-debug-apply').addEventListener('click', exit);
        document.body.appendChild(panel);
        updatePanel();
    }

    /* ── Exit & apply ────────────────────────────────────── */
    function exit() {
        active = false;
        cloudStates.forEach((s) => {
            s.handle.remove();
            s.el.style.animationPlayState = '';
            s.el.style.transform          = '';
            s.el.style.left               = '';
            s.el.style.top                = toTopPct(s.y) + '%';
            s.el.style.zIndex             = s.zIndex;
        });
        if (panel) { panel.remove(); panel = null; }
        cloudStates = [];
    }

    /* ── Toggle ──────────────────────────────────────────── */
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            active ? exit() : enter();
        }
    });

}());
