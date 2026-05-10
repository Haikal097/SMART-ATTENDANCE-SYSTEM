<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::Configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Add CSRF exceptions here
        $middleware->validateCsrfTokens(except: [
            'api/upload-test',
            'media',           // Add this for media upload
            'media/*',         // Add this for media delete/bulk operations
            'profile/upload-face',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();