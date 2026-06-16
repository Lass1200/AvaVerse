<?php

namespace App\Controller;

use App\Document\Element;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ElementController extends AbstractController
{
    public function __construct(private DocumentManager $dm) {}

    // T4 — Récupération du catalogue (user)
    #[Route('/api/elements', methods: ['GET'])]
    public function getElements(): JsonResponse
    {
        $elements = $this->dm->getRepository(Element::class)->findBy(['actif' => true]);

        $data = [];
        foreach ($elements as $el) {
            $data[] = [
                '_id'        => $el->getId(),
                'nom'        => $el->getNom(),
                'categorie'  => $el->getCategorie(),
                'svgContent' => $el->getSvgContent(),
            ];
        }

        return $this->json($data);
    }

    // T14 — Liste catalogue admin
    #[Route('/api/admin/elements', methods: ['GET'])]
    public function adminGetElements(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $elements = $this->dm->getRepository(Element::class)->findAll();

        $data = [];
        foreach ($elements as $el) {
            $data[] = [
                '_id'        => $el->getId(),
                'nom'        => $el->getNom(),
                'categorie'  => $el->getCategorie(),
                'svgContent' => $el->getSvgContent(),
                'actif'      => $el->isActif(),
            ];
        }

        return $this->json($data);
    }

    // T15 — Ajout élément admin
    #[Route('/api/admin/elements', methods: ['POST'])]
   // T15 — Ajout élément admin
#[Route('/api/admin/elements', methods: ['POST'])]
public function adminAddElement(Request $request): JsonResponse
{
    $this->denyAccessUnlessGranted('ROLE_ADMIN');

    $data = json_decode($request->getContent(), true);

    if (empty($data['nom']) || empty($data['categorie']) || empty($data['svgContent'])) {
        return $this->json(['error' => 'nom, categorie et svgContent requis'], 400);
    }

    // Nettoyage : on retire les balises <svg ...> et </svg> pour ne garder que le contenu interne
    $cleanedSvg = preg_replace('/<\/?svg[^>]*>/', '', $data['svgContent']);
    $cleanedSvg = trim($cleanedSvg);

    $element = new Element();
    $element->setNom($data['nom']);
    $element->setCategorie($data['categorie']);
    $element->setSvgContent($cleanedSvg);
    $element->setActif(true);

    $this->dm->persist($element);
    $this->dm->flush();

    return $this->json(['message' => 'Élément ajouté', '_id' => $element->getId()], 201);
}

    // T16 — Suppression élément admin
    #[Route('/api/admin/elements/{id}', methods: ['DELETE'])]
    public function adminDeleteElement(string $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $element = $this->dm->getRepository(Element::class)->find($id);

        if (!$element) {
            return $this->json(['error' => 'Élément introuvable'], 404);
        }

        $this->dm->remove($element);
        $this->dm->flush();

        return $this->json(['message' => 'Élément supprimé']);
    }
}
