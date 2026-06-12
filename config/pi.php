<?php
// ─── config/pi.php ────────────────────────────────────────────────────────────
// Create this file at config/pi.php
 
return [
    'url'   => env('PI_URL',   'http://192.168.0.41:5000'),
    'token' => env('PI_TOKEN', 'change-this-to-a-secret-token'),
];