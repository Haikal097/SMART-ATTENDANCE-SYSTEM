<?php

namespace App\Http\Controllers;

use App\Models\Session;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SessionController extends Controller
{
    public function create(Subject $subject)
    {
        return Inertia::render('Sessions/Form', [
            'subject' => [
                'id'   => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
            ],
        ]);
    }

    public function store(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'date'        => 'required|date',
            'start_block' => 'required|integer|between:1,10',
            'end_block'   => 'required|integer|between:1,10|gte:start_block',
            'room'        => 'nullable|string|max:100',
            'status'      => 'required|in:scheduled,ongoing,completed,cancelled',
            'notes'       => 'nullable|string',
        ]);

        $subject->sessions()->create($validated);

        return redirect()->route('subjects.show', $subject->id)
            ->with('success', 'Session created successfully.');
    }

    public function edit(Subject $subject, Session $session)
    {
        return Inertia::render('Sessions/Form', [
            'subject' => [
                'id'   => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
            ],
            'session' => [
                'id'          => $session->id,
                'date'        => $session->date->format('Y-m-d'),
                'start_block' => $session->start_block,
                'end_block'   => $session->end_block,
                'room'        => $session->room ?? '',
                'status'      => $session->status,
                'notes'       => $session->notes ?? '',
            ],
        ]);
    }

    public function update(Request $request, Subject $subject, Session $session)
    {
        $validated = $request->validate([
            'date'        => 'required|date',
            'start_block' => 'required|integer|between:1,10',
            'end_block'   => 'required|integer|between:1,10|gte:start_block',
            'room'        => 'nullable|string|max:100',
            'status'      => 'required|in:scheduled,ongoing,completed,cancelled',
            'notes'       => 'nullable|string',
        ]);

        $session->update($validated);

        return redirect()->route('subjects.show', $subject->id)
            ->with('success', 'Session updated successfully.');
    }

    public function destroy(Subject $subject, Session $session)
    {
        $session->delete();
        return back()->with('success', 'Session deleted.');
    }
}