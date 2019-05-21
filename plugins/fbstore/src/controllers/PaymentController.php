<?php
/**
 * Fbstore plugin for Craft CMS 3.x
 *
 * Stripe checkout for Firebelly store.
 *
 * @link      https://firebellydesign.com/
 * @copyright Copyright (c) 2018 Firebelly
 */

namespace firebelly\fbstore\controllers;

use firebelly\fbstore\Fbstore;
use firebelly\fbstore\records\Payment;

use Craft;
use craft\web\Controller;
use craft\mail\Message;

/**
 * @author    Firebelly
 * @package   Fbstore
 * @since     1.0.0
 */
class PaymentController extends Controller
{
    // Protected Properties
    // =========================================================================

    /**
     * @var    bool|array Allows anonymous access to this controller's actions.
     *         The actions must be in 'kebab-case'
     * @access protected
     */
    protected $allowAnonymous = ['charge'];

    // Public Methods
    // =========================================================================

    /**
     * @return mixed
     */
    public function actionCharge()
    {
        $this->requirePostRequest();

        // Stripe token->id and token->email
        $token = json_decode(Craft::$app->getRequest()->post('token'));

        // Customer billing/shipping info sent from Stripe Checkout
        $customer = json_decode(Craft::$app->getRequest()->post('customer'));

        // Localstorage cart with line items and shipping info
        $cart = json_decode(Craft::$app->getRequest()->post('cart'));

        // Check if token was sent
        if (empty($token->id)) {
            return json_encode([
                'status'  => 0,
                'message' => 'No payment token sent.'
            ]);
        }

        // Check for INT'L shipping for non-USA order (or vice versa)
        if ($customer->shipping_address_country_code != 'US' && $cart->shipping->type == 'US') {
            return json_encode([
                'status'  => 0,
                'message' => 'Please select INT\'L shipping for a non-USA address.'
            ]);
        } else if ($customer->shipping_address_country_code == 'US' && $cart->shipping->type != 'US') {
            return json_encode([
                'status'  => 0,
                'message' => 'Please select USA shipping for a USA address.'
            ]);
        }

        // Set customer email
        $customer->email = $token->email;

        try {
            // Init Stripe using .env credentials
            \Stripe\Stripe::setApiKey(getenv('STRIPE_SECRET_KEY'));

            // Loop through customers to find by email in case they're returning
            $allCustomers = \Stripe\Customer::all()->data;
            foreach ($allCustomers as $chkCustomer) {
                if ($chkCustomer->email == $customer->email) {
                    $stripeCustomer = $chkCustomer;
                    // Update payment source
                    $stripeCustomer->source = $token->id;
                    $stripeCustomer->save();
                    break;
                }
            }

            // ...or create new Stripe customer to relate to order
            if (empty($stripeCustomer)) {
                $stripeCustomer = \Stripe\Customer::create(array(
                    'email' => $customer->email,
                    'source'  => $token->id
                ));
            }

            // If we ever just want to switch to a simple charge instead of Orders
            // $charge = \Stripe\Charge::create(array(
            //   'customer' => $customer->id,
            //   'amount'   => $cart->total,
            //   'currency' => 'usd'
            // ));

            // Build $items array to associate with order
            $items = array();
            foreach ($cart->items as $cartItem) {
                $items[] = array(
                    'type' => 'sku',
                    'parent' => $cartItem->stripe_product_id,
                    'quantity' => $cartItem->quantity
                );
            }

            // Add hacky shipping as a line item, with quantity set on US orders with 2+ books (set in js)
            $items[] = array(
                'type' => 'sku',
                'parent' => 'sku_ship' . $cart->shipping->type,
                'quantity' => $cart->shipping->quantity
            );

            // Create order in Stripe
            $order = \Stripe\Order::create(array(
                'currency' => 'usd',
                'customer' => $stripeCustomer->id,
                'items' => $items,
                'shipping' => array(
                        'name' => $customer->shipping_name,
                        'address' => array(
                            'line1' => $customer->shipping_address_line1,
                            'city' => $customer->shipping_address_city,
                            'country' => $customer->shipping_address_country_code,
                            'postal_code' => $customer->shipping_address_zip
                        )
                    ),
            ));

            // Submit payment for order using customer payment source
            $order_details = $order->pay(array(
                'customer' => $stripeCustomer->id,
                'source' => $stripeCustomer->sources->data[0]->id
            ));

            // Store payment in db
            $payment = new Payment();
            $payment->log = "Customer:\n" . print_r($customer, 1) . "\n\nCart:\n" . print_r($cart, 1);
            $payment->summary = 'Order for ' . count($cart->items) . ' item(s) by ' . $customer->billing_name . ' ($' . $cart->total . ')';
            $payment->save();

            // Customer order email
            $emailSettings = Craft::$app->systemSettings->getSettings('email');

            // Email folks
            $message = new Message();
            $message->setFrom([$emailSettings['fromEmail'] => $emailSettings['fromName']]);
            $message->setTo($customer->email);
            $message->setSubject('Your Firebelly Order');
            $order_text = Craft::$app->getView()->renderTemplate('store/order_email_text', [
                'customer' => $customer,
                'cart'     => $cart,
                'card'     => $stripeCustomer->sources->data[0],
            ]);
            $html_order_email = Craft::$app->getView()->renderTemplate('store/order_email', [
                'customer' => $customer,
                'cart'     => $cart,
                'card'     => $stripeCustomer->sources->data[0],
            ]);
            // Inline the CSS
            $emogrifier = new \Pelago\Emogrifier($html_order_email);
            $order_html = $emogrifier->emogrify();
            $message->setTextBody($order_text);
            $message->setHtmlBody($order_html);
            Craft::$app->getMailer()->send($message);

            // Shop order email
            $message = new Message();
            $message->setFrom([$emailSettings['fromEmail'] => $emailSettings['fromName']]);
            $notificationEmails = explode(',', Fbstore::getInstance()->settings->notificationEmails);
            $message->setTo($notificationEmails);
            // $message->setTo(['developer@firebellydesign.com' => 'Firebelly Developer']);
            // $message->setReplyTo($customer->email); // giving dire error in gmail as phishing attempt
            // if (!Craft::$app->getConfig()->general->devMode) {
            //     $message->setCc(['dawn@firebellydesign.com' => 'Dawn Hancock']);
            // }
            $message->setSubject('New Firebelly order for ' . $customer->billing_name);
            $order_text = Craft::$app->getView()->renderTemplate('store/order_email_shop_text', [
                'customer' => $customer,
                'cart'     => $cart,
                'card'     => $stripeCustomer->sources->data[0],
            ]);
            $html_order_email = Craft::$app->getView()->renderTemplate('store/order_email_shop', [
                'customer' => $customer,
                'cart'     => $cart,
                'card'     => $stripeCustomer->sources->data[0],
            ]);
            // Inline the CSS
            $emogrifier = new \Pelago\Emogrifier($html_order_email);
            $order_html = $emogrifier->emogrify();
            $message->setTextBody($order_text);
            $message->setHtmlBody($order_html);
            Craft::$app->getMailer()->send($message);

        } catch (\Stripe\Error\Base $e) {
            return json_encode([
                'status'  => 0,
                'message' => $e->getMessage()
            ]);
        } catch (Exception $e) {
            return json_encode([
                'status'  => 0,
                'message' => $e->getMessage()
            ]);
        }

        return json_encode([
            'success' => 1,
            'message' => 'Order processed ok!'
        ]);
    }
}
