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
        Schema::create('pomodoro_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('session_type', ['work', 'short_break', 'long_break'])->default('work');
            $table->integer('duration_minutes')->default(25);
            $table->enum('status', ['active', 'paused', 'completed', 'cancelled'])->default('active');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('study_log_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('actual_duration_minutes')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Index for performance
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'started_at']);
            $table->index(['session_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pomodoro_sessions');
    }
};