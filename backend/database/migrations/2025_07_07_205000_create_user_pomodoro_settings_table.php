<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_pomodoro_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('work_duration')->default(25); // in minutes
            $table->integer('short_break_duration')->default(5); // in minutes
            $table->integer('long_break_duration')->default(15); // in minutes
            $table->integer('sessions_before_long_break')->default(4);
            $table->boolean('auto_start_breaks')->default(false);
            $table->boolean('notifications_enabled')->default(true);
            $table->timestamps();
            
            // Unique constraint to ensure one setting per user
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_pomodoro_settings');
    }
};