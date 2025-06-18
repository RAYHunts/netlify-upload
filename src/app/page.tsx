"use client";

import { useState, useRef, useEffect } from "react";
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
  mimeType?: string;
}

interface ImageItem {
  filename: string;
  size: number;
  uploadedAt: string;
  originalName: string;
  mimeType: string;
  fileId: string;
  url: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images on component mount
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoadingImages(true);
    try {
      const response = await fetch("/.netlify/functions/list-images");
      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      }
    } catch (error) {
      console.error("Failed to load images:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
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
      const response = await fetch("/.netlify/functions/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          fileInputRef.current.value = "";
        }
        // Refresh the images list
        await loadImages();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: "Network error occurred",
        error: "Failed to connect to upload service",
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
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Image Upload Service</h1>
          <p className="text-lg text-gray-600">Upload images using Netlify Blob storage</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload New Image</h2>
            <div className="space-y-6">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select an image to upload</label>
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
                  <div className="relative w-full max-w-sm mx-auto">
                    <Image src={preview} alt="Preview" width={300} height={200} className="rounded-lg shadow-md object-cover w-full h-48" />
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    <p>
                      <strong>File:</strong> {selectedFile?.name}
                    </p>
                    <p>
                      <strong>Size:</strong> {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedFile?.type}
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-4 justify-center">
                <button onClick={handleUpload} disabled={!selectedFile || uploading} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>

                {(selectedFile || uploadResult) && (
                  <button onClick={resetForm} className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
                    Reset
                  </button>
                )}
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className={`p-4 rounded-lg ${uploadResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <h3 className={`font-medium ${uploadResult.success ? "text-green-800" : "text-red-800"}`}>{uploadResult.success ? "Upload Successful!" : "Upload Failed"}</h3>
                  <p className={`text-sm mt-1 ${uploadResult.success ? "text-green-700" : "text-red-700"}`}>{uploadResult.message}</p>

                  {uploadResult.success && uploadResult.fileId && (
                    <div className="mt-3 text-sm text-green-700">
                      <p>
                        <strong>File ID:</strong> {uploadResult.fileId}
                      </p>
                      <p>
                        <strong>Filename:</strong> {uploadResult.filename}
                      </p>
                      {uploadResult.size && (
                        <p>
                          <strong>Size:</strong> {formatFileSize(uploadResult.size)}
                        </p>
                      )}
                      <p>
                        <strong>Uploaded:</strong> {uploadResult.uploadedAt && formatDate(uploadResult.uploadedAt)}
                      </p>
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
                  <li>• Files stored in Netlify Blob storage</li>
                  <li>• Images are processed serverlessly</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Image Gallery</h2>
              <button onClick={loadImages} disabled={loadingImages} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm">
                {loadingImages ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loadingImages ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading images...</div>
              </div>
            ) : images.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">No images uploaded yet</div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {images.map((image) => (
                  <div key={image.fileId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Image src={image.url} alt={image.originalName} width={80} height={80} className="rounded-lg object-cover w-20 h-20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{image.originalName}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(image.size)} • {formatDate(image.uploadedAt)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">ID: {image.fileId}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <a href={image.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm">
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
