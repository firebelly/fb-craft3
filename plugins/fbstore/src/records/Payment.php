<?php
/**
 * Fbstore plugin for Craft CMS 3.x
 *
 * Stripe checkout for Firebelly store.
 *
 * @link      https://firebellydesign.com/
 * @copyright Copyright (c) 2018 Firebelly
 */

namespace firebelly\fbstore\records;

use firebelly\fbstore\Fbstore;

use Craft;
use craft\db\ActiveRecord;

/**
 * @author    Firebelly
 * @package   Fbstore
 * @since     1.0.0
 */
class Payment extends ActiveRecord
{
    // Public Static Methods
    // =========================================================================

    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return '{{%fbstore_payment}}';
    }
}
