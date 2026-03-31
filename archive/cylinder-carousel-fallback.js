/**
 * cylinder-carousel-fallback.js
 * ─────────────────────────────
 * Extracted cylinder carousel logic from main.js.
 * Drop these snippets back into the carousel block in main.js if you ever
 * want to restore the 3D rotating cylinder on desktop.
 *
 * Integration notes:
 *  - Paste the VARIABLES block right after the isFlatMode / isFilingCabinet declarations.
 *  - Paste the GEOMETRY block inside updateCarouselGeometry's `else` branch (replacing the filing cabinet block).
 *  - Paste the ANIMATE block into animateCarousel's `else` branch.
 *  - Paste ARROW BUTTONS after updateCarouselAnimationState().
 *  - Paste KEYBOARD ELSE inside the keydown handler's else branch.
 *  - Paste DRAG ELSE inside the pointermove / pointerup else branches.
 *  - Paste WHEEL as a standalone event listener on carouselContainer.
 */

// ── VARIABLES ────────────────────────────────────────────────────────────────
const theta = 360 / numCards;
let radius = 0;

const titleCardIndex = cards.findIndex(card => card.classList.contains('title-card'));
const centerIndex = titleCardIndex !== -1 ? titleCardIndex : Math.floor(numCards / 2);
let currentRotation = -centerIndex * theta;
let targetRotation  = -centerIndex * theta;
let dragStartRotation = targetRotation;

const normalizeAngle = (angle) => {
    let normalized = angle % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized < -180) normalized += 360;
    return normalized;
};


// ── GEOMETRY (replaces filing-cabinet else branch in updateCarouselGeometry) ─
// } else {
//     isFlatMode = false;
//     isFilingCabinet = false;
//     flatNumCards = numCards;
//
//     const baseRadius = Math.round((cardWidth / 2) / Math.tan(Math.PI / numCards));
//     const depthPadding = Math.max(24, cardWidth * 0.16);
//     radius = baseRadius + depthPadding;
//
//     cards.forEach((card, index) => {
//         card.style.display = '';
//         const angle = theta * index;
//         card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
//         card.dataset.angle = angle;
//     });
// }


// ── getCenteredCard non-flat branch ──────────────────────────────────────────
// Add inside getCenteredCard() after the isFlatMode block:
//
// return cards.reduce((closestCard, card) => {
//     if (!closestCard) return card;
//     const cardAngle    = parseFloat(card.dataset.angle) || 0;
//     const closestAngle = parseFloat(closestCard.dataset.angle) || 0;
//     const currentDistance = Math.abs(normalizeAngle(cardAngle + currentRotation));
//     const closestDistance = Math.abs(normalizeAngle(closestAngle + currentRotation));
//     return currentDistance < closestDistance ? card : closestCard;
// }, null);


// ── ANIMATE (else branch in animateCarousel) ─────────────────────────────────
// } else {
//     currentRotation += (targetRotation - currentRotation) * 0.1;
//     carouselTrack.style.transform = `translateZ(-${radius}px) rotateY(${currentRotation}deg)`;
// }


// ── ARROW BUTTONS ─────────────────────────────────────────────────────────────
// const prevBtn = carouselContainer.querySelector('.carousel-control.prev');
// const nextBtn = carouselContainer.querySelector('.carousel-control.next');
// if (prevBtn && nextBtn) {
//     prevBtn.addEventListener('click', () => {
//         targetRotation += theta;
//         targetRotation = Math.round(targetRotation / theta) * theta;
//     });
//     nextBtn.addEventListener('click', () => {
//         targetRotation -= theta;
//         targetRotation = Math.round(targetRotation / theta) * theta;
//     });
// }


// ── KEYBOARD ELSE (inside keydown handler) ───────────────────────────────────
// } else {
//     if (e.key === 'ArrowLeft') {
//         targetRotation += theta;
//     } else {
//         targetRotation -= theta;
//     }
//     targetRotation = Math.round(targetRotation / theta) * theta;
// }


// ── DRAG ELSE — pointermove ───────────────────────────────────────────────────
// } else {
//     const dragSensitivity = dragPointerType === 'touch' ? 0.28 : 0.15;
//     targetRotation += dx * dragSensitivity;
// }
// Also add to pointerdown:  dragStartRotation = targetRotation;


// ── DRAG ELSE — pointerup ─────────────────────────────────────────────────────
// } else {
//     const startSnapIndex = Math.round(dragStartRotation / theta);
//     const touchSwipeThreshold = Math.min(72, window.innerWidth * 0.09);
//     if (dragPointerType === 'touch' && Math.abs(totalDrag) > touchSwipeThreshold) {
//         const direction = totalDrag < 0 ? -1 : 1;
//         targetRotation = (startSnapIndex + direction) * theta;
//     } else {
//         targetRotation = Math.round(targetRotation / theta) * theta;
//     }
// }


// ── WHEEL ─────────────────────────────────────────────────────────────────────
// let wheelTimeout;
// carouselContainer.addEventListener('wheel', (e) => {
//     if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
//         e.preventDefault();
//         targetRotation += Math.sign(e.deltaX) * -theta * 0.15;
//         clearTimeout(wheelTimeout);
//         wheelTimeout = setTimeout(() => {
//             targetRotation = Math.round(targetRotation / theta) * theta;
//         }, 150);
//     }
// }, { passive: false });
