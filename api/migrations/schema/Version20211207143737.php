<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20211207143737 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return '';
    }

    #[\Override]
    public function isTransactional(): bool {
        return false;
    }

    public function up(Schema $schema): void {
        $profileId = 'profileId';
        $this->addSql('
                            CREATE TABLE "profile"
                            (
                                id         VARCHAR(16) NOT NULL,
                                email      VARCHAR(64) NOT NULL,
                                username   VARCHAR(32) NOT NULL,
                                firstname  TEXT        DEFAULT NULL,
                                surname    TEXT        DEFAULT NULL,
                                nickname   TEXT        DEFAULT NULL,
                                language   VARCHAR(20) DEFAULT NULL,
                                roles      JSON        NOT NULL,
                                createTime TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                                updateTime TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                                PRIMARY KEY (id)
                            )
                            ');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8157AA0FE7927C74 ON "profile" (email)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8157AA0FF85E0677 ON "profile" (username)');
        $this->addSql('CREATE INDEX IDX_8157AA0F9D468A55 ON "profile" (createTime)');
        $this->addSql('CREATE INDEX IDX_8157AA0F55AA53E2 ON "profile" (updateTime)');
        $this->addSql('
                            INSERT INTO "profile" (id, email, username, firstname, surname, nickname, language, roles, createTime, updateTime)
                            SELECT id, email, username, firstname, surname, nickname, language, roles, createTime, updateTime 
                            FROM "user" 
                            WHERE id NOT IN (SELECT id FROM "profile")
                            ');
        $this->addSql('DROP INDEX uniq_8d93d649f85e0677');
        $this->addSql('DROP INDEX uniq_8d93d649e7927c74');
        $this->addSql(sprintf('ALTER TABLE "user" ADD %s VARCHAR(16)', $profileId));
        $this->addSql(sprintf('ALTER TABLE "user" ADD CONSTRAINT FK_8D93D6499B26949C FOREIGN KEY (%s) REFERENCES "profile" (id) ON DELETE RESTRICT', $profileId));
        $this->addSql(sprintf('CREATE UNIQUE INDEX UNIQ_8D93D6499B26949C ON "user" (%s)', $profileId));
        $this->addSql(sprintf('UPDATE "user" u SET %s = u.id', $profileId));
        $this->addSql(sprintf('ALTER TABLE "user" ALTER COLUMN %s SET NOT NULL', $profileId));
        $this->addSql('ALTER TABLE "user" DROP email');
        $this->addSql('ALTER TABLE "user" DROP username');
        $this->addSql('ALTER TABLE "user" DROP firstname');
        $this->addSql('ALTER TABLE "user" DROP surname');
        $this->addSql('ALTER TABLE "user" DROP nickname');
        $this->addSql('ALTER TABLE "user" DROP language');
        $this->addSql('ALTER TABLE "user" DROP roles');
    }

    #[\Override]
    public function down(Schema $schema): void {
        $profileId = 'profileId';
        $this->addSql('ALTER TABLE "user" ADD email VARCHAR(64)');
        $this->addSql('ALTER TABLE "user" ADD username VARCHAR(32)');
        $this->addSql('ALTER TABLE "user" ADD firstname TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD surname TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD nickname TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD language VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD roles JSON');
        $this->addSql('CREATE UNIQUE INDEX uniq_8d93d649f85e0677 ON "user" (username)');
        $this->addSql('CREATE UNIQUE INDEX uniq_8d93d649e7927c74 ON "user" (email)');

        $this->addSql(sprintf('
                            UPDATE "user" u
                            SET
                                email=(SELECT email FROM "profile" where id = u.%s),
                                username=(SELECT username FROM "profile" where id = u.%s),
                                firstname=(SELECT firstname FROM "profile" where id = u.%s),
                                surname=(SELECT surname FROM "profile" where id = u.%s),
                                nickname=(SELECT nickname FROM "profile" where id = u.%s),
                                language=(SELECT language FROM "profile" where id = u.%s),
                                roles=(SELECT roles FROM "profile" where id = u.%s)
        ', $profileId, $profileId, $profileId, $profileId, $profileId, $profileId, $profileId));

        $this->addSql('ALTER TABLE "user" ALTER COLUMN email SET NOT NULL');
        $this->addSql('ALTER TABLE "user" ALTER COLUMN username SET NOT NULL');
        $this->addSql('ALTER TABLE "user" ALTER COLUMN roles SET NOT NULL');

        $this->addSql('ALTER TABLE "user" DROP CONSTRAINT FK_8D93D6499B26949C');
        $this->addSql('DROP INDEX UNIQ_8D93D6499B26949C');
        $this->addSql('DROP TABLE "profile"');
        $this->addSql(sprintf('ALTER TABLE "user" DROP %s', $profileId));
    }
}
