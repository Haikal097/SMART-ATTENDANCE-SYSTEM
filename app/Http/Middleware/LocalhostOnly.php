<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class LocalhostOnly
{
    public function handle(Request $request, Closure $next)
    {
        $ip = $request->ip();

        $allowed = in_array($ip, ['127.0.0.1', '::1'])
            || str_starts_with($ip, '100.'); // Tailscale subnet (100.64.0.0/10)

        if (!$allowed) {
            abort(403, 'Login is only accessible from localhost or Tailscale.');
        }

        return $next($request);
    }
}
