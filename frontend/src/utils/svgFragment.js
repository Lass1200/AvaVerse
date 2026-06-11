const SKIN_COLORS = {
    Light: '#EDB98A',
    Tanned: '#FD9841',
    Yellow: '#F8D25C',
    Pale: '#FFDBB4',
    Brown: '#D08B5B',
    DarkBrown: '#AE5D29',
    Black: '#614335'
};

const HAT_COLORS = {
    Black: '#262E33',
    Blue01: '#65C9FF',
    Blue02: '#5199E4',
    Blue03: '#25557C',
    Gray01: '#E6E6E6',
    Gray02: '#929598',
    Heather: '#3C4F5C',
    PastelBlue: '#B1E2FF',
    PastelGreen: '#A7FFC4',
    PastelOrange: '#FFDEB5',
    PastelRed: '#FFAFB9',
    PastelYellow: '#FFFFB1',
    Pink: '#FF488E',
    Red: '#FF5C5C',
    White: '#FFFFFF'
};

const HAIR_COLORS = {
    Auburn: '#A55728',
    Black: '#2C1B18',
    Blonde: '#B58143',
    BlondeGolden: '#D6B370',
    Brown: '#724133',
    BrownDark: '#4A312C',
    PastelPink: '#F59797',
    Blue: '#000fdb',
    Platinum: '#ECDCBF',
    Red: '#C93305',
    SilverGray: '#E8E1E1'
};

const CLOTHE_COLORS = { ...HAT_COLORS };

export function getSkinFill(skinName) {
    return SKIN_COLORS[skinName] || SKIN_COLORS.Light;
}

export function prefixSvgIds(svg, prefix) {
    if (!svg) {
        return '';
    }

    const ids = new Set();
    const idPattern = /\bid=(["'])([^"']+)\1/g;
    let match;

    while ((match = idPattern.exec(svg)) !== null) {
        ids.add(match[2]);
    }

    let result = svg;
    for (const id of ids) {
        const nextId = `${prefix}-${id}`;
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result
            .replace(new RegExp(`\\bid=(["'])${escaped}\\1`, 'g'), `id="${nextId}"`)
            .replace(new RegExp(`url\\(#${escaped}\\)`, 'g'), `url(#${nextId})`)
            .replace(new RegExp(`xlink:href=(["'])#${escaped}\\1`, 'g'), `xlink:href="#${nextId}"`)
            .replace(new RegExp(`href=(["'])#${escaped}\\1`, 'g'), `href="#${nextId}"`);
    }

    return result;
}

export function inlineColorComponent(type, maskVar, defaultColor, prefix) {
    const palettes = {
        hat: HAT_COLORS,
        hair: HAIR_COLORS,
        clothe: CLOTHE_COLORS
    };
    const defaults = {
        hat: 'Blue03',
        hair: 'BrownDark',
        clothe: 'Blue03'
    };
    const heights = {
        hat: 280,
        hair: 280,
        clothe: 110
    };

    const palette = palettes[type];
    const color = palette[defaultColor] || palette[defaults[type]];
    const maskId = `${prefix}-${maskVar}`;

    return `<g mask="url(#${maskId})" fill-rule="evenodd" fill="${color}"><rect x="0" y="0" width="264" height="${heights[type]}" /></g>`;
}

export { SKIN_COLORS, HAT_COLORS, HAIR_COLORS, CLOTHE_COLORS };
