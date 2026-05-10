<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MediaController extends Controller
{
    /**
     * Display media library page
     */
    public function index(Request $request)
    {
        $collection = $request->get('collection', 'default');
        
        $media = Media::collection($collection)
            ->latest()
            ->paginate(20)
            ->through(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'file_name' => $item->file_name,
                    'mime_type' => $item->mime_type,
                    'size' => $item->size,
                    'size_for_humans' => $item->size_for_humans,
                    'path' => $item->path,
                    'url' => $item->url,
                    'collection' => $item->collection,
                    'is_image' => str_starts_with($item->mime_type, 'image/'), // Add this
                    'created_at' => $item->created_at,
                    'meta' => $item->meta,
                ];
            });

        $collections = Media::select('collection')
            ->distinct()
            ->pluck('collection');

        return Inertia::render('Media/Index', [
            'media' => $media,
            'collections' => $collections,
            'currentCollection' => $collection,
        ]);
    }

    /**
     * Store uploaded media
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
            'collection' => 'nullable|string|max:50',
            'student_id' => 'nullable|string', // Add this for linking to students
        ]);

        if (!$request->hasFile('file')) {
            return response()->json(['success' => false, 'message' => 'No file uploaded'], 400);
        }

        $file = $request->file('file');
        $collection = $request->get('collection', 'default');
        
        $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9.]/', '_', $file->getClientOriginalName());
        $path = $file->storeAs("media/{$collection}", $fileName, 'public');
        
        $media = Media::create([
            'name' => $file->getClientOriginalName(),
            'file_name' => $fileName,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => asset('storage/' . $path),
            'collection' => $collection,
            'meta' => [
                'original_name' => $file->getClientOriginalName(),
                'extension' => $file->getClientOriginalExtension(),
                'uploaded_by' => auth()->id(),
            ],
        ]);

        // --- Push to Raspberry Pi ---
        $piIpAddress = env('RASPBERRY_PI_IP'); // ⚠️ CHANGE THIS TO YOUR PI'S ACTUAL IP
        
        try {
            $fileContent = Storage::disk('public')->get($path);
            
            $response = Http::timeout(10)
                ->attach('image', $fileContent, $media->file_name)
                ->post("http://{$piIpAddress}:5000/receive-image", [
                    'student_id' => $request->input('student_id', $media->id),
                ]);

            if ($response->successful()) {
                \Log::info("✅ Image pushed to Raspberry Pi successfully");
                $media->meta = array_merge($media->meta ?? [], ['synced_to_pi' => true]);
                $media->save();
            } else {
                \Log::error("❌ Pi rejected file: " . $response->body());
            }
        } catch (\Exception $e) {
            \Log::error("❌ Failed to connect to Pi: " . $e->getMessage());
        }
        // --- End Push ---

        return response()->json([
            'success' => true,
            'media' => [
                'id' => $media->id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'size_for_humans' => $media->size_for_humans,
                'path' => $media->path,
                'url' => $media->url,
                'collection' => $media->collection,
                'is_image' => str_starts_with($media->mime_type, 'image/'),
                'created_at' => $media->created_at,
            ],
            'message' => 'File uploaded successfully',
        ]);
    }

    /**
     * Delete media
     */
    public function destroy(Media $medium)
    {
        // Delete physical file
        if (Storage::disk('public')->exists($medium->path)) {
            Storage::disk('public')->delete($medium->path);
        }
        
        $medium->delete();

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully',
        ]);
    }

    /**
     * Bulk delete media
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:media,id',
        ]);

        $media = Media::whereIn('id', $request->ids)->get();
        
        foreach ($media as $item) {
            if (Storage::disk('public')->exists($item->path)) {
                Storage::disk('public')->delete($item->path);
            }
            $item->delete();
        }

        return response()->json([
            'success' => true,
            'message' => count($media) . ' files deleted successfully',
        ]);
    }

    /**
     * Download media file
     */
    public function download(Media $medium)
    {
        if (!Storage::disk('public')->exists($medium->path)) {
            abort(404);
        }

        return Storage::disk('public')->download(
            $medium->path, 
            $medium->name ?? $medium->file_name
        );
    }
}