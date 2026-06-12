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

    // T5 — Génération aperçu SVG temps réel
    // T5 — Génération aperçu SVG temps réel
    #[Route('/api/avatar/generate', methods: ['POST'])]
    // Dans ton AvatarController.php
    public function generate(Request $request)
    {
        $data = json_decode($request->getContent(), true);
        $selections = $data['choices'] ?? [];

        // Ton tableau d'ordre pour superposer les éléments
        $order = ['background', 'skin', 'clothes', 'top', 'facialhair', 'mouth', 'nose', 'eyes', 'eyebrow'];

        $svgParts = [];

        foreach ($order as $category) {
            $name = $selections[$category] ?? 'Default';

            $element = $this->dm->getRepository(Element::class)->findOneBy([
                'nom' => $name,
                'categorie' => $category
            ]);

            // On envoie le contenu du SVG dans le tableau
            $svgParts[$category] = $element ? $element->getSvgContent() : '';
        }
        $svgParts['skinName'] = $selections['skin'] ?? 'Default';
        // IMPORTANT : On renvoie un JSON, PAS du HTML/SVG
        return $this->json($svgParts);
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

        // Générer le SVG final
        // Dans AvatarController.php
       $order = ['background', 'skin', 'body', 'clothes', 'top', 'facialhair', 'mouth', 'nose', 'eyes', 'eyebrow'];
        $svgContent = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">';
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
        $svgContent .= '</svg>';

        // Sauvegarder le fichier SVG
        $filename = uniqid('avatar_') . '.svg';
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }
        file_put_contents($uploadDir . $filename, $svgContent);

        // Créer le document en base
        $avatar = new Avatar();
        $avatar->setUserId($userId);
        $avatar->setNom($nom);
        $avatar->setFichier('/avatars/' . $filename);
        $avatar->setSelections($selections);
        $avatar->setStatus('pending');

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
            $data[] = [
                '_id' => $avatar->getId(),
                'nom' => $avatar->getNom(),
                'fichier' => $avatar->getFichier(),
                'status' => $avatar->getStatus(),
                'createdAt' => $avatar->getCreatedAt()->format('Y-m-d'),
                'validatedAt' => $avatar->getValidatedAt()?->format('Y-m-d'),
            ];
        }

        return $this->json($data);
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

        // Supprimer le fichier SVG
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

        $filePath = $this->getParameter('kernel.project_dir') . '/public' . $avatar->getFichier();
        if (!file_exists($filePath)) {
            return new JsonResponse(['error' => 'Fichier introuvable'], 404);
        }

        return new Response(
            file_get_contents($filePath),
            200,
            [
                'Content-Type' => 'image/svg+xml',
                'Content-Disposition' => 'attachment; filename="' . $avatar->getNom() . '.svg"'
            ]
        );
    }
}
