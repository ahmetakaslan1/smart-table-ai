<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HakedisTable;
use App\Models\HakedisRow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    /**
     * GET /api/tables
     * Kullanıcının kendi tablolarını döndürür.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        
        // Admin tüm tabloları görebilir, normal kullanıcı sadece kendi tablolarını
        $query = HakedisTable::select('id', 'title', 'created_at', 'updated_at')->latest();
        
        if (!$user->is_admin) {
            $query->where('user_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    /**
     * POST /api/tables
     * Yeni bir tablo kaydeder (Sadece giriş yapmış kullanıcılar).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'     => 'nullable|string|max:255',
            'raw_input' => 'nullable|string',
            'headers'   => 'required|array',
            'rows'      => 'required|array',
            'rows.*.columns' => 'required|array',
        ], [
            'rows.required' => 'En az bir satır olmadan tabloyu kaydedemezsiniz.',
            'headers.required' => 'Tablo başlıkları eksik.'
        ]);

        $user = auth('sanctum')->user();
        
        $table = HakedisTable::create([
            'title'     => $request->input('title', 'İsimsiz Hesap'),
            'raw_input' => $request->input('raw_input'),
            'user_id'   => $user->id,
        ]);

        $rowsToInsert = [];
        foreach ($request->input('rows') as $index => $row) {
            $rowsToInsert[] = [
                'table_id'   => $table->id,
                'row_index'  => $index,
                'columns'    => json_encode($row['columns']),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        HakedisRow::insert($rowsToInsert);

        return response()->json([
            'success' => true,
            'data'    => $table->load('rows'),
        ], 201);
    }

    /**
     * GET /api/tables/{id}
     * Tablo detaylarını döndürür (IDOR Korumalı).
     */
    public function show(HakedisTable $table): JsonResponse
    {
        $user = auth('sanctum')->user();
        
        // Sahiplik kontrolü
        if ($table->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['success' => false, 'message' => 'Bu tabloyu görüntüleme yetkiniz yok.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $table->load('rows'),
        ]);
    }

    /**
     * PUT /api/tables/{id}
     * Tabloyu günceller (Sahiplik Korumalı).
     */
    public function update(Request $request, HakedisTable $table): JsonResponse
    {
        $user = auth('sanctum')->user();
        
        if ($table->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['success' => false, 'message' => 'Bu tabloyu düzenleme yetkiniz yok.'], 403);
        }

        $request->validate([
            'title'          => 'nullable|string|max:255',
            'rows'           => 'required|array',
            'rows.*.columns' => 'required|array',
        ], [
            'rows.required' => 'En az bir satır olmadan tabloyu kaydedemezsiniz.'
        ]);

        if ($request->has('title')) {
            $table->update(['title' => $request->input('title')]);
        }

        $table->rows()->delete();

        $rowsToInsert = [];
        foreach ($request->input('rows') as $index => $row) {
            $rowsToInsert[] = [
                'table_id'   => $table->id,
                'row_index'  => $index,
                'columns'    => json_encode($row['columns']),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($rowsToInsert)) {
            HakedisRow::insert($rowsToInsert);
        }

        return response()->json([
            'success' => true,
            'data'    => $table->load('rows'),
        ]);
    }

    /**
     * DELETE /api/tables/{id}
     * Tabloyu siler (Sahiplik Korumalı).
     */
    public function destroy(HakedisTable $table): JsonResponse
    {
        $user = auth('sanctum')->user();
        
        if ($table->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['success' => false, 'message' => 'Bu tabloyu silme yetkiniz yok.'], 403);
        }

        $table->delete(); 

        return response()->json([
            'success' => true,
            'message' => 'Tablo silindi.',
        ]);
    }
}
