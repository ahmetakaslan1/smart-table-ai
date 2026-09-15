<?php

use App\Http\Controllers\Api\GeminiController;
use App\Http\Controllers\Api\TableController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Şantiye Net Hesap Sistemi — API Routes
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

// Auth Roteleri
Route::get('/fix', function () {
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);

    // DB'ye girmeden Admin yap (Güvenlik için .env'den okur, Github'a gitmez)
    $adminEmail = env('ADMIN_EMAIL');
    if ($adminEmail) {
        $user = \App\Models\User::where('email', $adminEmail)->first();
        if ($user) {
            $user->is_admin = true;
            $user->save();
        }
    }

    return 'Sistem onarıldı, önbellek temizlendi. (Admin atanacak mail varsa atandı)';
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/email/resend', [AuthController::class, 'resendVerification']);

// E-posta Doğrulama Rotası (Login zorunluluğu olmadan çalışacak şekilde uyarlandı)
Route::get('/email/verify/{id}/{hash}', function ($id, $hash, \Illuminate\Http\Request $request) {
    // Sitenin ana dizinini bulur (Frontend'in olduğu yer)
    $frontendUrl = $request->getSchemeAndHttpHost();

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


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Admin Roteleri
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/users/{id}/tables', [AdminController::class, 'userTables']);
});

// AI tablo üretici
Route::post('/generate-table', [GeminiController::class, 'generateTable']);

// Hakediş tabloları CRUD
Route::apiResource('tables', TableController::class);
