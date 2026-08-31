<?php
namespace App\Exceptions;
class TenantAuthorizationException extends \RuntimeException
{
    public function __construct(string $message = 'You do not have access to this resource.')
    {
        parent::__construct($message);
    }
}
