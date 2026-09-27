<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

require_once __DIR__.'/checklists/helpers.php';

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260124154500 extends AbstractMigration {
    #[\Override]
    public function getDescription(): string {
        return 'Delete invalid checklist node <-> checklist item connections (across camps)';
    }

    public function up(Schema $schema): void {
        $this->addSql(<<<'EOF'
            DELETE FROM public.checklistnode_checklistitem
                WHERE (checklistnode_checklistitem.checklistnode_id || '#' || checklistnode_checklistitem.checklistitem_id) IN
                (SELECT (cnci.checklistnode_id || '#' || cnci.checklistitem_id) FROM checklistnode_checklistitem cnci
                    INNER JOIN content_node cn ON cn.id=cnci.checklistnode_id
                    INNER JOIN content_node root ON root.id=COALESCE(cn.rootid, cn.id)
                    INNER JOIN activity a ON a.rootcontentnodeid=root.id
                    INNER JOIN checklist_item ci ON ci.id=cnci.checklistitem_id
                    INNER JOIN checklist c ON ci.checklistid = c.id
                    WHERE c.campid != a.campid);
        EOF);

        $this->addSql(<<<'EOF'
            DELETE FROM public.checklistnode_checklistitem
                WHERE (checklistnode_checklistitem.checklistnode_id || '#' || checklistnode_checklistitem.checklistitem_id) IN
                (SELECT (cnci.checklistnode_id || '#' || cnci.checklistitem_id) FROM checklistnode_checklistitem cnci
                    INNER JOIN content_node cn ON cn.id=cnci.checklistnode_id
                    INNER JOIN content_node root ON root.id=COALESCE(cn.rootid, cn.id)
                    INNER JOIN category cat ON cat.rootcontentnodeid=root.id
                    INNER JOIN checklist_item ci ON ci.id=cnci.checklistitem_id
                    INNER JOIN checklist c ON ci.checklistid = c.id
                    WHERE c.campid != cat.campid);
        EOF);
    }

    #[\Override]
    public function down(Schema $schema): void {
        // not possible
    }
}
