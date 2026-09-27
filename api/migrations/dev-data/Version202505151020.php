<?php

declare(strict_types=1);

namespace DataMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

require_once __DIR__.'/helpers.php';

final class Version202505151020 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Move dev data camps one year forward';
    }

    public function up(Schema $schema): void {
        // START PHP CODE
        // END PHP CODE
    }

    #[\Override]
    public function down(Schema $schema): void {}
}
