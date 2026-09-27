<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250625090555 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Add comment entity';
    }

    public function up(Schema $schema): void {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE comment (id VARCHAR(16) NOT NULL, createTime TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updateTime TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, textHtml TEXT NOT NULL, orphanDescription TEXT DEFAULT NULL, campId VARCHAR(16) NOT NULL, activityId VARCHAR(16) DEFAULT NULL, authorId VARCHAR(16) NOT NULL, PRIMARY KEY(id))
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_9474526C6D299429 ON comment (campId)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_9474526C1335E2FC ON comment (activityId)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_9474526CA196F9FD ON comment (authorId)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_9474526C9D468A55 ON comment (createTime)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_9474526C55AA53E2 ON comment (updateTime)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE comment ADD CONSTRAINT FK_9474526C6D299429 FOREIGN KEY (campId) REFERENCES camp (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE comment ADD CONSTRAINT FK_9474526C1335E2FC FOREIGN KEY (activityId) REFERENCES activity (id) NOT DEFERRABLE INITIALLY IMMEDIATE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE comment ADD CONSTRAINT FK_9474526CA196F9FD FOREIGN KEY (authorId) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE
        SQL);
    }

    #[\Override]
    public function down(Schema $schema): void {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE comment DROP CONSTRAINT FK_9474526C6D299429
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE comment DROP CONSTRAINT FK_9474526C1335E2FC
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE comment DROP CONSTRAINT FK_9474526CA196F9FD
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE comment
        SQL);
    }
}
