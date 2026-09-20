<?php

namespace App\Doctrine\DBAL\Schema;

use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Schema\ForeignKeyConstraint;

class CustomPostgreSQLPlatform extends PostgreSQLPlatform {
    public function getAdvancedForeignKeyOptionsSQL(ForeignKeyConstraint $foreignKey): string {
        $query = '';

        if ($foreignKey->hasOption('match')) {
            $query .= ' MATCH ' . $foreignKey->getOption('match');
        }

        $query .= parent::getAdvancedForeignKeyOptionsSQL($foreignKey);

        // CockroachDB does not support DEFERRABLE / NOT DEFERRABLE syntax
        // ponytail: skip DEFERRABLE clauses for CockroachDB compatibility
        return $query;
    }

    protected function getConstraintDeferrabilitySQL(ForeignKeyConstraint $foreignKey): string {
        // ponytail: skip DEFERRABLE clauses for CockroachDB compatibility
        return '';
    }
}
