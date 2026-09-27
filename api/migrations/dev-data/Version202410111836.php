<?php

declare(strict_types=1);

namespace DataMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

require_once __DIR__.'/helpers.php';

final class Version202410111836 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Fix J+S course prototype.';
    }

    public function up(Schema $schema): void {
        // START PHP CODE
        // END PHP CODE
    }

    #[\Override]
    public function down(Schema $schema): void {}
}
