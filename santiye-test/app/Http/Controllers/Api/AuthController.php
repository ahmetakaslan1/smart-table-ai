<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\HakedisTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Events\Registered;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Kullanıcı Kaydı (Register)
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:users,name',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'guest_table_ids' => 'nullable|array' // Sessiz aktarım için local table ID'leri
        ], [
            'name.unique' => 'Bu kullanıcı adı zaten alınmış.',
            'email.unique' => 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_admin' => false,
        ]);

        // E-posta doğrulama linkini gönder
        event(new Registered($user));

        // Sessiz Aktarım (Silent Migration): Ziyaretçiyken oluşturduğu tabloları üzerine al
        $this->migrateGuestTables($request->guest_table_ids, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Kayıt başarılı! Lütfen giriş yapmadan önce e-posta adresinize gönderilen linke tıklayarak hesabınızı doğrulayın.',
        ], 201);
    }

    /**
     * Kullanıcı Girişi (Login)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'guest_table_ids' => 'nullable|array' // Giriş yaparken de aktarabilir
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-posta adresi veya şifre hatalı.'],
            ]);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'E-posta adresiniz henüz doğrulanmamış. Lütfen mail kutunuzu kontrol edin.'
            ], 403);
        }

        // Sessiz Aktarım (Eğer ziyaretçiyken yapıp direkt giriş yaptıysa)
        $this->migrateGuestTables($request->guest_table_ids, $user->id);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Giriş başarılı.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'is_admin' => (bool) $user->is_admin
            ]
        ]);
    }

    /**
     * Kullanıcı Çıkışı (Logout)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Başarıyla çıkış yapıldı.'
        ]);
    }

    /**
     * Mevcut Kullanıcı Bilgisi
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    /**
     * Yardımcı Fonksiyon: Ziyaretçi tablolarını hesaba aktar
     */
    private function migrateGuestTables($tableIds, $userId)
    {
        if (!empty($tableIds) && is_array($tableIds)) {
            HakedisTable::whereIn('id', $tableIds)
                ->whereNull('user_id')
                ->update(['user_id' => $userId]);
        }
    }

    /**
     * E-posta Doğrulama Linkini Tekrar Gönder
     */
    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Kullanıcı bulunamadı.'], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['success' => false, 'message' => 'Bu e-posta zaten doğrulanmış.'], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['success' => true, 'message' => 'Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.']);
    }
}
