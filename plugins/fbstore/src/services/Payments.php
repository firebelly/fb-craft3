<?php
/**
 * Fbstore plugin for Craft CMS 3.x
 *
 * Stripe checkout for Firebelly store.
 *
 * @link      https://firebellydesign.com/
 * @copyright Copyright (c) 2018 Firebelly
 */

namespace firebelly\fbstore\services;

use firebelly\fbstore\Fbstore;
use firebelly\fbstore\records\Payment;

use Craft;
use craft\base\Component;

/**
 * @author    Firebelly
 * @package   Fbstore
 * @since     1.0.0
 */
class Payments extends Component
{
    // Public Methods
    // =========================================================================

    /**
     * Returns payment records for /admin/fbstore template
     * @return [array] active records
     */
    public function getPayments()
    {
        $payments = Payment::find()->orderBy('dateCreated DESC')->all();
        return $payments;
    }

}
