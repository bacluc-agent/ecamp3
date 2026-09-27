<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250903125914 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Add sharedSince and sharedBy to camp';
    }

    public function up(Schema $schema): void {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE camp ADD sharedSince TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE camp ADD sharedById VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE camp ADD CONSTRAINT FK_C19442304B2BC976 FOREIGN KEY (sharedById) REFERENCES "user" (id) NOT DEFERRABLE');
        $this->addSql('CREATE INDEX IDX_C19442304B2BC976 ON camp (sharedById)');
    }

    #[\Override]
    public function down(Schema $schema): void {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE camp DROP CONSTRAINT FK_C19442304B2BC976');
        $this->addSql('DROP INDEX IDX_C19442304B2BC976');
        $this->addSql('ALTER TABLE camp DROP sharedSince');
        $this->addSql('ALTER TABLE camp DROP sharedById');
    }
}
