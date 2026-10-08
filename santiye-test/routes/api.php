<?php

use App\Http\Controllers\Api\GeminiController;
use App\Http\Controllers\Api\TableController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| Şantiye Net Hesap Sistemi — API Routes
|--------------------------------------------------------------------------
*/

// Auth Roteleri (throttle: 5 istek / dakika)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/email/resend', [AuthController::class, 'resendVerification'])->middleware('throttle:5,1');

// E-posta Doğrulama Rotası
Route::get('/email/verify/{id}/{hash}', function ($id, $hash, \Illuminate\Http\Request $request) {
    // Frontend ve Backend farklı alan adlarında olduğu için direkt Frontend URL'e yönlendir
    $frontendUrl = env('FRONTEND_URL', 'https://santiye.ahmetakaslan.com');

    if (! $request->hasValidSignature()) {
        return redirect($frontendUrl . '/?verified=error');
    }

    $user = \App\Models\User::find($id);
    if (! $user) {
        return redirect($frontendUrl . '/?verified=error');
    }

    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect($frontendUrl . '/?verified=error');
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new \Illuminate\Auth\Events\Verified($user));
    }

    return redirect($frontendUrl . '/?verified=success');
})->name('verification.verify');

// AI tablo üretici — Misafirler de kullanabilir ama throttle ile korunuyor
// Sonucu DB'ye yazmaz, sadece JSON döner (store() auth arkasında)
Route::post('/generate-table', [GeminiController::class, 'generateTable'])->middleware('throttle:10,1');

// ============================================================
// KİMLİK DOĞRULAMA GEREKTİREN ROTALAR
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',   [AuthController::class, 'user']);

    // Admin Roteleri
    Route::get('/admin/users',              [AdminController::class, 'users']);
    Route::get('/admin/users/{id}/tables',  [AdminController::class, 'userTables']);

    // Hakediş Tabloları CRUD
    // Misafirler bu endpoint'lere ulaşamaz (401 alırlar) — localStorage'da tutulurlar
    Route::apiResource('tables', TableController::class);
});
