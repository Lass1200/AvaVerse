<?php

namespace App\Controller;

use App\Document\Avatar;
use App\Document\Element;
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
            $avatarFile = $avatar->getFichier();
            $filePath = $avatarFile ? $this->getParameter('kernel.project_dir') . '/public' . $avatarFile : null;
            $svgContent = null;

            if (!empty($avatar->getSelections())) {
                $svgContent = $this->buildAvatarSvg($avatar->getSelections());
            } elseif ($filePath && is_file($filePath)) {
                $svgContent = file_get_contents($filePath);
            }

            $data[] = [
                '_id'         => $avatar->getId(),
                'userId'      => $avatar->getUserId(),
                'nom'         => $avatar->getNom(),
                'fichier'     => $avatarFile,
                'svgContent'  => $svgContent,
                'selections'  => $avatar->getSelections(),
                'status'      => $avatar->getStatus(),
                'rejectionReason' => $avatar->getRejectionReason(),
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
        $rejectionReason = trim((string) ($data['rejectionReason'] ?? ''));

        if (!in_array($status, ['approved', 'rejected'])) {
            return $this->json(['error' => 'Status invalide (approved ou rejected)'], 400);
        }

        $avatar = $this->dm->getRepository(Avatar::class)->find($id);

        if (!$avatar) {
            return $this->json(['error' => 'Avatar introuvable'], 404);
        }

        $avatar->setStatus($status);
        $avatar->setValidatedAt(new \DateTime());
        $avatar->setRejectionReason($status === 'rejected' ? ($rejectionReason ?: 'Aucun motif précisé par l’administrateur.') : null);

        $this->dm->flush();

        $message = $status === 'approved'
            ? 'Avatar validé, téléchargeable par l\'utilisateur'
            : 'Avatar refusé';

        return $this->json(['message' => $message, 'status' => $status]);
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
