<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User; 
use Inertia\Inertia;

class FaceApprovalController extends Controller
{
    public function index()
    {
        $approvals = User::whereNotNull('face_image_path')
            ->get()
            ->map(fn($u) => [
                'id'               => $u->id,
                'user_id'          => $u->id,
                'name'             => $u->name,
                'email'            => $u->email,
                'role'             => $u->role ?? 'student',
                'face_frontal_url' => $u->face_image_url,
                'face_left_url'    => $u->face_left_path  ? asset('storage/' . $u->face_left_path)  : null,
                'face_right_url'   => $u->face_right_path ? asset('storage/' . $u->face_right_path) : null,
                'status'           => $u->face_status ?? 'pending',
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

    public function approve(User $user)
    {
        $user->update(['face_status' => 'approved', 'face_rejection_reason' => null]);

        \App\Models\Student::where('email', $user->email)->update([
            'face_image_path'       => $user->face_image_path,
            'face_image_url'        => $user->face_image_url,
            'face_status'           => 'approved',
            'face_registered'       => true,
            'face_rejection_reason' => null,
        ]);

        return back()->with('success', 'Face ID approved for ' . $user->name . '.');
    }

    public function reject(Request $request, User $user)
    {
        $request->validate(['reason' => 'required|string|max:255']);

        $user->update([
            'face_status'           => 'rejected',
            'face_rejection_reason' => $request->reason,
        ]);

        // Also reject the matching student record
        \App\Models\Student::where('email', $user->email)->update([
            'face_status'           => 'rejected',
            'face_rejection_reason' => $request->reason,
        ]);

        return back()->with('success', 'Face ID rejected for ' . $user->name . '.');
    }
}
