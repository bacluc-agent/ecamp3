<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260411073822 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Add additional index';
    }

    public function up(Schema $schema): void {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE INDEX IDX_481D0580BF396750 ON content_node (id) WHERE ((strategy)::text = \'checklistnode\'::text)');
        $this->addSql('CREATE INDEX unmanaged_idx_checklistnode_checklistitem_node_item ON checklistnode_checklistitem (checklistnode_id, checklistitem_id)');
    }

    #[\Override]
    public function down(Schema $schema): void {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX IDX_481D0580BF396750');
        $this->addSql('DROP INDEX unmanaged_idx_checklistnode_checklistitem_node_item');
    }
}
