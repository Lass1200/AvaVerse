<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as MongoDB;

#[MongoDB\Document(collection: 'users')]
class User
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
    public function getPassword(): string { return $this->password; }
    public function setPassword(string $password): void { $this->password = $password; }
    public function getRoles(): array
{
    // On récupère le rôle de la bdd (ex: "admin" ou "user")
    $role = $this->role; 
    
    // On le transforme en majuscules avec le préfixe "ROLE_"
    return ['ROLE_' . strtoupper($role)];
}
    public function setRole(string $role): void { $this->role = $role; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
