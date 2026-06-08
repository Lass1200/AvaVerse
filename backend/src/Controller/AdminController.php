<?php

namespace App\Controller;

use App\Document\Avatar;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    public function __construct(private DocumentManager $dm) {}

    // T11 — Liste avatars en attente
    #[Route('/avatars', methods: ['GET'])]
    public function listAvatars(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $status  = $request->query->get('status', 'pending');
        $avatars = $this->dm->getRepository(Avatar::class)->findBy(['status' => $status]);

        $data = [];
        foreach ($avatars as $avatar) {
            $data[] = [
                '_id'         => $avatar->getId(),
                'userId'      => $avatar->getUserId(),
                'nom'         => $avatar->getNom(),
                'fichier'     => $avatar->getFichier(),
                'status'      => $avatar->getStatus(),
                'createdAt'   => $avatar->getCreatedAt()->format('Y-m-d H:i'),
                'validatedAt' => $avatar->getValidatedAt()?->format('Y-m-d H:i'),
            ];
        }

        return $this->json($data);
    }

    // T12 & T13 — Valider ou refuser un avatar
    #[Route('/avatars/{id}', methods: ['PATCH'])]
    public function moderateAvatar(string $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data   = json_decode($request->getContent(), true);
        $status = $data['status'] ?? null;

        if (!in_array($status, ['approved', 'rejected'])) {
            return $this->json(['error' => 'Status invalide (approved ou rejected)'], 400);
        }

        $avatar = $this->dm->getRepository(Avatar::class)->find($id);

        if (!$avatar) {
            return $this->json(['error' => 'Avatar introuvable'], 404);
        }

        $avatar->setStatus($status);
        $avatar->setValidatedAt(new \DateTime());

        $this->dm->flush();

        $message = $status === 'approved'
            ? 'Avatar validé, téléchargeable par l\'utilisateur'
            : 'Avatar refusé';

        return $this->json(['message' => $message, 'status' => $status]);
    }
}
