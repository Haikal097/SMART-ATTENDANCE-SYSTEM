import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadTest() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setImage(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', image);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    try {
      const response = await fetch('/api/upload-test', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'Accept': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImages([result.url, ...uploadedImages]);
        setPreview(null);
        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveUploaded = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <>
      <Head title="Upload Test - Hidden" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        .upload-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #0f1117;
          padding: 40px;
        }

        .upload-card {
          background: #1a1a1a;
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 32px;
          max-width: 900px;
          margin: 0 auto;
        }

        .upload-title {
          font-size: 24px;
          font-weight: 500;
          color: #fff;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }

        .upload-subtitle {
          font-size: 13px;
          color: #888;
          margin-bottom: 28px;
        }

        .upload-dropzone {
          border: 1px dashed rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 48px;
          text-align: center;
          transition: all 0.15s;
          cursor: pointer;
          background: rgba(255,255,255,0.02);
        }

        .upload-dropzone:hover {
          border-color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.04);
        }

        .upload-dropzone.drag-active {
          border-color: #4ade80;
          background: rgba(74,222,128,0.05);
        }

        .upload-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 20px;
          border-radius: 8px;
          transition: all 0.15s;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .upload-btn-primary {
          background: #4ade80;
          color: #0f1117;
          border: none;
        }

        .upload-btn-primary:hover {
          opacity: 0.9;
        }

        .upload-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-btn-secondary {
          background: transparent;
          color: #fff;
          border: 0.5px solid rgba(255,255,255,0.2);
        }

        .upload-btn-secondary:hover {
          background: rgba(255,255,255,0.05);
        }

        .upload-btn-danger {
          background: transparent;
          color: #f87171;
          border: 0.5px solid rgba(248,113,113,0.3);
        }

        .upload-btn-danger:hover {
          background: rgba(248,113,113,0.08);
        }

        .upload-preview {
          margin-top: 24px;
          border-radius: 12px;
          overflow: hidden;
          border: 0.5px solid rgba(255,255,255,0.1);
        }

        .upload-preview img {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          background: #0a0a0a;
        }

        .upload-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 24px;
        }

        .upload-gallery-item {
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 0.5px solid rgba(255,255,255,0.1);
          position: relative;
        }

        .upload-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upload-gallery-overlay {
          position: absolute;
          top: 0;
          right: 0;
          padding: 4px;
        }

        .upload-error {
          color: #f87171;
          font-size: 12px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>

      <div className="upload-root">
        <div className="upload-card">
          <h1 className="upload-title">Upload Test</h1>
          <p className="upload-subtitle">
            Hidden page for testing image uploads - accessible only via /uploadtest
          </p>

          {/* Upload Area */}
          <form onSubmit={handleSubmit}>
            <div
              className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
                style={{ display: 'none' }}
              />

              {!preview ? (
                <>
                  <Upload size={32} style={{ color: '#888', marginBottom: 16 }} />
                  <p style={{ fontSize: 14, color: '#fff', marginBottom: 4 }}>
                    Drag & drop an image here
                  </p>
                  <p style={{ fontSize: 12, color: '#888' }}>
                    or click to browse (PNG, JPG, GIF up to 10MB)
                  </p>
                </>
              ) : (
                <div className="upload-preview">
                  <img src={preview} alt="Preview" />
                </div>
              )}
            </div>

            {error && (
              <div className="upload-error">
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            {/* Preview Actions */}
            {preview && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={handleClear}
                  className="upload-btn upload-btn-secondary"
                >
                  <X size={14} />
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="upload-btn upload-btn-primary"
                >
                  <Upload size={14} />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            )}
          </form>

          {/* Uploaded Images Gallery */}
          {uploadedImages.length > 0 && (
            <>
              <div style={{ 
                marginTop: 32, 
                paddingTop: 24, 
                borderTop: '0.5px solid rgba(255,255,255,0.08)' 
              }}>
                <h2 style={{ 
                  fontSize: 16, 
                  fontWeight: 500, 
                  color: '#fff', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <ImageIcon size={16} style={{ color: '#888' }} />
                  Uploaded Images
                  <span style={{ 
                    fontFamily: "'DM Mono', monospace", 
                    fontSize: 12, 
                    color: '#888',
                    marginLeft: 8
                  }}>
                    {uploadedImages.length}
                  </span>
                </h2>

                <div className="upload-gallery">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="upload-gallery-item">
                      <img src={img} alt={`Uploaded ${index + 1}`} />
                      <div className="upload-gallery-overlay">
                        <button
                          onClick={() => handleRemoveUploaded(index)}
                          style={{
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            borderRadius: 4,
                            padding: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          <X size={12} style={{ color: '#fff' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear All Button */}
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => setUploadedImages([])}
                  className="upload-btn upload-btn-danger"
                >
                  <X size={14} />
                  Clear All Images
                </button>
              </div>
            </>
          )}

          {/* Empty State */}
          {uploadedImages.length === 0 && (
            <div style={{ 
              marginTop: 32, 
              paddingTop: 24, 
              borderTop: '0.5px solid rgba(255,255,255,0.08)',
              textAlign: 'center'
            }}>
              <ImageIcon size={32} style={{ color: '#333', marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: '#666' }}>
                No images uploaded yet
              </p>
            </div>
          )}

          {/* Hidden Page Indicator */}
          <div style={{ 
            marginTop: 24, 
            paddingTop: 16, 
            borderTop: '0.5px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <CheckCircle size={10} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: 10, color: '#444', letterSpacing: '0.05em' }}>
              HIDDEN PAGE · /uploadtest
            </span>
          </div>
        </div>
      </div>
    </>
  );
}