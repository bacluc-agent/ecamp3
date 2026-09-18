<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260918000000 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Add family and family_valid columns to refresh_tokens (gesdinet/jwt-refresh-token-bundle 3.0)';
    }

    public function up(Schema $schema): void {
        $this->addSql('ALTER TABLE refresh_tokens ADD family VARCHAR(32) DEFAULT NULL');
        $this->addSql('ALTER TABLE refresh_tokens ADD family_valid TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    #[\Override]
    public function down(Schema $schema): void {
        $this->addSql('ALTER TABLE refresh_tokens DROP family_valid');
        $this->addSql('ALTER TABLE refresh_tokens DROP family');
    }
}
