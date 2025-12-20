import { useState } from 'react';
import { Upload, X, Loader, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ImageUpload({ onImageUploaded, currentImage }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage || null);
    const [error, setError] = useState(null);

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
        setUploading(true);

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = fileName;

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

    const handleRemove = () => {
        setPreview(null);
        setError(null);
        onImageUploaded(null);
    };

    return (
        <div>
            <label className="block text-sm font-semibold mb-2">
                Photo {uploading && <span className="text-gray-500">(Uploading...)</span>}
            </label>

            {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                </div>
            )}

            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <Loader className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                    {!uploading && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                        Click the X to remove and upload a different image
                    </div>
                </div>
            ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition block">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploading}
                    />
                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <Loader className="w-10 h-10 text-green-500 animate-spin mb-2" />
                            <p className="text-sm text-gray-600">Uploading image...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Upload className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 font-semibold mb-1">Click to upload photo</p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </div>
                    )}
                </label>
            )}
        </div>
    );
}