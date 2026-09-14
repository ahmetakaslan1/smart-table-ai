<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->model  = config('services.gemini.model', 'gemini-3.8-flash');
    }

    /**
     * Ham metni alır, Gemini'ye gönderir ve dinamik tablo JSON'ı döndürür.
     *
     * @param  string $rawText Kullanıcının girdiği ham metin
     * @return array  ['headers' => [...], 'rows' => [...]]
     */
    public function generateTableFromText(string $rawText, ?string $imageBase64 = null): array
    {
        $hasImage = !empty($imageBase64);
        $prompt = $this->buildPrompt($rawText, $hasImage);

        $parts = [
            ['text' => $prompt]
        ];

        if ($imageBase64) {
            $mimeType = 'image/jpeg';
            $base64Data = $imageBase64;
            
            if (str_contains($imageBase64, ',')) {
                $pieces = explode(',', $imageBase64);
                $meta = explode(';', $pieces[0])[0];
                $mimeType = str_replace('data:', '', $meta);
                $base64Data = $pieces[1];
            }

            $parts[] = [
                'inlineData' => [
                    'mimeType' => $mimeType,
                    'data'     => $base64Data
                ]
            ];
        }

        $response = Http::timeout(60)->post(
            "{$this->baseUrl}/{$this->model}:generateContent?key={$this->apiKey}",
            [
                'contents' => [
                    [
                        'parts' => $parts
                    ]
                ],
                'generationConfig' => [
                    'temperature'     => 0.1,
                    'responseMimeType' => 'application/json',
                ],
            ]
        );

        if ($response->failed()) {
            Log::error('Gemini API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException('Gemini API isteği başarısız oldu: ' . $response->status());
        }

        $data = $response->json();

        // Gemini'nin döndürdüğü metni parse et
        $jsonText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        $parsed = json_decode($jsonText, true);

        if (json_last_error() !== JSON_ERROR_NONE || !isset($parsed['headers'], $parsed['rows'])) {
            Log::error('Gemini JSON parse error', ['response' => $jsonText]);
            throw new \RuntimeException('Gemini geçerli bir JSON tablo döndürmedi.');
        }

        return $parsed;
    }

    /**
     * Gemini'ye gönderilecek sistematik prompt'u oluşturur.
     */
    private function buildPrompt(string $rawText, bool $hasImage = false): string
    {
        $imageRule = $hasImage
            ? "7. ÇOK ÖNEMLİ (GÖRSEL ÖNCELİĞİ): Sana bir FOTOĞRAF gönderildi! Fotoğraftaki ticari/hesap bilgilerini oku -> satırları ayır -> ürün, miktar, birim fiyat, toplam vb. alanları çıkar -> tabloya dönüştür. Bu görsel bir alışveriş/satış/şantiye hesabı veya yazılım tablosu olabilir. Görselde bulunan TÜM yazıları dikkatlice oku. Asla 'bilgi yok' veya 'anlayamadım' deme."
            : "7. ÇOK ÖNEMLİ: Eğer ortada hiç hesap verisi yoksa (sadece 'Merhaba' yazılmışsa), 'Merhaba! Ben Asistanım...' şeklinde tek sütunlu asistan mesajı dön.";

        return <<<PROMPT
Sen profesyonel bir veri çıkarma, inşaat maliyet ve şantiye muhasebe asistanısın. 
Görevin sana verilen karmaşık ve düzensiz verileri (görsel, el yazısı, fiş, fatura, tablo ekran görüntüsü, yevmiyeler vb.) düzenli bir JSON tablosuna dönüştürmektir.

KURALLAR:
1. "İş Kalemi", "Miktar", "Birim", "Birim Fiyat (₺)", "Toplam (₺)" başlıklarını varsayılan olarak kullan. Eğer fotoğrafta veya metinde "Öncelik", "Durum", "Kişi", "Tarih", "Kdv", "İskonto" gibi farklı veya özel sütunlar varsa, O BAŞLIKLARI DA KESİNLİKLE Ekle.
2. Özellikle şunları çıkar: Ürün isimleri, Miktarlar, Adetler, Ölçüler, Birim Fiyatlar, Toplam Fiyatlar, Kişi/İşçi isimleri, Açıklamalar.
3. El yazısı, düzensiz hizalanmış metin veya herhangi bir tablo yapısı olsa bile satırları mümkün olduğunca doğru şekilde ayır.
4. Sayısal değerleri SADECE rakam olarak döndür (binlik ayraç veya ₺ sembolü olmadan). Örn: 10000 (10.000 değil).
5. Bilgi görselde veya metinde açıkça yoksa tahmin etme, o hücreyi null olarak bırak.
6. SADECE JSON döndür, başka hiçbir şey (markdown vs) yazma.
{$imageRule}

DÖNDÜRÜLECEK TABLO FORMATI (Örnektir, sütunları veriye göre uyarlayabilirsin):
{
"headers": ["İş Kalemi", "Miktar", "Birim", "Birim Fiyat (₺)", "Toplam (₺)"],
"rows": [
    {"İş Kalemi": "Fayans", "Miktar": 50, "Birim": "m²", "Birim Fiyat (₺)": 200, "Toplam (₺)": 10000}
]
}

İŞTE KULLANICININ METNİ:
---
{$rawText}
---
PROMPT;
    }
}
