import { useState, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle,
  Download,
  Trash2,
  File,
  Film,
  Music,
  Archive,
  FolderOpen,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Copy,
  ExternalLink
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Media Library',
    href: '/media',
  },
];

interface MediaItem {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  size_for_humans: string;
  path: string;
  url: string;
  collection: string;
  is_image: boolean;
  created_at: string;
  meta: {
    original_name: string;
    extension: string;
    uploaded_by: number;
  };
}

interface Props {
  media: {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
  collections: string[];
  currentCollection: string;
}

export default function MediaIndex({ media, collections, currentCollection }: Props) {
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(currentCollection);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    setUploadProgress(0);

    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    let uploadedCount = 0;

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collection', selectedCollection);

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      try {
        const response = await fetch('/media', {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRF-TOKEN': csrfToken || '',
            'Accept': 'application/json',
          },
        });

        const result = await response.json();

        if (result.success) {
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
          
          if (uploadedCount === totalFiles) {
            router.reload({ only: ['media'] });
          }
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    try {
      await fetch(`/media/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'Accept': 'application/json',
        },
      });
      
      router.reload({ only: ['media'] });
      if (preview?.id === id) setPreview(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Delete ${selectedItems.length} selected files?`)) return;

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    try {
      await fetch('/media/bulk-destroy', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedItems }),
      });
      
