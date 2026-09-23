<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use App\Doctrine\DBAL\CockroachDb;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20230204135941 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Make unique constraint offset_period_idx a deferred constraint';
    }

    public function up(Schema $schema): void {
        if (CockroachDb::is($this->connection)) {
            return;
        }

        $this->addSql('DROP INDEX offset_period_idx');
        $deferrable = CockroachDb::is($this->connection) ? '' : ' deferrable initially deferred';
        $this->addSql(
            <<<SQL
                        alter table day 
                            add constraint offset_period_idx 
                                unique (periodId, dayOffset)
                                    $deferrable
                        SQL
        );
    }

    #[\Override]
    public function down(Schema $schema): void {
        if (CockroachDb::is($this->connection)) {
            return;
        }

        $this->addSql(
            <<<'EOF'
                        alter table day 
                            drop constraint offset_period_idx
                        EOF
        );
        $this->addSql('CREATE UNIQUE INDEX offset_period_idx ON day (periodId, dayOffset)');
    }
}
