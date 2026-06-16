import React, { useMemo } from 'react';
import { getSkinFill, prefixSvgIds } from '../utils/svgFragment.js';

const BODY_PATH =
    'M124,144.610951 L124,163 L128,163 L128,163 C167.764502,163 200,195.235498 200,235 L200,244 L0,244 L0,235 C-4.86974701e-15,195.235498 32.235498,163 72,163 L72,163 L76,163 L76,144.610951 C58.7626345,136.422372 46.3722246,119.687011 44.3051388,99.8812385 C38.4803105,99.0577866 34,94.0521096 34,88 L34,74 C34,68.0540074 38.3245733,63.1180731 44,62.1659169 L44,56 L44,56 C44,25.072054 69.072054,5.68137151e-15 100,0 L100,0 L100,0 C130.927946,-5.68137151e-15 156,25.072054 156,56 L156,62.1659169 C161.675427,63.1180731 166,68.0540074 166,74 L166,88 C166,94.0521096 161.51969,99.0577866 155.694861,99.8812385 C153.627775,119.687011 141.237365,136.422372 124,144.610951 Z';

const NECK_SHADOW =
    'M156,79 L156,102 C156,132.927946 130.927946,158 100,158 C69.072054,158 44,132.927946 44,102 L44,79 L44,94 C44,124.927946 69.072054,150 100,150 C130.927946,150 156,124.927946 156,94 L156,79 Z';

function SvgLayer({ content }) {
    if (!content) return null;
    return <g dangerouslySetInnerHTML={{ __html: content }} />;
}

export default function AvatarRenderer({ selections, skinName = 'Light' }) {
    const parts = useMemo(() => {
        const rawFacialhair = prefixSvgIds(selections?.facialhair, 'facialhair');
        
        // 1. On cherche si le SVG a déjà un attribut "transform=" (ex: Moustache Magnum)
        const hasTransform = /\btransform\s*=/i.test(rawFacialhair);
        
        // 2. AUTOMATISATION : Si aucun transform n'est détecté (ex: ton Goatee personnalisé),
        // on l'enveloppe dynamiquement dans le repère standard des barbes d'Avataaars.
        const finalizedFacialhair = (rawFacialhair && !hasTransform)
            ? `<g transform="translate(49.000000, 72.000000)">${rawFacialhair}</g>`
            : rawFacialhair;

        return {
            clothes: prefixSvgIds(selections?.clothes, 'clothes'),
            mouth: prefixSvgIds(selections?.mouth, 'mouth'),
            nose: prefixSvgIds(selections?.nose, 'nose'),
            eyes: prefixSvgIds(selections?.eyes, 'eyes'),
            eyebrow: prefixSvgIds(selections?.eyebrow, 'eyebrow'),
            facialhair: finalizedFacialhair,
            top: prefixSvgIds(selections?.top, 'top')
        };
    }, [selections]);

    const skinFill = getSkinFill(skinName);

    if (!selections || Object.keys(selections).length === 0) {
        return <svg width="264px" height="280px" viewBox="0 0 264 280" xmlns="http://www.w3.org/2000/svg" />;
    }

    return (
        <svg
            width="264px"
            height="280px"
            viewBox="0 0 264 280"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
        >
            <defs>
                <path d={BODY_PATH} id="av-body-path" />
            </defs>

            <g id="Avataaar" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g transform="translate(-825.000000, -1100.000000)" id="Avataaar-Frame">
                    <g transform="translate(825.000000, 1100.000000)">
                        <g id="Avataaar-Content" strokeWidth="1" fillRule="evenodd">
                            <g id="Body" transform="translate(32.000000, 36.000000)">
                                <mask id="av-body-mask" fill="white"><use xlinkHref="#av-body-path" /></mask>
                                <use fill="#D0C6AC" xlinkHref="#av-body-path" />
                                <g mask="url(#av-body-mask)" fill={skinFill}><rect x="0" y="0" width="264" height="280" /></g>
                                <path d={NECK_SHADOW} fillOpacity="0.1" fill="#000000" mask="url(#av-body-mask)" />
                            </g>

                            <SvgLayer content={parts.clothes} />

                            {/* Le groupe Face ne contient plus que les micro-éléments */}
                            <g id="Face" transform="translate(76.000000, 82.000000)" fill="#000000">
                                <SvgLayer content={parts.mouth} />
                                <SvgLayer content={parts.nose} />
                                <SvgLayer content={parts.eyes} />
                                <SvgLayer content={parts.eyebrow} />
                            </g>

                            {/* La barbe est positionnée ici au niveau global (avec ou sans son transform natif) */}
                            <SvgLayer content={parts.facialhair} />
                            
                            <SvgLayer content={parts.top} />
                        </g>
                    </g>
                </g>
            </g>
        </svg>
    );
}