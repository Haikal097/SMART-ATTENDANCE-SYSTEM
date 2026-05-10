<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\StudentController; 
use App\Http\Controllers\MediaController; 
use App\Http\Controllers\FaceApprovalController;
use App\Http\Controllers\SubjectController;


Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Students Routes
    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    Route::post('/students/bulk-action', [StudentController::class, 'bulkAction'])->name('students.bulk');
    Route::get('/students/import', [StudentController::class, 'import'])->name('students.import');
    Route::post('/students/import', [StudentController::class, 'importStore'])->name('students.import.store');
    Route::get('/students/export', [StudentController::class, 'export'])->name('students.export');

        // ── Student Routes ──────────────────────────────────────────────
    Route::prefix('student')->name('student.')->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('Students    /Dashboard');
        })->name('dashboard');
        
        Route::get('/courses', function () {
            return Inertia::render('Students/Courses');
        })->name('courses');
        
        Route::post('/courses/{course}/enroll', function ($courseId) {
            return back()->with('success', 'Enrolled successfully!');
        })->name('courses.enroll');
    });


    // Media Library Routes
    Route::get('/media', [MediaController::class, 'index'])->name('media.index');
    Route::post('/media', [MediaController::class, 'store'])->name('media.store');
    Route::delete('/media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');
    Route::post('/media/bulk-destroy', [MediaController::class, 'bulkDestroy'])->name('media.bulk-destroy');
    Route::get('/media/{medium}/download', [MediaController::class, 'download'])->name('media.download');
    
    // Legacy hidden upload test (now points to media system)
    Route::get('/uploadtest', function () {
        return Inertia::render('Media/Index', [
            'media' => \App\Models\Media::latest()->paginate(20),
            'collections' => \App\Models\Media::select('collection')->distinct()->pluck('collection'),
            'currentCollection' => 'default',
        ]);
    })->name('upload.test');

    // Profile face upload
    Route::post('/profile/upload-face', function (Request $request) {
        try {
            $request->validate([
                'face_image' => 'required|image|max:5120',
            ]);

            $user = auth()->user();
            
            // Delete old face image if exists
            if ($user->face_image_path && Storage::disk('public')->exists($user->face_image_path)) {
                Storage::disk('public')->delete($user->face_image_path);
            }

            $path = $request->file('face_image')->store('student-faces', 'public');
            
            $user->update([
                'face_image_path' => $path,
                'face_image_url' => asset('storage/' . $path),
                'face_status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $path),
                'message' => 'Face image uploaded successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    })->name('profile.upload-face');

    Route::prefix('system/face-approvals')->group(function () {
        Route::get('/',                [FaceApprovalController::class, 'index'])->name('face-approvals.index');
        Route::post('/{user}/approve', [FaceApprovalController::class, 'approve'])->name('face-approvals.approve');
        Route::post('/{user}/reject',  [FaceApprovalController::class, 'reject'])->name('face-approvals.reject');
    });
    
    // API endpoint for handling uploads
    Route::post('/api/upload-test', function (Request $request) {
        $request->validate([
            'image' => 'required|image|max:10240',
        ]);
        
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('test-uploads', 'public');
            
            return response()->json([
                'success' => true,
                'path' => $path,
                'url' => asset('storage/' . $path),
            ]);
        }
        
        return response()->json(['success' => false], 400);
    })->name('upload.test.store');

    // Subjects Routes
    Route::resource('subjects', SubjectController::class);
    Route::post('/subjects/{subject}/enroll',             [SubjectController::class, 'enroll'])->name('subjects.enroll');
    Route::delete('/subjects/{subject}/enroll/{student}', [SubjectController::class, 'unenroll'])->name('subjects.unenroll');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
