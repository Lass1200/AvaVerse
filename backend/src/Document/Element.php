<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as MongoDB;

#[MongoDB\Document(collection: 'elements')]
class Element
{
    #[MongoDB\Id]
    private string $id;

    #[MongoDB\Field(type: 'string')]
    private string $categorie;

    #[MongoDB\Field(type: 'string')]
    private string $nom;

    #[MongoDB\Field(type: 'string')]
    private string $svgContent;

    #[MongoDB\Field(type: 'bool')]
    private bool $actif = true;

    #[MongoDB\Field(type: 'date')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): string { return $this->id; }
    public function getCategorie(): string { return $this->categorie; }
    public function setCategorie(string $categorie): void { $this->categorie = $categorie; }
    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): void { $this->nom = $nom; }
    public function getSvgContent(): string { return $this->svgContent; }
    public function setSvgContent(string $svgContent): void { $this->svgContent = $svgContent; }
    public function isActif(): bool { return $this->actif; }
    public function setActif(bool $actif): void { $this->actif = $actif; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