      setSelectedItems([]);
      router.reload({ only: ['media'] });
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === media.data.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(media.data.map(item => item.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copied to clipboard!');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={24} />;
    if (mimeType.startsWith('video/')) return <Film size={24} />;
    if (mimeType.startsWith('audio/')) return <Music size={24} />;
    if (mimeType.includes('pdf')) return <File size={24} />;
    if (mimeType.includes('zip') || mimeType.includes('tar')) return <Archive size={24} />;
    return <File size={24} />;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Media Library" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        .media-root {
          font-family: 'DM Sans', sans-serif;
        }

        .media-card {
          background: #ffffff;
          border: 0.5px solid rgba(0,0,0,0.08);
          border-radius: 12px;
          transition: all 0.15s;
        }

        .media-card:hover {
          border-color: rgba(0,0,0,0.15);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .media-dropzone {
          border: 1px dashed rgba(0,0,0,0.15);
          border-radius: 12px;
          transition: all 0.15s;
          background: #fafafa;
        }

        .media-dropzone.drag-active {
          border-color: #4ade80;
          background: rgba(74,222,128,0.05);
        }

        .media-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.15s;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .media-btn-primary {
          background: #0f1117;
          color: #fff;
          border: none;
        }

        .media-btn-primary:hover {
          opacity: 0.85;
        }

        .media-btn-secondary {
          background: transparent;
          color: #0f1117;
          border: 0.5px solid rgba(0,0,0,0.1);
        }

        .media-btn-secondary:hover {
          background: #f5f5f5;
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .media-grid-item {
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
        }

        .media-grid-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-grid-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0);
          transition: background 0.15s;
        }

        .media-grid-item:hover .media-grid-overlay {
          background: rgba(0,0,0,0.3);
        }

        .dark .media-card { background: #111; border-color: rgba(255,255,255,0.06); }
        .dark .media-card:hover { border-color: rgba(255,255,255,0.12); }
        .dark .media-dropzone { background: #1a1a1a; border-color: rgba(255,255,255,0.1); }
        .dark .media-btn-secondary { color: #fff; border-color: rgba(255,255,255,0.1); }
        .dark .media-btn-secondary:hover { background: rgba(255,255,255,0.05); }
      `}</style>

      <div className="media-root p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 500, color: '#0f1117', letterSpacing: '-0.01em' }}>
              Media Library
            </h1>
            <p style={{ fontSize: 13, color: '#888' }}>
              Manage all your uploaded files and images
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="media-btn media-btn-primary"
            >
              <Upload size={14} />
              Upload Files
            </button>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div
          className={`media-dropzone ${dragActive ? 'drag-active' : ''}`}
          style={{ padding: '32px', textAlign: 'center' }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                handleUpload(files);
              }
            }}
            style={{ display: 'none' }}
          />
          
          <Upload size={32} style={{ color: '#888', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: '#0f1117', marginBottom: 4 }}>
            Drag & drop files here or click to browse
          </p>
          <p style={{ fontSize: 12, color: '#888' }}>
            Max file size: 10MB
          </p>

          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ 
                width: '100%', 
                height: 4, 
                background: 'rgba(0,0,0,0.1)', 
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${uploadProgress}%`, 
                  height: '100%', 
                  background: '#4ade80',
                  transition: 'width 0.3s'
                }} />
              </div>
              <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="media-input"
                style={{ 
                  padding: '8px 12px 8px 36px',
                  border: '0.5px solid rgba(0,0,0,0.1)',
                  borderRadius: 8,
                  fontSize: 13,
                  background: '#f9f9f9'
                }}
              />
            </div>

            <select 
              value={selectedCollection}
              onChange={(e) => {
                setSelectedCollection(e.target.value);
                router.get('/media', { collection: e.target.value }, { preserveState: true });
              }}
              style={{
                padding: '8px 12px',
                border: '0.5px solid rgba(0,0,0,0.1)',
                borderRadius: 8,
                fontSize: 13,
                background: '#f9f9f9'
              }}
            >
              <option value="default">All Files</option>
              {collections.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`media-btn ${viewMode === 'grid' ? 'media-btn-primary' : 'media-btn-secondary'}`}
              style={{ padding: '8px 12px' }}
            >
              <Grid size={14} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`media-btn ${viewMode === 'list' ? 'media-btn-primary' : 'media-btn-secondary'}`}
              style={{ padding: '8px 12px' }}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="media-card" style={{ padding: '12px 20px', background: '#0f1117' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span style={{ color: '#fff', fontSize: 13 }}>
                  {selectedItems.length} file{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <button 
                  onClick={handleBulkDelete}
                  className="media-btn"
                  style={{ background: 'transparent', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.3)' }}
                >
                  <Trash2 size={14} />
                  Delete Selected
                </button>
              </div>
              <button 
                onClick={() => setSelectedItems([])}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Media Grid */}
        {media.data.length > 0 ? (
          <div className="media-grid">
            {media.data.map((item) => (
              <div key={item.id} className="media-grid-item" onClick={() => setPreview(item)}>
                {item.is_image ? (
                  <img src={item.url} alt={item.name} />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#f5f5f5'
                  }}>
                    {getFileIcon(item.mime_type)}
                  </div>
                )}
                
                <div className="media-grid-overlay">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(item.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      accentColor: '#0f1117'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="media-card" style={{ padding: 60, textAlign: 'center' }}>
            <FolderOpen size={48} style={{ color: '#ddd', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 500, color: '#0f1117', marginBottom: 8 }}>
              No files uploaded yet
            </h3>
            <p style={{ fontSize: 13, color: '#888' }}>
              Drag & drop files or click the upload button to get started
            </p>
          </div>
        )}

        {/* Preview Modal */}
        {preview && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setPreview(null)}
          >
            <div 
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                background: '#1a1a1a',
                borderRadius: 16,
                overflow: 'hidden',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>{preview.name}</h3>
                    <p style={{ color: '#888', fontSize: 12 }}>
                      {preview.size_for_humans} • {preview.mime_type}
                    </p>
                  </div>
                  <button onClick={() => setPreview(null)} style={{ color: '#888' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
                {preview.is_image ? (
                  <img src={preview.url} alt={preview.name} style={{ maxHeight: '70vh' }} />
                ) : (
                  <div style={{ padding: 40, color: '#888', textAlign: 'center' }}>
                    {getFileIcon(preview.mime_type)}
                    <p style={{ marginTop: 16 }}>File preview not available</p>
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 20px', borderTop: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8 }}>
                <a 
                  href={`/media/${preview.id}/download`}
                  className="media-btn media-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Download size={14} />
                  Download
                </a>
                <button 
                  onClick={() => copyToClipboard(preview.url)}
                  className="media-btn media-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Copy size={14} />
                  Copy URL
                </button>
                <button 
                  onClick={() => window.open(preview.url, '_blank')}
                  className="media-btn media-btn-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  <ExternalLink size={14} />
                </button>
                <button 
                  onClick={() => {
                    handleDelete(preview.id);
                    setPreview(null);
                  }}
                  className="media-btn"
                  style={{ 
                    background: 'transparent', 
                    color: '#f87171', 
                    border: '0.5px solid rgba(248,113,113,0.3)',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}