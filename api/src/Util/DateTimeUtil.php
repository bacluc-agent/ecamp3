<?php

declare(strict_types=1);

namespace App\Util;

class DateTimeUtil {
    public static function differenceInMinutes(\DateTimeInterface $from, \DateTimeInterface $to): int {
        return intval(floor(($to->getTimestamp() - $from->getTimestamp()) / 60));
    }
}
