<?php
/**
 * Fbstore plugin for Craft CMS 3.x
 *
 * Stripe checkout for Firebelly store.
 *
 * @link      https://firebellydesign.com/
 * @copyright Copyright (c) 2018 Firebelly
 */

namespace firebelly\fbstore\assetbundles\superfluouswidget;

use Craft;
use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

/**
 * @author    Firebelly
 * @package   Fbstore
 * @since     1.0.0
 */
class SuperfluousWidgetAsset extends AssetBundle
{
    // Public Methods
    // =========================================================================

    /**
     * @inheritdoc
     */
    public function init()
    {
        $this->sourcePath = "@firebelly/fbstore/assetbundles/superfluouswidget/dist";

        $this->depends = [
            CpAsset::class,
        ];

        $this->js = [
            'js/Superfluous.js',
        ];

        $this->css = [
            'css/Superfluous.css',
        ];

        parent::init();
    }
}
