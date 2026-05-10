<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User; 
use Inertia\Inertia;

class FaceApprovalController extends Controller
{
    public function index()
    {
        $approvals = User::whereNotNull('face_image_path')  // ← use face_image_path not face_image_url
            ->get()
            ->map(fn($u) => [
                'id'               => $u->id,
                'user_id'          => $u->id,
                'name'             => $u->name,
                'email'            => $u->email,
                'role'             => $u->role ?? 'student',
                'face_image_url'   => $u->face_image_url,
                'status'           => $u->face_status ?? 'pending',  // ← maps face_status → status
                'rejection_reason' => $u->face_rejection_reason ?? null,
                'submitted_at'     => $u->updated_at->diffForHumans(),
            ]);

        return Inertia::render('System/face-approvals', [
            'approvals' => $approvals,
            'stats' => [
                'pending'  => $approvals->where('status', 'pending')->count(),
                'approved' => $approvals->where('status', 'approved')->count(),
                'rejected' => $approvals->where('status', 'rejected')->count(),
                'total'    => $approvals->count(),
            ],
        ]);
    }

    public function approve(User $user) {
        $user->update(['face_status' => 'approved']);
        return back();
    }

    public function reject(Request $request, User $user) {
        $user->update(['face_status' => 'rejected', 'face_rejection_reason' => $request->reason]);
        return back();
    }
}
