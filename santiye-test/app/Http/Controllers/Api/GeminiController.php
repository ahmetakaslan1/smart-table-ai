<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeminiController extends Controller
{
    public function __construct(private readonly GeminiService $geminiService) {}

    /**
     * POST /api/generate-table
     * Ham metni Gemini'ye gönderir ve dinamik tablo JSON'ı döndürür.
     */
    public function generateTable(Request $request): JsonResponse
    {
        $request->validate([
            'raw_text' => 'nullable|string|max:5000',
            'image_base64' => 'nullable|string',
        ]);

        if (empty($request->input('raw_text')) && empty($request->input('image_base64'))) {
            return response()->json([
                'success' => false,
                'message' => 'Lütfen hesabı anlatan bir metin yazın veya bir fotoğraf yükleyin.',
            ], 422);
        }

        try {
            $tableData = $this->geminiService->generateTableFromText(
                $request->input('raw_text') ?? '',
                $request->input('image_base64')
            );

            return response()->json([
                'success' => true,
                'data'    => $tableData,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Beklenmedik bir hata oluştu.',
            ], 500);
        }
    }
}
