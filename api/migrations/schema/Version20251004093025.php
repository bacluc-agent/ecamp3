<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251004093025 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return '';
    }

    public function up(Schema $schema): void {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE camp ADD isPublic BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('UPDATE camp SET isPublic = (isShared OR isPrototype)');
        $this->addSql('ALTER TABLE camp ADD CONSTRAINT enforce_public_flag CHECK (isPublic = (isShared OR isPrototype))');
        $this->addSql('CREATE INDEX IDX_C1944230FADC24C7 ON camp (isPublic)');
        $this->addSql(
            <<<'EOF'
                    CREATE OR REPLACE VIEW public.view_user_camps
                    AS
                    SELECT CONCAT(u.id, c.id) id, u.id userid, c.id campid
                    from camp c, "user" u
                    where c.ispublic = TRUE
                    union all
                    select	cc.id, cc.userid, cc.campid
                    from	camp_collaboration cc
                    where 	cc.status = 'established'
                EOF
        );
    }

    #[\Override]
    public function down(Schema $schema): void {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(
            <<<'EOF'
                    CREATE OR REPLACE VIEW public.view_user_camps
                    AS
                    SELECT CONCAT(u.id, c.id) id, u.id userid, c.id campid
                    from camp c, "user" u
                    where c.isprototype = TRUE or c.isshared = TRUE
                    union all
                    select	cc.id, cc.userid, cc.campid
                    from	camp_collaboration cc
                    where 	cc.status = 'established'
                EOF
        );
        $this->addSql('DROP INDEX IDX_C1944230FADC24C7');
        $this->addSql('ALTER TABLE camp DROP CONSTRAINT enforce_public_flag');
        $this->addSql('ALTER TABLE camp DROP isPublic');
    }
}
