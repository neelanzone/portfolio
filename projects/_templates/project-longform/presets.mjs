function toTitleCase(value) {
    return String(value ?? '')
        .split('-')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

const characterRoleOrder = ['speed', 'tank', 'assassin', 'cleric', 'necromancer', 'mystic'];

const characterRoleLabels = {
    speed: 'Speedster',
    tank: 'Tank',
    assassin: 'Assassin',
    cleric: 'Cleric',
    necromancer: 'Necromancer',
    mystic: 'Mystic'
};

const characterRoleBodies = {
    speed: 'These kits are tuned for momentum, lane pressure, and fast repositioning across the board.',
    tank: 'These kits are built around endurance, threat absorption, and holding tactical space for longer.',
    assassin: 'These kits sharpen timing, precision, and opportunistic plays that punish hesitation.',
    cleric: 'These kits focus on sustain, recovery, and stabilising a match after a costly swing.',
    necromancer: 'These kits lean into attrition, lingering threat, and consequences that outlast a single turn.',
    mystic: 'These kits widen the decision space with flexible abilities, layered effects, and high agency turns.'
};

const ludoCharacterFiles = [
    'character-flat-bhairava-necromancer.jpg',
    'character-flat-chemban-tank.jpg',
    'character-flat-gargi-mystic.jpg',
    'character-flat-gulbahar-speed.jpg',
    'character-flat-ilango-mystic.jpg',
    'character-flat-kabir-mystic.jpg',
    'character-flat-kali-assassin.jpg',
    'character-flat-kalya-assassin.jpg',
    'character-flat-kaveri-cleric.jpg',
    'character-flat-maari-tank.jpg',
    'character-flat-maya-assassin.jpg',
    'character-flat-nishi-necromancer.jpg',
    'character-flat-noorjehan-tank.jpg',
    'character-flat-prasanna-cleric.jpg',
    'character-flat-pratima-tank.jpg',
    'character-flat-rafi-mystic.jpg',
    'character-flat-raktim-assassin.jpg',
    'character-flat-tariq-speed.jpg',
    'character-flat-veera-speed.jpg',
    'character-flat-velan-speed.jpg'
];

function getCharacterRoleOrder(role) {
    const order = characterRoleOrder.indexOf(role);
    return order === -1 ? characterRoleOrder.length : order;
}

function buildCharacterBody(name, roleKey, roleLabel) {
    return `${name} explores the ${roleLabel.toLowerCase()} archetype inside the Ludo RPG system. ${characterRoleBodies[roleKey] || 'This pass focuses on how the role should feel in motion, timing, and board presence.'} The fullscreen viewer pairs the flat exploration with its stylised alternate so both visual directions can be compared in motion and detail.`;
}

function buildLudoCharacterPreset() {
    return ludoCharacterFiles
        .map((filename) => {
            const slug = filename
                .replace(/^character-flat-/, '')
                .replace(/\.[^.]+$/, '');
            const segments = slug.split('-');
            const role = segments[segments.length - 1];
            const name = toTitleCase(segments.slice(0, -1).join('-'));
            const roleLabel = characterRoleLabels[role] || toTitleCase(role);

            return {
                id: slug,
                name,
                role,
                roleLabel,
                title: `${name} / ${roleLabel}`,
                body: buildCharacterBody(name, role, roleLabel),
                src: `Assets/ludo-rpg-cards/characters-iteration-01-flat/${filename}`,
                secondarySrc: `Assets/ludo-rpg-cards/character-iteration-01-stylised/${filename.replace('character-flat-', 'character-stylised-')}`,
                alt: `Ludo RPG flat character card ${name} ${roleLabel}`
            };
        })
        .sort((left, right) => {
            const roleDifference = getCharacterRoleOrder(left.role) - getCharacterRoleOrder(right.role);
            return roleDifference || left.name.localeCompare(right.name);
        });
}

export function getArtifactPreset(presetName) {
    if (presetName === 'ludo-characters-iteration-01') {
        return buildLudoCharacterPreset();
    }

    return [];
}
