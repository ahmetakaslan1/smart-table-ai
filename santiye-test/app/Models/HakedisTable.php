<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HakedisTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'raw_input',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rows(): HasMany
    {
        return $this->hasMany(HakedisRow::class, 'table_id')->orderBy('row_index');
    }
}
