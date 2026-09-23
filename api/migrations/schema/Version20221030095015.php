<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use App\Doctrine\DBAL\CockroachDb;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20221030095015 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Add unique constraint on contentnode (parentid, slot, position)';
    }

    public function up(Schema $schema): void {
        $deferrable = CockroachDb::is($this->connection) ? '' : ' deferrable initially deferred';
        $this->addSql(
            <<<SQL
                        alter table content_node 
                            add constraint contentnode_parentid_slot_position_unique 
                                unique (parentid, slot, position)
                                    $deferrable
                        SQL
        );
    }

    #[\Override]
    public function down(Schema $schema): void {
        $this->addSql(
            <<<'EOF'
                        alter table content_node 
                            drop constraint contentnode_parentid_slot_position_unique
                        EOF
        );
    }
}
