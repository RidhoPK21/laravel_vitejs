<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TodoController; // <-- Tambahkan ini

Route::middleware(['handle.inertia'])->group(function () {
    // Auth Routes
   Route::group(['prefix' => 'auth'], function () {
        Route::get('/login', [AuthController::class, 'login'])->name('auth.login');
        Route::post('/login', [AuthController::class, 'postLogin']); // <-- HAPUS .name() DARI SINI

        Route::get('/register', [AuthController::class, 'register'])->name('auth.register');
        Route::post('/register', [AuthController::class, 'postRegister']); // <-- HAPUS .name() DARI SINI JUGA
        
        Route::get('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    });

    Route::group(['middleware' => 'check.auth'], function () {
        Route::get('/', [HomeController::class, 'home'])->name('home');

        // --- Tambahkan Route untuk Todos ---
        Route::resource('todos', TodoController::class)->only([
            'store', 'update', 'destroy'
        ]);
        
        // Route khusus untuk update cover
        Route::post('/todos/{todo}/cover', [TodoController::class, 'updateCover'])->name('todos.updateCover');
        // ---------------------------------
    });
});