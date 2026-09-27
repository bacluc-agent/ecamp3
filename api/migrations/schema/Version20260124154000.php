<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

require_once __DIR__.'/checklists/helpers.php';

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260124154000 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Disables ecamp-managed pbs checklist prototypes';
    }

    public function up(Schema $schema): void {
        $this->addSql("UPDATE public.checklist c SET isprototype = FALSE WHERE c.id IN ('000100000000', '000200000000', '000300000000', '000400000000');");
    }

    #[\Override]
    public function down(Schema $schema): void {
        $this->addSql("UPDATE public.checklist c SET isprototype = TRUE WHERE c.id IN ('000100000000', '000200000000', '000300000000', '000400000000');");
    }
}
