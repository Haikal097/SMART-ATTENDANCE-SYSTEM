<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Try to find a linked student record by email
        $student = \App\Models\Student::where('email', $user->email)->first();

        $attendanceStat = null;
        $recentActivity = [];

        if ($student) {
            $attendances = $student->attendances()
                ->with(['session' => fn ($q) => $q->with('subject')])
                ->orderByDesc('checked_in_at')
                ->orderByDesc('created_at')
                ->get();

            $total   = $attendances->count();
            $present = $attendances->where('status', 'present')->count();
            $late    = $attendances->where('status', 'late')->count();
            $absent  = $attendances->where('status', 'absent')->count();

            $attendanceStat = [
                'total'   => $total,
                'present' => $present,
                'late'    => $late,
                'absent'  => $absent,
                'rate'    => $total > 0 ? round(($present + $late) / $total * 100, 1) : 0,
            ];

            $recentActivity = $attendances->take(10)->map(fn ($a) => [
                'status'      => $a->status,
                'subjectCode' => $a->session?->subject?->code ?? '—',
                'subjectName' => $a->session?->subject?->name ?? 'Unknown Subject',
                'room'        => $a->session?->room ?? '',
                'time'        => $a->checked_in_at
                    ? $a->checked_in_at->format('D, d M · H:i')
                    : $a->created_at->format('D, d M'),
            ])->values()->toArray();
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status'          => session('status'),
            'attendanceStat'  => $attendanceStat,
            'recentActivity'  => $recentActivity,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
