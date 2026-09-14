<?php

use App\Http\Controllers\Api\GeminiController;
use App\Http\Controllers\Api\TableController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Şantiye Net Hesap Sistemi — API Routes
|--------------------------------------------------------------------------
*/

// AI tablo üretici
Route::post('/generate-table', [GeminiController::class, 'generateTable']);

// Hakediş tabloları CRUD
Route::apiResource('tables', TableController::class);
