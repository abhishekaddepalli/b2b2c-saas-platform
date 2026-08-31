<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_key',
        'event_trigger',
        'channel',
        'name',
        'subject',
        'template_body',
        'body_template',
        'supported_variables',
        'is_enabled',
    ];

    protected $casts = [
        'supported_variables' => 'array',
        'is_enabled' => 'boolean',
    ];

    /**
     * Render template body replacing {{variable_name}} with context variables.
     */
    public function render(array $data): array
    {
        $subject = $this->subject ?? '';
        $body = $this->template_body;

        foreach ($data as $key => $val) {
            $placeholder = '{{' . $key . '}}';
            $subject = str_replace($placeholder, (string) $val, $subject);
            $body = str_replace($placeholder, (string) $val, $body);
        }

        return [
            'subject' => $subject,
            'body' => $body,
        ];
    }
}
