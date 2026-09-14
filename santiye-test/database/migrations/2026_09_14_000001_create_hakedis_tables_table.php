<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hakedis_tables', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('İsimsiz Hesap');
            $table->text('raw_input')->nullable(); // Kullanıcının girdiği ham metin
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hakedis_tables');
    }
};
