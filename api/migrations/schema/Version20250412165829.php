<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250412165829 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'MaterialItem.MaterialList is nullable';
    }

    public function up(Schema $schema): void {}

    #[\Override]
    public function down(Schema $schema): void {}
}
