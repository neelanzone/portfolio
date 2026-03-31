(async () => {
  // â”€â”€â”€ Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const C = {
    pageBg:        '#0a0a0b',
    pageBgSoft:    '#111113',
    textPrimary:   '#f3f0ea',
    textSecondary: '#b4aea4',
    textTertiary:  '#8b857d',
    accent:        '#f2682c',
  };

  const WIDTH      = 390;
  const GUTTER     = 18;
  const INNER      = 354;
  const NAV_H      = 64;
  const FRAME_GAP  = 80;
  const R_LG       = 28;
  const R_MD       = 20;
  const R_SM       = 14;

  // â”€â”€â”€ Font loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function tryLoadFont(family, style) {
    try {
      await figma.loadFontAsync({ family, style });
      return true;
    } catch (_) {
      return false;
    }
  }

  let fontHNBold    = 'Helvetica Neue';
  let fontHNReg     = 'Helvetica Neue';
  let fontHNBoldSt  = 'Bold';
  let fontHNRegSt   = 'Regular';
  let fontMono      = 'Space Mono';
  let fontMonoSt    = 'Regular';
  let fontNunito    = 'Nunito Sans';
  let fontNunitoSt  = 'Regular';

  // Helvetica Neue Bold
  if (!(await tryLoadFont('Helvetica Neue', 'Bold'))) {
    if (await tryLoadFont('Inter', 'Bold')) {
      fontHNBold = 'Inter'; fontHNBoldSt = 'Bold';
    } else {
      await figma.loadFontAsync({ family: 'Roboto', style: 'Bold' });
      fontHNBold = 'Roboto'; fontHNBoldSt = 'Bold';
    }
  }
  // Helvetica Neue Regular
  if (!(await tryLoadFont('Helvetica Neue', 'Regular'))) {
    if (await tryLoadFont('Inter', 'Regular')) {
      fontHNReg = 'Inter'; fontHNRegSt = 'Regular';
    } else {
      await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
      fontHNReg = 'Roboto'; fontHNRegSt = 'Regular';
    }
  }
  // Space Mono
  if (!(await tryLoadFont('Space Mono', 'Regular'))) {
    if (await tryLoadFont('Courier New', 'Regular')) {
      fontMono = 'Courier New'; fontMonoSt = 'Regular';
    } else {
      await figma.loadFontAsync({ family: 'Roboto Mono', style: 'Regular' });
      fontMono = 'Roboto Mono'; fontMonoSt = 'Regular';
    }
  }
  // Nunito Sans
  if (!(await tryLoadFont('Nunito Sans', 'Regular'))) {
    if (await tryLoadFont('Inter', 'Regular')) {
      fontNunito = 'Inter'; fontNunitoSt = 'Regular';
    } else {
      fontNunito = fontHNReg; fontNunitoSt = fontHNRegSt;
    }
  }

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16) / 255,
      g: parseInt(h.substring(2, 4), 16) / 255,
      b: parseInt(h.substring(4, 6), 16) / 255,
    };
  }

  function solid(hexColor, opacity = 1) {
    const { r, g, b } = hexToRgb(hexColor);
    return [{ type: 'SOLID', color: { r, g, b }, opacity }];
  }

  let currentY = 0;
  const allFrames = [];

  function makeFrame(name, w, h) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(w, h);
    f.x = 0;
    f.y = currentY;
    f.fills = solid(C.pageBg);
    figma.currentPage.appendChild(f);
    allFrames.push(f);
    return f;
  }

  function addRect(parent, name, x, y, w, h, fillPaint, strokePaint, cornerRadius = 0) {
    const r = figma.createRectangle();
    r.name = name;
    r.x = x;
    r.y = y;
    r.resize(w, h);
    r.fills = fillPaint || [];
    if (strokePaint) {
      r.strokes = strokePaint;
      r.strokeWeight = 1;
      r.strokeAlign = 'INSIDE';
    } else {
      r.strokes = [];
    }
    r.cornerRadius = cornerRadius;
    parent.appendChild(r);
    return r;
  }

  function addText(parent, content, x, y, w, opts = {}) {
    const t = figma.createText();
    const family = opts.fontFamily || fontHNReg;
    const style  = opts.fontStyle  || fontHNRegSt;
    t.fontName = { family, style };
    t.characters = content;
    t.fontSize = opts.fontSize || 14;
    const col = opts.color || C.textPrimary;
    t.fills = solid(col);
    if (opts.opacity !== undefined) t.opacity = opts.opacity;
    if (opts.lineHeight) {
      t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
    }
    if (opts.letterSpacing) {
      t.letterSpacing = { value: opts.letterSpacing * 100, unit: 'PERCENT' };
    }
    if (opts.textCase) t.textCase = opts.textCase;
    t.textAutoResize = 'HEIGHT';
    t.resize(w, 20);
    t.x = x;
    t.y = y;
    if (opts.textAlignHorizontal) t.textAlignHorizontal = opts.textAlignHorizontal;
    parent.appendChild(t);
    return t;
  }

  function addCard(parent, name, x, y, w, h, radius = R_MD) {
    return addRect(
      parent, name, x, y, w, h,
      solid(C.pageBgSoft),
      solid('#ffffff', 0.10),
      radius
    );
  }

  // â”€â”€â”€ Frame 1: Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Navbar', WIDTH, NAV_H);

    // Border bottom
    addRect(frame, 'Border Bottom', 0, 63, WIDTH, 1, solid('#ffffff', 0.10), null, 0);

    // Logo placeholder
    addRect(frame, 'Logo (72Ã—72 placeholder)', 0, 0, 72, 72, solid(C.accent, 0.20), null, 8);
    addText(frame, 'LOGO', 12, 24, 48, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 9, color: C.accent,
    });

    // Theme toggle
    const toggleX = WIDTH - GUTTER - 42 - 8 - 42;
    addRect(frame, 'Theme Toggle Button', toggleX, 11, 42, 42, solid('#ffffff', 0.04), null, 999);
    addText(frame, 'â˜¾', toggleX, 11 + (42 - 20) / 2, 42, {
      fontFamily: fontHNReg, fontStyle: fontHNRegSt,
      fontSize: 20, color: C.textPrimary,
      textAlignHorizontal: 'CENTER',
    });

    // Hamburger button
    const hambX = WIDTH - GUTTER - 42;
    addRect(frame, 'Hamburger Button', hambX, 11, 42, 42, solid('#ffffff', 0.04), null, 999);
    for (let i = 0; i < 3; i++) {
      const lineY = 11 + [14, 19.5, 25][i];
      addRect(frame, `Hamburger Line ${i + 1}`, hambX + (42 - 18) / 2, lineY, 18, 1.5,
        solid(C.textPrimary), null, 999);
    }

    currentY += NAV_H + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 2: Mobile Menu Open â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Mobile Menu â€” Open State', WIDTH, 260);

    const panelW = 212;
    const panelH = 220;
    const panelX = WIDTH - GUTTER - panelW;
    const panelY = 10;

    // Panel background
    addRect(frame, 'Menu Panel', panelX, panelY, panelW, panelH,
      solid(C.pageBg, 0.92), solid('#ffffff', 0.10), 16);

    // Main menu items
    const mainItems = ['ABOUT', 'WORK', 'CONTACT'];
    const mainYs    = [26, 54, 82];
    mainItems.forEach((item, i) => {
      addText(frame, item, panelX + 16, panelY + mainYs[i], panelW - 32, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 12, color: C.textSecondary,
        letterSpacing: 0.16, textCase: 'UPPER',
      });
    });

    // Submenu items under Work
    const subItems = ['Ludo Cards', 'Managed Asset Search', 'EV Charger Discovery', 'Venture Hub', 'ProtoPack'];
    subItems.forEach((item, i) => {
      addText(frame, item, panelX + 16, panelY + 108 + i * 22, panelW - 32, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 13, color: C.textSecondary,
      });
    });

    currentY += 260 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 3: Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Hero', WIDTH, 700);

    // Eyebrow
    addText(frame, 'CASE STUDY / PRODUCT DESIGN / 2026', GUTTER, 16, INNER, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    // H1
    addText(frame, '[ Project Title ]', GUTTER, 44, INNER, {
      fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
      fontSize: 46, color: C.textPrimary,
      lineHeight: 44.16, letterSpacing: -0.04,
    });

    // Summary
    addText(frame, 'A one-line thesis about what changed, why it mattered, and what made the project interesting.',
      GUTTER, 150, INNER, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 16, color: C.textSecondary,
        lineHeight: 25,
      });

    // Meta grid (2Ã—2)
    const metaCards = [
      { label: 'ROLE',     value: 'Product Designer' },
      { label: 'TIMELINE', value: '12 weeks'          },
      { label: 'TEAM',     value: '4 people'           },
      { label: 'FOCUS',    value: 'Trust + Clarity'    },
    ];
    const cardW = (INNER - 12) / 2;
    const cardH = 72;
    const gridY = 260;

    metaCards.forEach((mc, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx  = GUTTER + col * (cardW + 12);
      const cy  = gridY + row * (cardH + 12);

      addRect(frame, `Meta Card ${i + 1}`, cx, cy, cardW, cardH,
        solid(C.pageBgSoft), solid('#ffffff', 0.10), R_MD);
      addText(frame, mc.label, cx + 15, cy + 15, cardW - 30, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 11, color: C.textTertiary,
        letterSpacing: 0.16, textCase: 'UPPER',
      });
      addText(frame, mc.value, cx + 15, cy + 36, cardW - 30, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 15, color: C.textPrimary,
      });
    });

    // Visual placeholder
    const visY = 440;
    addRect(frame, 'Cover Visual Placeholder', GUTTER, visY, INNER, 220,
      solid(C.pageBgSoft), solid('#ffffff', 0.08), R_LG);
    addText(frame,
      'Cover visual, prototype, or layered mockup goes here.',
      GUTTER, visY + 220 / 2 - 10, INNER, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 12, color: C.textTertiary,
        textAlignHorizontal: 'CENTER',
      });

    currentY += 700 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 4: Chapter Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Chapter Nav', WIDTH, 56);

    const pillLabels = ['Overview', 'Context', 'Process', 'Artifacts', 'Outcome'];
    let pillX = GUTTER;

    pillLabels.forEach((label) => {
      const pillW = label.length * 8 + 32;
      addRect(frame, `Pill: ${label}`, pillX, 9, pillW, 38,
        solid(C.pageBg, 0.82), solid('#ffffff', 0.10), 999);
      addText(frame, label, pillX, 9 + (38 - 12) / 2, pillW, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 12, color: C.textSecondary,
        letterSpacing: 0.06, textAlignHorizontal: 'CENTER',
      });
      pillX += pillW + 10;
    });

    currentY += 56 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 5: Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Overview', WIDTH, 400);

    addText(frame, 'OVERVIEW', GUTTER, 20, INNER, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    const cardX = GUTTER, cardY = 52, cardW = INNER, cardH = 334;
    addCard(frame, 'Summary Card', cardX, cardY, cardW, cardH, R_MD);

    addText(frame, 'The fast read.', cardX + 18, cardY + 18, cardW - 36, {
      fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
      fontSize: 29, color: C.textPrimary,
      lineHeight: 27.84, letterSpacing: -0.04,
    });

    addText(frame,
      'Start with a concise snapshot that makes sense on mobile without demanding a long scroll.',
      cardX + 18, cardY + 62, cardW - 36, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 15, color: C.textSecondary,
        lineHeight: 24,
      });

    const summaryItems = [
      { h3: 'Problem',  body: 'What tension or failure point made this work necessary?'           },
      { h3: 'Approach', body: 'What design, research, or system moves shaped the project?'        },
      { h3: 'Outcome',  body: 'What changed in practical terms after the work?'                   },
    ];
    let itemY = cardY + 130;
    summaryItems.forEach((item, i) => {
      if (i > 0) {
        addRect(frame, `Divider ${i}`, cardX, itemY - 1, cardW, 1,
          solid('#ffffff', 0.10), null, 0);
      }
      addText(frame, item.h3, cardX + 18, itemY + 8, cardW - 36, {
        fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
        fontSize: 18, color: C.textPrimary,
      });
      addText(frame, item.body, cardX + 18, itemY + 34, cardW - 36, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 15, color: C.textSecondary,
        lineHeight: 24,
      });
      itemY += 68;
    });

    currentY += 400 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 6: Context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Context', WIDTH, 480);

    addText(frame, 'CONTEXT', GUTTER, 20, INNER, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    const cardX = GUTTER, cardY = 52, cardW = INNER, cardH = 170;
    addCard(frame, 'Context Card', cardX, cardY, cardW, cardH, R_MD);

    addText(frame, 'Lead with the tension, not the timeline.', cardX + 18, cardY + 18, cardW - 36, {
      fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
      fontSize: 24, color: C.textPrimary,
      lineHeight: 23.04, letterSpacing: -0.04,
    });

    addText(frame,
      'Set the scene quickly. Who was affected, what was broken, and why solving this was worth doing. Skip the history; show the gap.',
      cardX + 18, cardY + 72, cardW - 36, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 15, color: C.textSecondary,
        lineHeight: 24,
      });

    // Media panel
    const mediaY = 238;
    addRect(frame, 'Media Panel', GUTTER, mediaY, INNER, 210,
      solid('#1a0e08'), solid('#ffffff', 0.10), R_LG);
    addText(frame,
      'Insert a key map, storyboard, service blueprint, or compressed artifact here.',
      GUTTER, mediaY + 210 / 2 - 10, INNER, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 12, color: C.textTertiary,
        textAlignHorizontal: 'CENTER',
      });

    currentY += 480 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 7: Process â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Process', WIDTH, 420);

    addText(frame, 'PROCESS', GUTTER, 20, INNER, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    const processCards = [
      { idx: '01', h3: 'Understand', body: 'Research inputs, audits, or framing moves that helped define the real problem.'        },
      { idx: '02', h3: 'Structure',  body: 'Flows, architecture, priorities, and system decisions that created clarity.'            },
      { idx: '03', h3: 'Refine',     body: 'Iterations, critiques, and tests that moved the project from idea to confidence.'       },
    ];

    let cY = 52;
    processCards.forEach((pc) => {
      addCard(frame, `Process Card: ${pc.h3}`, GUTTER, cY, INNER, 110, R_MD);
      addText(frame, pc.idx, GUTTER + 16, cY + 16, INNER - 32, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 12, color: C.accent,
      });
      addText(frame, pc.h3, GUTTER + 16, cY + 36, INNER - 32, {
        fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
        fontSize: 18, color: C.textPrimary,
      });
      addText(frame, pc.body, GUTTER + 16, cY + 60, INNER - 32, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 14, color: C.textSecondary,
        lineHeight: 22,
      });
      cY += 110 + 12;
    });

    currentY += 420 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 8: Artifacts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Artifacts', WIDTH, 640);

    addText(frame, 'ARTIFACTS', GUTTER, 20, INNER, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    const artifacts = [
      { title: 'Decision One',   body: 'Use this card to explain what changed and why that decision mattered.'                      },
      { title: 'Decision Two',   body: 'Keep each card self-contained enough to work on mobile without surrounding context.'        },
      { title: 'Decision Three', body: 'This structure is intentionally modular so different project types can reuse it.'           },
    ];

    let aY = 52;
    artifacts.forEach((art) => {
      addCard(frame, `Artifact Card: ${art.title}`, GUTTER, aY, INNER, 186, R_MD);

      // Media area inside card
      addRect(frame, `Media Area: ${art.title}`,
        GUTTER + 16, aY + 16, INNER - 32, 96,
        solid(C.pageBgSoft), solid('#ffffff', 0.08), R_SM);
      addText(frame, 'Screen / Diagram / Artifact',
        GUTTER + 16, aY + 16 + 96 / 2 - 6, INNER - 32, {
          fontFamily: fontMono, fontStyle: fontMonoSt,
          fontSize: 11, color: C.textTertiary,
          textAlignHorizontal: 'CENTER',
        });

      addText(frame, art.title, GUTTER + 16, aY + 126, INNER - 32, {
        fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
        fontSize: 17, color: C.textPrimary,
      });
      addText(frame, art.body, GUTTER + 16, aY + 150, INNER - 32, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 13, color: C.textSecondary,
        lineHeight: 20,
      });
      aY += 186 + 12;
    });

    currentY += 640 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 9: Proof â€” Quote â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Proof â€” Quote', WIDTH, 200);

    const cardX = GUTTER, cardY = 16, cardW = INNER, cardH = 168;
    addCard(frame, 'Quote Card', cardX, cardY, cardW, cardH, R_MD);

    addText(frame, 'PROOF', cardX + 18, cardY + 16, cardW - 36, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    addText(frame,
      '\u201cPlace the sharpest synthesis, quote, or result here so the page gets a memorable pause.\u201d',
      cardX + 18, cardY + 44, cardW - 36, {
        fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
        fontSize: 22, color: C.textPrimary,
        lineHeight: 26,
      });

    // Accent tint overlay
    addRect(frame, 'Accent Tint Overlay', cardX, cardY, cardW, cardH,
      solid(C.accent, 0.12), null, R_MD);

    currentY += 200 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 10: Outcome â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / Outcome', WIDTH, 430);

    addText(frame, 'OUTCOME', GUTTER, 20, INNER, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    const cardX = GUTTER, cardY = 52, cardW = INNER, cardH = 120;
    addCard(frame, 'Outcome Summary Card', cardX, cardY, cardW, cardH, R_MD);

    addText(frame, 'End with what changed.', cardX + 18, cardY + 18, cardW - 36, {
      fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
      fontSize: 26, color: C.textPrimary,
      lineHeight: 24.96, letterSpacing: -0.04,
    });

    addText(frame,
      'Wrap with the shipped result, measurable improvement, learning, or operating shift.',
      cardX + 18, cardY + 62, cardW - 36, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 14, color: C.textSecondary,
        lineHeight: 22,
      });

    // Metrics 2Ã—2
    const metrics = [
      { label: 'METRIC',     value: '+28%', body: 'Example result'          },
      { label: 'TIME SAVED', value: '4 wks', body: 'Example process gain'   },
      { label: 'SYSTEMS',    value: '1',     body: 'Example consolidation'  },
      { label: 'CONFIDENCE', value: 'High',  body: 'Example team signal'    },
    ];
    const mCardW = (INNER - 12) / 2;
    const mCardH = 100;
    const mGridY = 188;

    metrics.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const mx  = GUTTER + col * (mCardW + 12);
      const my  = mGridY + row * (mCardH + 12);

      addRect(frame, `Metric Card: ${m.label}`, mx, my, mCardW, mCardH,
        solid(C.pageBgSoft), solid('#ffffff', 0.10), R_MD);
      addText(frame, m.label, mx + 15, my + 15, mCardW - 30, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 11, color: C.textTertiary,
        letterSpacing: 0.16, textCase: 'UPPER',
      });
      addText(frame, m.value, mx + 15, my + 35, mCardW - 30, {
        fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
        fontSize: 30, color: C.textPrimary,
      });
      addText(frame, m.body, mx + 15, my + 74, mCardW - 30, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 12, color: C.textSecondary,
      });
    });

    currentY += 430 + FRAME_GAP;
  }

  // â”€â”€â”€ Frame 11: More Projects â€” Carousel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const frame = makeFrame('Mobile / More Projects â€” Carousel', WIDTH, 360);

    // Background
    addRect(frame, 'Background', 0, 0, WIDTH, 360, solid('#080809'), null, R_LG);

    // WebGL glow rects
    addRect(frame, 'WebGL Glow â€” accent (top-left)', 0, 0, 160, 140,
      solid(C.accent, 0.14), null, R_LG);
    addRect(frame, 'WebGL Glow â€” subtle (top-right)', 230, 0, 160, 100,
      solid('#ffffff', 0.08), null, R_LG);

    // Label banner
    addRect(frame, 'Label Banner', GUTTER, 12, 272, 26,
      solid(C.accent, 0.18), null, R_SM);
    addText(frame,
      'â¬¡ WebGL: Three.js Particle Field (2200 pts, additive blending)',
      GUTTER + 8, 19, 272 - 16, {
        fontFamily: fontMono, fontStyle: fontMonoSt,
        fontSize: 9, color: C.accent,
      });

    // Section label
    addText(frame, 'MORE PROJECTS', GUTTER, 56, INNER, {
      fontFamily: fontMono, fontStyle: fontMonoSt,
      fontSize: 12, color: C.textTertiary,
      letterSpacing: 0.16, textCase: 'UPPER',
    });

    // Copy
    addText(frame,
      'Swipe through the rest of the portfolio in a wide orbit.',
      GUTTER, 76, INNER, {
        fontFamily: fontNunito, fontStyle: fontNunitoSt,
        fontSize: 14, color: C.textSecondary,
        lineHeight: 22,
      });

    // Prev / Next controls
    addText(frame, '<', GUTTER, 185, 30, {
      fontFamily: fontHNReg, fontStyle: fontHNRegSt,
      fontSize: 40, color: C.textPrimary, opacity: 0.45,
    });
    addText(frame, '>', WIDTH - GUTTER - 20, 185, 30, {
      fontFamily: fontHNReg, fontStyle: fontHNRegSt,
      fontSize: 40, color: C.textPrimary, opacity: 0.45,
    });

    // Carousel cards
    const carouselCards = [
      { x: 18,  y: 110, opacity: 0.35, title: 'Managed Asset Search',  type: 'Information Architecture', borderOpacity: 0.10 },
      { x: 105, y: 100, opacity: 1.00, title: 'EV Charger Discovery',  type: 'UX/UI',                    borderOpacity: 0.20 },
      { x: 192, y: 110, opacity: 0.35, title: 'Ludo Cards',        type: 'Game Design & Dev',        borderOpacity: 0.10 },
    ];

    carouselCards.forEach((cc) => {
      const cW = 180, cH = 212;
      const cardNode = addRect(frame, `Carousel Card: ${cc.title}`,
        cc.x, cc.y, cW, cH,
        solid(C.pageBgSoft), solid('#ffffff', cc.borderOpacity), R_MD);
      cardNode.opacity = cc.opacity;

      // Image area (top portion)
      addRect(frame, `Card Image: ${cc.title}`,
        cc.x, cc.y, cW, cH - 52,
        solid(C.pageBg), null, R_MD);

      // Meta overlay
      const metaY = cc.y + cH - 52;
      addRect(frame, `Card Meta: ${cc.title}`,
        cc.x, metaY, cW, 52,
        solid('#000000', 0.85), null, R_MD);

      addText(frame, cc.type.toUpperCase(),
        cc.x + 10, metaY + 8, cW - 20, {
          fontFamily: fontMono, fontStyle: fontMonoSt,
          fontSize: 10, color: C.textTertiary,
          textCase: 'UPPER',
        });
      addText(frame, cc.title,
        cc.x + 10, metaY + 26, cW - 20, {
          fontFamily: fontHNBold, fontStyle: fontHNBoldSt,
          fontSize: 15, color: C.textPrimary,
        });
    });

    currentY += 360 + FRAME_GAP;
  }

  // â”€â”€â”€ Finalize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  figma.viewport.scrollAndZoomIntoView(allFrames);
  const msg = 'âœ… 11 mobile frames created at 390px. Check layers panel for "Mobile / *" frames.';
  if (typeof figma.closePlugin === 'function') {
    figma.closePlugin(msg);
  } else {
    console.log(msg);
  }
})();

