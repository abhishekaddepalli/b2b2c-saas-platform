<?php

namespace App\Services\Payment;

use App\Services\Payment\Gateways\CashfreeGateway;
use App\Services\Payment\Gateways\PaymentGatewayInterface;
use App\Services\Payment\Gateways\PhonePeGateway;
use App\Services\Payment\Gateways\RazorpayGateway;
use App\Services\Payment\Gateways\StripeGateway;

class PaymentGatewayFactory
{
    public static function make(string $gateway): PaymentGatewayInterface
    {
        return match (strtolower($gateway)) {
            'razorpay' => new RazorpayGateway(),
            'phonepe' => new PhonePeGateway(),
            'cashfree' => new CashfreeGateway(),
            'stripe' => new StripeGateway(),
            default => new RazorpayGateway(),
        };
    }
}
