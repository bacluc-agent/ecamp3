<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250324224924 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'ContentNode.RootId not nullable';
    }

    public function up(Schema $schema): void {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE content_node ALTER rootId SET NOT NULL');
    }

    #[\Override]
    public function down(Schema $schema): void {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE content_node ALTER rootid DROP NOT NULL');
    }
}
