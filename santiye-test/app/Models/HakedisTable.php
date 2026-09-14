<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HakedisTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'raw_input',
    ];

    public function rows(): HasMany
    {
        return $this->hasMany(HakedisRow::class, 'table_id')->orderBy('row_index');
    }
}
