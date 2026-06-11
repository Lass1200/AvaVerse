import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLOTHE_COLORS, HAIR_COLORS, HAT_COLORS } from '../frontend/src/utils/svgFragment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(__dirname, 'src/avatar');
const outputFile = path.join(__dirname, 'init-elements.js');

const SKIP_FILES = new Set([
    'index.tsx',
    'piece.tsx',
    'Colors.tsx',
    'Graphics.tsx',
    'HairColor.tsx',
    'HatColor.tsx',
    'Blank.tsx'
]);

const categoriesMapping = {
    clothes: 'clothes',
    top: 'top',
    facialhair: 'top/facialHair',
    eyebrow: 'face/eyebrow',
    eyes: 'face/eyes',
    nose: 'face/nose',
    mouth: 'face/mouth'
};

function extractReturnJsx(source) {
    const returnIndex = source.indexOf('return (');
    if (returnIndex === -1) {
        return null;
    }

    let index = returnIndex + 'return ('.length;
    let depth = 1;

    while (index < source.length && depth > 0) {
        if (source[index] === '(') {
            depth += 1;
        } else if (source[index] === ')') {
            depth -= 1;
        }
        index += 1;
    }

    return source.slice(returnIndex + 'return ('.length, index - 1).trim();
}

function collectIds(source, prefix) {
    const ids = new Map();
    const pattern = /private\s+(\w+)\s*=\s*uniqueId\(/g;
    let match;

    while ((match = pattern.exec(source)) !== null) {
        ids.set(match[1], `${prefix}-${match[1]}`);
    }

    return ids;
}

function inlineColorLayer(type, maskVar, defaultColor, prefix) {
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

function jsxToSvg(jsx, source, prefix) {
    if (jsx === 'null') {
        return '';
    }

    const ids = collectIds(source, prefix);
    let svg = jsx;

    svg = svg
        .replace(/\{this\.props\.children\}/g, '')
        .replace(/<FacialHair\s*\/>/g, '')
        .replace(/<Accessories\s*\/>/g, '')
        .replace(/<Graphics[^>]*\/>/g, '');

    svg = svg.replace(
        /<HatColor\s+maskID=\{(\w+)\}(?:\s+defaultColor=['"](\w+)['"])?\s*\/>/g,
        (_, maskVar, defaultColor) => inlineColorLayer('hat', maskVar, defaultColor, prefix)
    );
    svg = svg.replace(
        /<HairColor\s+maskID=\{(\w+)\}\s*\/>/g,
        (_, maskVar) => inlineColorLayer('hair', maskVar, 'BrownDark', prefix)
    );
    svg = svg.replace(
        /<Colors\s+maskID=\{(\w+)\}\s*\/>/g,
        (_, maskVar) => inlineColorLayer('clothe', maskVar, 'Blue03', prefix)
    );

    for (const [name, value] of ids.entries()) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        svg = svg
            .replace(new RegExp(`id=\\{${escaped}\\}`, 'g'), `id="${value}"`)
            .replace(new RegExp(`xlinkHref=\\{'#' \\+ ${escaped}\\}`, 'g'), `xlink:href="#${value}"`)
            .replace(new RegExp(`mask=\\{\`url\\(#\\$\\{${escaped}\\}\\)\`\\}`, 'g'), `mask="url(#${value})"`);
    }

    for (const [name, value] of ids.entries()) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        svg = svg.replace(new RegExp(`\\{${escaped}\\}`, 'g'), `"${value}"`);
    }

    svg = svg
        .replace(/strokeWidth=/g, 'stroke-width=')
        .replace(/fillRule=/g, 'fill-rule=')
        .replace(/fillOpacity=/g, 'fill-opacity=')
        .replace(/strokeLinecap=/g, 'stroke-linecap=')
        .replace(/xmlnsXlink=/g, 'xmlns:xlink=')
        .replace(/xlinkHref=/g, 'xlink:href=')
        .replace(/'/g, '"');

    svg = svg.replace(/mask=\{"url\(#([^"]+)\)"\}/g, 'mask="url(#$1)"');
    svg = svg.replace(/`\s*url\(#([^)]+)\)\s*`/g, 'url(#$1)');

    return svg.replace(/\s+/g, ' ').trim();
}

const allElements = [];

for (const [categoryName, relativePath] of Object.entries(categoriesMapping)) {
    const dirPath = path.join(sourceDir, relativePath);
    if (!fs.existsSync(dirPath)) {
        continue;
    }

    for (const file of fs.readdirSync(dirPath)) {
        if (!file.endsWith('.tsx') || SKIP_FILES.has(file)) {
            continue;
        }

        const source = fs.readFileSync(path.join(dirPath, file), 'utf8');
        const jsx = extractReturnJsx(source);
        if (!jsx) {
            continue;
        }

        const nom = path.basename(file, '.tsx');
        const prefix = `${categoryName}-${nom.toLowerCase()}`;
        const svgContent = jsxToSvg(jsx, source, prefix);

        allElements.push({
            categorie: categoryName,
            nom,
            svgContent,
            actif: true,
            createdAt: 'new Date()'
        });
    }
}

const jsonElements = JSON.stringify(allElements, null, 4).replace(/"new Date\(\)"/g, 'new Date()');
const scriptContent = `
const database = 'Avaverse';
const collection = 'elements';
use(database);
db[collection].drop();
db[collection].insertMany(${jsonElements});
print('Catalogue Avataaars importe avec succes (${allElements.length} elements).');
`;

fs.writeFileSync(outputFile, scriptContent);
console.log(`Generated ${allElements.length} elements in ${outputFile}`);
