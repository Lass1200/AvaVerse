<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as MongoDB;

#[MongoDB\Document(collection: 'avatars')]
class Avatar
{
    #[MongoDB\Id]
    private string $id;

    #[MongoDB\Field(type: 'string')]
    private string $userId;

    #[MongoDB\Field(type: 'string')]
    private string $nom;

    #[MongoDB\Field(type: 'string')]
    private ?string $fichier = null;

    #[MongoDB\Field(type: 'hash')]
    private array $selections = [];

    #[MongoDB\Field(type: 'string')]
    private string $status = 'pending';

    #[MongoDB\Field(type: 'string')]
    private ?string $rejectionReason = null;

    #[MongoDB\Field(type: 'date')]
    private \DateTime $createdAt;

    #[MongoDB\Field(type: 'date')]
    private ?\DateTime $validatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->userId; }
    public function setUserId(string $userId): void { $this->userId = $userId; }
    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): void { $this->nom = $nom; }
    public function getFichier(): ?string { return $this->fichier; }
    public function setFichier(?string $fichier): void { $this->fichier = $fichier; }
    public function getSelections(): array { return $this->selections; }
    public function setSelections(array $selections): void { $this->selections = $selections; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): void { $this->status = $status; }
    public function getRejectionReason(): ?string { return $this->rejectionReason; }
    public function setRejectionReason(?string $rejectionReason): void { $this->rejectionReason = $rejectionReason; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function getValidatedAt(): ?\DateTime { return $this->validatedAt; }
    public function setValidatedAt(?\DateTime $validatedAt): void { $this->validatedAt = $validatedAt; }
}
