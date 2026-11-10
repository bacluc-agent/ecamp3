<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

require_once __DIR__.'/../SqlStatementHelper.php';

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20240928090159 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Insert PBS-Checklist';
    }

    public function up(Schema $schema): void {
        $statements = \Migrations\Sql\getStatementsForMigrationFile(__DIR__.'/checklists/pbs-checklist.sql');
        foreach ($statements as $statement) {
            if (trim($statement)) {
                $this->addSql($statement);
            }
        }
    }

    #[\Override]
    public function down(Schema $schema): void {}
}
