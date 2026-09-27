<?php

namespace App\State\Util;

class PropertyChangeListener {
    private function __construct(
        private readonly \Closure $extractProperty,
        private readonly \Closure $beforeAction,
        private readonly \Closure $afterAction
    ) {}

    /**
     * @throws \ReflectionException
     */
    public static function of(
        \Closure $extractProperty,
        ?\Closure $beforeAction = null,
        ?\Closure $afterAction = null
    ): PropertyChangeListener {
        if (null == $beforeAction) {
            $beforeAction = function ($data) {};
        }
        if (null == $afterAction) {
            $afterAction = function ($data) {};
        }
        if (self::hasOneParameter($extractProperty)) {
            throw new \InvalidArgumentException('extractProperty must have exactly one parameter');
        }
        if (self::hasAtMostTwoParameter($beforeAction)) {
            throw new \InvalidArgumentException('afterAction must have between 1 and 2 parameters');
        }
        if (self::hasAtMostTwoParameter($afterAction)) {
            throw new \InvalidArgumentException('afterAction must have between 1 and 2 parameters');
        }

        return new PropertyChangeListener($extractProperty, $beforeAction, $afterAction);
    }

    public function getExtractProperty(): \Closure {
        return $this->extractProperty;
    }

    public function getBeforeAction(): \Closure {
        return $this->beforeAction;
    }

    public function getAfterAction(): \Closure {
        return $this->afterAction;
    }

    /**
     * @throws \ReflectionException
     */
    private static function hasOneParameter(?\Closure $beforeAction): bool {
        $beforeActionReflectionFunction = new \ReflectionFunction($beforeAction);

        return 1 != $beforeActionReflectionFunction->getNumberOfParameters();
    }

    /**
     * @throws \ReflectionException
     */
    private static function hasAtMostTwoParameter(?\Closure $beforeAction): bool {
        $beforeActionReflectionFunction = new \ReflectionFunction($beforeAction);

        $numberOfParameters = $beforeActionReflectionFunction->getNumberOfParameters();

        return $numberOfParameters < 1 || $numberOfParameters > 2;
    }
}
