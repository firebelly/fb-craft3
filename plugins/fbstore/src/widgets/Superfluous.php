<?php
/**
 * Fbstore plugin for Craft CMS 3.x
 *
 * Stripe checkout for Firebelly store.
 *
 * @link      https://firebellydesign.com/
 * @copyright Copyright (c) 2018 Firebelly
 */

namespace firebelly\fbstore\widgets;

use firebelly\fbstore\Fbstore;
use firebelly\fbstore\assetbundles\superfluouswidget\SuperfluousWidgetAsset;

use Craft;
use craft\base\Widget;

/**
 * Fbstore Widget
 *
 * @author    Firebelly
 * @package   Fbstore
 * @since     1.0.0
 */
class Superfluous extends Widget
{

    // Public Properties
    // =========================================================================

    /**
     * @var string
     */
    public $message = 'Hello, world.';

    // Static Methods
    // =========================================================================

    /**
     * @inheritdoc
     */
    public static function displayName(): string
    {
        return Craft::t('fbstore', 'Superfluous');
    }

    /**
     * @inheritdoc
     */
    public static function iconPath()
    {
        return Craft::getAlias("@firebelly/fbstore/assetbundles/superfluouswidget/dist/img/Superfluous-icon.svg");
    }

    /**
     * @inheritdoc
     */
    public static function maxColspan()
    {
        return null;
    }

    // Public Methods
    // =========================================================================

    /**
     * @inheritdoc
     */
    public function rules()
    {
        $rules = parent::rules();
        $rules = array_merge(
            $rules,
            [
                ['message', 'string'],
                ['message', 'default', 'value' => 'Hello, world.'],
            ]
        );
        return $rules;
    }

    /**
     * @inheritdoc
     */
    public function getSettingsHtml()
    {
        return Craft::$app->getView()->renderTemplate(
            'fbstore/_components/widgets/Superfluous_settings',
            [
                'widget' => $this
            ]
        );
    }

    /**
     * @inheritdoc
     */
    public function getBodyHtml()
    {
        Craft::$app->getView()->registerAssetBundle(SuperfluousWidgetAsset::class);

        return Craft::$app->getView()->renderTemplate(
            'fbstore/_components/widgets/Superfluous_body',
            [
                'message' => $this->message
            ]
        );
    }
}
