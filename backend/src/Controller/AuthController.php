<?php

namespace App\Controller;

use App\Document\User;
use Doctrine\ODM\MongoDB\DocumentManager;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\User\InMemoryUser;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private DocumentManager $dm,
        private JWTTokenManagerInterface $jwtManager
    ) {}

    // T1 — Inscription
    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['error' => 'Email et password requis'], 400);
        }

        // Vérifier si l'email existe déjà
        $existing = $this->dm->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existing) {
            return $this->json(['error' => 'Email déjà utilisé'], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        // Hashage natif et robuste via PHP/Symfony
        $user->setPassword(password_hash($data['password'], PASSWORD_BCRYPT));
        $user->setRole('user'); // Reste "user" en BDD MongoDB

        $this->dm->persist($user);
        $this->dm->flush();

        // Générer le token JWT avec les rôles au format Symfony (ROLE_USER)
        $token = $this->jwtManager->createFromPayload(
            new InMemoryUser($user->getEmail(), '', $user->getRoles()),
            ['userId' => $user->getId(), 'role' => $user->getRole()]
        );

        return $this->json([
            'message' => 'Compte créé avec succès',
            'token'   => $token,
            'role'    => $user->getRole()
        ], 201);
    }

    // T2 — Connexion
    #[Route('/login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['error' => 'Email et password requis'], 400);
        }

        $user = $this->dm->getRepository(User::class)->findOneBy(['email' => $data['email']]);

        if (!$user || !password_verify($data['password'], $user->getPassword())) {
            return $this->json(['error' => 'Identifiants incorrects'], 401);
        }

        // Générer le token JWT avec les rôles au format Symfony (ROLE_...)
        $token = $this->jwtManager->createFromPayload(
            new InMemoryUser($user->getEmail(), '', $user->getRoles()),
            ['userId' => $user->getId(), 'role' => $user->getRole()]
        );

        return $this->json([
            'token' => $token,
            'role'  => $user->getRole()
        ]);
    }
}