<?php

use App\Http\Controllers\Api\PiController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.pi')->group(function () {
    Route::post('/attendance/record', [PiController::class, 'record']);
    Route::get('/session/current',    [PiController::class, 'current']);
});