<?php
// convert.php

$sourceDir = __DIR__ . '/src/avatar'; // Dossier racine du package
$outputFile = __DIR__ . '/init-elements.js';

// Liste complète des catégories et leur chemin réel dans l'arborescence Avataaars
$categoriesMapping = [
    'clothes'    => 'clothes',
    'top'        => 'top',
    'facialhair' => 'top/facialhair', // <-- AJOUT DE LA PILOSITÉ FACIALE ICI !
    'eyebrow'    => 'face/eyebrow',
    'eyes'       => 'face/eyes',
    'nose'       => 'face/nose',
    'mouth'      => 'face/mouth'
];

$allElements = [];

foreach ($categoriesMapping as $categoryName => $relativePath) {
    $dirPath = $sourceDir . '/' . $relativePath;
    if (!is_dir($dirPath)) {
        echo "Attention : Le dossier $dirPath n'existe pas, on passe au suivant.\n";
        continue;
    }

    $files = scandir($dirPath);
    foreach ($files as $file) {
        if (str_ends_with($file, '.tsx')) {
            $content = file_get_contents($dirPath . '/' . $file);

            // Expression régulière pour attraper le contenu du return ( )
            if (preg_match('/return\s*\(\s*([\s\S]*?)\s*\)/', $content, $matches)) {
                $svgContent = trim($matches[1]);

                // 1. Remplacement des propriétés JSX spécifiques en attributs SVG standards
                $svgContent = str_replace('fillOpacity=', 'fill-opacity=', $svgContent);
                $svgContent = str_replace('fillRule=', 'fill-rule=', $svgContent);
                $svgContent = str_replace('strokeWidth=', 'stroke-width=', $svgContent);
                $svgContent = str_replace('strokeLinecap=', 'stroke-linecap=', $svgContent);
                
                // 2. Remplacement propre des guillemets simples extérieurs par des doubles si nécessaire
                // (Prévient les bugs d'importation dans MongoDB)
                $svgContent = str_replace("'", '"', $svgContent); 

                $nom = basename($file, '.tsx');

                $allElements[] = [
                    'categorie'  => $categoryName, // Garde le nom propre de la collection (ex: facialhair)
                    'nom'        => $nom,
                    'svgContent' => $svgContent,
                    'actif'      => true,
                    'createdAt'  => 'new Date()'
                ];
            }
        }
    }
}

// Convertir le tableau PHP en texte JSON propre pour MongoDB
$jsonElements = json_encode($allElements, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
// Rendre la date valide pour MongoDB (enlever les guillemets autour de new Date())
$jsonElements = str_replace('"new Date()"', 'new Date()', $jsonElements);

$scriptContent = "
const database = 'Avaverse';
const collection = 'elements';
use(database);
db[collection].drop();
db[collection].insertMany($jsonElements);
print('Catalogue automatique Avataaars (avec barbes/moustaches) importé avec succès !');
";

file_put_contents($outputFile, $scriptContent);
echo "Félicitations ! " . count($allElements) . " éléments au total ont été générés dans init-elements.js\n";