<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function home(Request $request)
    {
        $auth = Auth::user();
        $search = $request->input('search');
        $filter = $request->input('filter');

        // --- STATISTIK ---
        // Kita hitung statistik TOTAL sebelum ada filter/pagination
        $totalTodos = Todo::where('user_id', $auth->id)->count();
        $totalFinished = Todo::where('user_id', $auth->id)->where('is_finished', true)->count();
        // --- END STATISTIK ---


        // Query utama untuk daftar todo (dengan filter dan paginasi)
        $todos = Todo::where('user_id', $auth->id)
            ->orderBy('created_at', 'desc')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($filter, function ($query, $filter) {
                if ($filter === 'finished') {
                    $query->where('is_finished', true);
                } elseif ($filter === 'unfinished') {
                    $query->where('is_finished', false);
                }
            })
            ->paginate(20)
            ->withQueryString();

        $data = [
            'auth' => $auth,
            'todos' => $todos,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
            ],
            // --- 1. Tambahkan props 'stats' ---
            'stats' => [
                'total' => $totalTodos,
                'finished' => $totalFinished,
                'unfinished' => $totalTodos - $totalFinished,
            ]
        ];
        return Inertia::render('App/HomePage', $data);
    }
}