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
     * Tüm kayıtlı tabloların listesini döndürür (satırlar olmadan, sadece başlıklar).
     */
    public function index(): JsonResponse
    {
        $tables = HakedisTable::select('id', 'title', 'created_at', 'updated_at')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $tables,
        ]);
    }

    /**
     * POST /api/tables
     * Yeni bir tabloyu başlığı, ham metni ve satırlarıyla birlikte kaydeder.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'     => 'nullable|string|max:255',
            'raw_input' => 'nullable|string',
            'headers'   => 'required|array',
            'rows'      => 'required|array',
            'rows.*.columns' => 'required|array',
        ]);

        $table = HakedisTable::create([
            'title'     => $request->input('title', 'İsimsiz Hesap'),
            'raw_input' => $request->input('raw_input'),
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
     * Belirli bir tabloyu satırlarıyla birlikte döndürür.
     */
    public function show(HakedisTable $table): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $table->load('rows'),
        ]);
    }

    /**
     * PUT /api/tables/{id}
     * Kullanıcı manuel değişiklik yaptığında tabloyu ve satırlarını günceller.
     */
    public function update(Request $request, HakedisTable $table): JsonResponse
    {
        $request->validate([
            'title'          => 'nullable|string|max:255',
            'rows'           => 'required|array',
            'rows.*.columns' => 'required|array',
        ]);

        // Başlığı güncelle
        if ($request->has('title')) {
            $table->update(['title' => $request->input('title')]);
        }

        // Mevcut satırları sil, yeniden yaz (en basit ve güvenilir yaklaşım)
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
     * Tabloyu ve tüm satırlarını siler.
     */
    public function destroy(HakedisTable $table): JsonResponse
    {
        $table->delete(); // Cascade ile rows da silinir

        return response()->json([
            'success' => true,
            'message' => 'Tablo silindi.',
        ]);
    }
}
