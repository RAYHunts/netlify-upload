'use client';

import { useState, useRef } from 'react';
import Image from "next/image";

interface UploadResponse {
  success: boolean;
  message: string;
  fileId?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  url?: string;
  uploadedAt?: string;
  error?: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch('/.netlify/functions/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: preview,
          filename: selectedFile.name,
        }),
      });

      const result: UploadResponse = await response.json();
      setUploadResult(result);

      if (result.success) {
        // Clear the form after successful upload
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: 'Network error occurred',
        error: 'Failed to connect to upload service',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Image Upload Service
          </h1>
          <p className="text-lg text-gray-600">
            Upload images using Netlify serverless functions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select an image to upload
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Preview:</h3>
                <div className="relative w-full max-w-md mx-auto">
                  <Image
                    src={preview}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="rounded-lg shadow-md object-cover"
                  />
                </div>
                <div className="text-sm text-gray-600 text-center">
                  <p><strong>File:</strong> {selectedFile?.name}</p>
                  <p><strong>Size:</strong> {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
                  <p><strong>Type:</strong> {selectedFile?.type}</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
              
              {(selectedFile || uploadResult) && (
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className={`p-4 rounded-lg ${
                uploadResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                </h3>
                <p className={`text-sm mt-1 ${
                  uploadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {uploadResult.message}
                </p>
                
                {uploadResult.success && uploadResult.fileId && (
                  <div className="mt-3 text-sm text-green-700">
                    <p><strong>File ID:</strong> {uploadResult.fileId}</p>
                    <p><strong>Filename:</strong> {uploadResult.filename}</p>
                    {uploadResult.size && (
                      <p><strong>Size:</strong> {(uploadResult.size / 1024).toFixed(2)} KB</p>
                    )}
                    <p><strong>Uploaded:</strong> {uploadResult.uploadedAt && new Date(uploadResult.uploadedAt).toLocaleString()}</p>
                  </div>
                )}
                
                {!uploadResult.success && uploadResult.error && (
                  <p className="text-sm mt-1 text-red-600">
                    <strong>Error:</strong> {uploadResult.error}
                  </p>
                )}
              </div>
            )}

            {/* Info Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Upload Guidelines:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
                <li>• Maximum file size: 5MB</li>
                <li>• Images are processed serverlessly using Netlify Functions</li>
                <li>• This is a demo - in production, files would be stored in cloud storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
