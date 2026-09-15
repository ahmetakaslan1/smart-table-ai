<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Sadece yetkili (is_admin = true) olanların erişebildiği tüm kullanıcıları listele.
     */
    public function users(Request $request)
    {
        // Yetki kontrolü (Sadece emin olmak için ek kontrol, middleware de yazılabilir)
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Yetkisiz erişim.'], 403);
        }

        // Kullanıcıları ve oluşturdukları tablo sayılarını getir
        $users = User::withCount('tables')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Belirli bir kullanıcının tablolarını listele.
     */
    public function userTables(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Yetkisiz erişim.'], 403);
        }

        $user = User::with(['tables' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'tables' => $user->tables
            ]
        ]);
    }
}
