<?php

namespace App\Http\Middleware;
 
use Closure;
use Illuminate\Http\Request;
 
class PiTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('X-Pi-Token');
 
        if ($token !== config('pi.token')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
 
        return $next($request);
    }
}