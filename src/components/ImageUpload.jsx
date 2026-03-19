import React, { useState, useRef } from 'react';
import { Upload, X, Loader, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ImageUpload({ onImageUploaded, currentImage }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage || null);
    const [error, setError] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Start camera
    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            setStream(mediaStream);
            setShowCamera(true);

            // Wait for video element to be ready
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 100);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please check permissions or use file upload instead.');
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    // Capture photo from camera
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            if (blob) {
                // Create preview
                const previewUrl = URL.createObjectURL(blob);
                setPreview(previewUrl);

                // Stop camera
                stopCamera();

                // Upload the captured image
                await uploadImage(blob, 'camera-capture.jpg');
            }
        }, 'image/jpeg', 0.8); // 80% quality
    };

    // Handle file selection
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setError(null);

        // Show preview immediately
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Upload file
        await uploadImage(file, file.name);
    };

    // Upload image to Supabase
    const uploadImage = async (file, fileName) => {
        setUploading(true);

        try {
            // Create unique filename
            const fileExt = fileName.split('.').pop();
            const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = uniqueFileName;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('waste-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('waste-images')
                .getPublicUrl(filePath);

            console.log('Image uploaded successfully:', publicUrl);
            onImageUploaded(publicUrl);

        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message || 'Failed to upload image');
            setPreview(null);
            onImageUploaded(null);
        } finally {
            setUploading(false);
        }
    };

    // Remove image
    const handleRemove = () => {
        setPreview(null);
        setError(null);
        onImageUploaded(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
                Photo {uploading && <span className="text-gray-500">(Uploading...)</span>}
            </label>

            {error && (
                <div className="mb-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2 animate-slide-down">
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Camera View */}
            {showCamera && (
                <div className="mb-4 animate-scale-in">
                    <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-green-500 shadow-2xl">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-64 object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Camera Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border-4 border-green-500 group"
                                >
                                    <div className="w-12 h-12 bg-green-500 rounded-full group-hover:bg-green-600 transition-colors"></div>
                                </button>
                                <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" />
                                    Cancel
                                </button>
                            </div>
                            <p className="text-white text-center text-sm mt-3 font-medium">
                                📸 Position your camera and tap the button
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview */}
            {preview && !showCamera && (
                <div className="relative mb-4 animate-scale-in">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-2xl border-4 border-green-200 shadow-lg"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center">
                                <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-3" />
                                <p className="text-white font-semibold">Uploading image...</p>
                            </div>
                        </div>
                    )}
                    {!uploading && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110 group"
                        >
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        </button>
                    )}
                    <div className="mt-3 text-center">
                        <p className="text-sm text-gray-600">
                            ✓ Photo ready • Click X to remove and retake
                        </p>
                    </div>
                </div>
            )}

            {/* Upload Options */}
            {!preview && !showCamera && (
                <div className="space-y-3">
                    {/* Camera Button */}
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={uploading}
                        className="w-full border-3 border-green-500 bg-green-50 hover:bg-green-100 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group hover:shadow-lg hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-green-700 font-bold text-lg">Take Photo</p>
                                <p className="text-green-600 text-sm">Use your device camera</p>
                            </div>
                        </div>
                    </button>

                    {/* File Upload Button */}
                    <label className="block w-full border-3 border-dashed border-gray-300 hover:border-green-500 bg-gray-50 hover:bg-green-50 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group hover:shadow-lg">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-400 group-hover:bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                                {uploading ? (
                                    <Loader className="w-8 h-8 text-white animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8 text-white" />
                                )}
                            </div>
                            <div>
                                <p className="text-gray-700 group-hover:text-green-700 font-bold text-lg transition-colors">
                                    Upload from Gallery
                                </p>
                                <p className="text-gray-600 group-hover:text-green-600 text-sm transition-colors">
                                    PNG, JPG, GIF up to 5MB
                                </p>
                            </div>
                        </div>
                    </label>

                    {/* Info Text */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 animate-fade-in">
                        <div className="flex items-start gap-3">
                            <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800">
                                <strong>Tip:</strong> Clear photos help authorities resolve issues faster.
                                Take photos in good lighting and include the full context.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}