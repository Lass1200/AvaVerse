<?php

namespace App\Controller;

use App\Document\Avatar;
use App\Document\Element;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AvatarController extends AbstractController
{
    public function __construct(private DocumentManager $dm)
    {
    }

    // T6 — Soumission d'un avatar
    #[Route('/api/avatars', methods: ['POST'])]
    public function submit(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $data = json_decode($request->getContent(), true);
        $userId = $this->getUser()->getUserIdentifier();
        $selections = $data['selections'] ?? [];
        $nom = $data['nom'] ?? 'Mon Avatar';

        $svgContent = $this->buildAvatarSvg($selections);

        // --- CORRECTION BLINDAGE DOSSIER ---
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = uniqid('avatar_') . '.svg';
        file_put_contents($uploadDir . $filename, $svgContent);

        // Créer le document en base
        $avatar = new Avatar();
        $avatar->setUserId($userId);
        $avatar->setNom($nom);
        $avatar->setFichier('/avatars/' . $filename);
        $avatar->setSelections($selections);
        $avatar->setStatus('pending');
        $avatar->setRejectionReason(null);

        if (method_exists($avatar, 'setCreatedAt') && !$avatar->getCreatedAt()) {
            $avatar->setCreatedAt(new \DateTime());
        }

        $this->dm->persist($avatar);
        $this->dm->flush();

        return $this->json([
            'message' => 'Avatar soumis, en attente de validation',
            '_id' => $avatar->getId(),
            'status' => 'pending'
        ], 201);
    }
    // T7 — Bibliothèque utilisateur
    #[Route('/api/avatars/mine', methods: ['GET'])]
    public function myAvatars(): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        $userId = $this->getUser()->getUserIdentifier();
        $avatars = $this->dm->getRepository(Avatar::class)->findBy(['userId' => $userId]);

        $data = [];
        foreach ($avatars as $avatar) {
            $createdAtStr = $avatar->getCreatedAt() ? $avatar->getCreatedAt()->format('Y-m-d') : date('Y-m-d');
            $validatedAtStr = $avatar->getValidatedAt() ? $avatar->getValidatedAt()->format('Y-m-d') : null;
            $svgContent = null;
            $avatarFile = $avatar->getFichier();
            $filePath = $avatarFile ? $this->getParameter('kernel.project_dir') . '/public' . $avatarFile : null;

            if (!empty($avatar->getSelections())) {
                $svgContent = $this->buildAvatarSvg($avatar->getSelections());
            } elseif ($filePath && is_file($filePath)) {
                $svgContent = file_get_contents($filePath);
            }

            $data[] = [
                '_id' => $avatar->getId(),
                'nom' => $avatar->getNom(),
                'fichier' => $avatarFile,
                'svgContent' => $svgContent,
                'status' => $avatar->getStatus(),
                'rejectionReason' => $avatar->getRejectionReason(),
                'selections' => $avatar->getSelections(),
                'createdAt' => $createdAtStr,
                'validatedAt' => $validatedAtStr,
            ];
        }

        return $this->json($data);
    }

    #[Route('/api/avatars/{id}', methods: ['PUT'])]
    public function updateAvatar(string $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $userId = $this->getUser()->getUserIdentifier();
        $avatar = $this->dm->getRepository(Avatar::class)->find($id);

        if (!$avatar || $avatar->getUserId() !== $userId) {
            return $this->json(['error' => 'Avatar introuvable ou non autorisé'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $selections = $data['selections'] ?? [];
        $nom = $data['nom'] ?? $avatar->getNom();
        $svgContent = $this->buildAvatarSvg($selections);

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $oldFile = $avatar->getFichier();
        $oldPath = $oldFile ? $this->getParameter('kernel.project_dir') . '/public' . $oldFile : null;
        if ($oldPath && is_file($oldPath)) {
            unlink($oldPath);
        }

        $filename = uniqid('avatar_') . '.svg';
        file_put_contents($uploadDir . $filename, $svgContent);

        $avatar->setNom($nom);
        $avatar->setFichier('/avatars/' . $filename);
        $avatar->setSelections($selections);
        $avatar->setStatus('pending');
        $avatar->setValidatedAt(null);
        $avatar->setRejectionReason(null);

        $this->dm->flush();

        return $this->json([
            'message' => 'Avatar modifié et remis en attente de validation',
            '_id' => $avatar->getId(),
            'status' => 'pending'
        ]);
    }

    // T8 — Suppression avatar
    #[Route('/api/avatars/{id}', methods: ['DELETE'])]
    public function deleteAvatar(string $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        $userId = $this->getUser()->getUserIdentifier();
        $avatar = $this->dm->getRepository(Avatar::class)->find($id);

        if (!$avatar || $avatar->getUserId() !== $userId) {
            return $this->json(['error' => 'Avatar introuvable ou non autorisé'], 403);
        }

        $filePath = $this->getParameter('kernel.project_dir') . '/public' . $avatar->getFichier();
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $this->dm->remove($avatar);
        $this->dm->flush();

        return $this->json(['message' => 'Avatar supprimé']);
    }

    // T9 — Téléchargement SVG
    #[Route('/api/avatars/download/{id}', methods: ['GET'])]
    public function download(string $id): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        $userId = $this->getUser()->getUserIdentifier();
        $avatar = $this->dm->getRepository(Avatar::class)->find($id);

        if (!$avatar || $avatar->getUserId() !== $userId) {
            return new JsonResponse(['error' => 'Non autorisé'], 403);
        }

        if ($avatar->getStatus() !== 'approved') {
            return new JsonResponse(['error' => 'Avatar non validé'], 403);
        }

        // Serve rebuilt SVG when possible, so old generated files do not keep visual offsets.
        $svgContent = !empty($avatar->getSelections()) ? $this->buildAvatarSvg($avatar->getSelections()) : null;
        if ($svgContent === null) {
            $filePath = $this->getParameter('kernel.project_dir') . '/public' . $avatar->getFichier();
            if (!file_exists($filePath)) {
                return new JsonResponse(['error' => 'Fichier introuvable'], 404);
            }
            $svgContent = file_get_contents($filePath);
        }

        return new Response(
            $svgContent,
            200,
            [
                'Content-Type' => 'image/svg+xml',
                'Content-Disposition' => 'attachment; filename="' . $avatar->getNom() . '.svg"'
            ]
        );
    }

    private function buildAvatarSvg(array $selections): string
    {
        $skinColors = [
            'Light' => '#EDB98A',
            'Tanned' => '#FD9841',
            'Yellow' => '#F8D25C',
            'Pale' => '#FFDBB4',
            'Brown' => '#D08B5B',
            'DarkBrown' => '#AE5D29',
            'Black' => '#614335',
        ];
        $skinName = $selections['skin'] ?? 'Light';
        $skinFill = $skinColors[$skinName] ?? $skinColors['Light'];
        $bodyPath = 'M124,144.610951 L124,163 L128,163 L128,163 C167.764502,163 200,195.235498 200,235 L200,244 L0,244 L0,235 C-4.86974701e-15,195.235498 32.235498,163 72,163 L72,163 L76,163 L76,144.610951 C58.7626345,136.422372 46.3722246,119.687011 44.3051388,99.8812385 C38.4803105,99.0577866 34,94.0521096 34,88 L34,74 C34,68.0540074 38.3245733,63.1180731 44,62.1659169 L44,56 L44,56 C44,25.072054 69.072054,5.68137151e-15 100,0 L100,0 L100,0 C130.927946,-5.68137151e-15 156,25.072054 156,56 L156,62.1659169 C161.675427,63.1180731 166,68.0540074 166,74 L166,88 C166,94.0521096 161.51969,99.0577866 155.694861,99.8812385 C153.627775,119.687011 141.237365,136.422372 124,144.610951 Z';
        $order = ['background', 'clothes'];
        $faceOrder = ['mouth', 'nose', 'eyes', 'eyebrow'];

        $svgContent = '<svg viewBox="0 0 264 280" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
        $svgContent .= '<defs><path d="' . $bodyPath . '" id="av-body-path" /></defs>';
        $svgContent .= '<g transform="translate(32.000000, 36.000000)">';
        $svgContent .= '<mask id="av-body-mask" fill="white"><use xlink:href="#av-body-path" /></mask>';
        $svgContent .= '<use fill="#D0C6AC" xlink:href="#av-body-path" />';
        $svgContent .= '<g mask="url(#av-body-mask)" fill="' . $skinFill . '"><rect x="0" y="0" width="264" height="280" /></g>';
        $svgContent .= '</g>';

        foreach ($order as $categorie) {
            if (!empty($selections[$categorie])) {
                $element = $this->dm->getRepository(Element::class)->findOneBy([
                    'nom' => $selections[$categorie],
                    'categorie' => $categorie,
                    'actif' => true
                ]);
                if ($element) {
                    $svgContent .= $element->getSvgContent();
                }
            }
        }

        $svgContent .= '<g transform="translate(76.000000, 82.000000)" fill="#000000">';
        foreach ($faceOrder as $categorie) {
            if (!empty($selections[$categorie])) {
                $element = $this->dm->getRepository(Element::class)->findOneBy([
                    'nom' => $selections[$categorie],
                    'categorie' => $categorie,
                    'actif' => true
                ]);
                if ($element) {
                    $svgContent .= $element->getSvgContent();
                }
            }
        }
        $svgContent .= '</g>';

        // Facial hair is positioned at the global avatar level.
        if (!empty($selections['facialhair'])) {
            $element = $this->dm->getRepository(Element::class)->findOneBy([
                'nom' => $selections['facialhair'],
                'categorie' => 'facialhair',
                'actif' => true
            ]);
            if ($element) {
                $facialhair = $element->getSvgContent();
                if (!preg_match('/\btransform\s*=/i', $facialhair)) {
                    $facialhair = '<g transform="translate(49.000000, 72.000000)">' . $facialhair . '</g>';
                }
                $svgContent .= $facialhair;
            }
        }

        if (!empty($selections['top'])) {
            $element = $this->dm->getRepository(Element::class)->findOneBy([
                'nom' => $selections['top'],
                'categorie' => 'top',
                'actif' => true
            ]);
            if ($element) {
                $svgContent .= $element->getSvgContent();
            }
        }

        $svgContent .= '</svg>';

        return $svgContent;
    }

}
