<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HakedisRow extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_id',
        'row_index',
        'columns',
    ];

    protected $casts = [
        'columns' => 'array', // JSON otomatik olarak PHP array'e çevrilir
    ];

    public function hakedisTable(): BelongsTo
    {
        return $this->belongsTo(HakedisTable::class, 'table_id');
    }
}
