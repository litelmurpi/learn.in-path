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
        Schema::create('pomodoro_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('work_duration')->default(25); // minutes
            $table->integer('short_break_duration')->default(5); // minutes
            $table->integer('long_break_duration')->default(15); // minutes
            $table->integer('long_break_interval')->default(4); // after how many work sessions
            $table->boolean('auto_start_breaks')->default(false);
            $table->boolean('auto_start_work')->default(false);
            $table->boolean('sound_enabled')->default(true);
            $table->string('notification_sound')->default('bell');
            $table->timestamps();
            
            // One setting per user
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pomodoro_settings');
    }
};
