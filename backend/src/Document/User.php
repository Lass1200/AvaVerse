<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as MongoDB;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;

#[MongoDB\Document(collection: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[MongoDB\Id]
    private string $id;

    #[MongoDB\Field(type: 'string')]
    private string $email;

    #[MongoDB\Field(type: 'string')]
    private string $password;

    #[MongoDB\Field(type: 'string')]
    private string $role = 'user';

    #[MongoDB\Field(type: 'date')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): string { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): void { $this->email = $email; }
    
    // Requis par PasswordAuthenticatedUserInterface
    public function getPassword(): string { return $this->password; }
    public function setPassword(string $password): void { $this->password = $password; }
    
    public function getRole(): string { return $this->role; }
    
    // Requis par UserInterface
    public function getRoles(): array
    {
        return ['ROLE_' . strtoupper($this->role)];
    }
    
    public function setRole(string $role): void { $this->role = $role; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }

    // --- Méthodes obligatoires pour UserInterface ---

    /**
     * Retourne l'identifiant unique (l'email ici)
     */
    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    /**
     * Nettoie les données sensibles (mot de passe en clair, etc.)
     * si tu en as stockées temporairement.
     */
    public function eraseCredentials(): void
    {
        // Si tu as des données temporaires en clair dans l'objet, efface-les ici.
    }
}