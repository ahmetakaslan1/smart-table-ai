<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hakedis_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('hakedis_tables')->onDelete('cascade');
            $table->unsignedInteger('row_index')->default(0); // Satır sırası
            // Dinamik sütunlar: {"is_kalemi": "Fayans", "miktar": 50, "birim": "m2", "birim_fiyat": 200, "toplam": 10000}
            $table->json('columns');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hakedis_rows');
    }
};
