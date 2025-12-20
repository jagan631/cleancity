import { useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ImageUpload({ onImageUploaded }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview
        setPreview(URL.createObjectURL(file));
        setUploading(true);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('waste-images')
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('waste-images')
                .getPublicUrl(fileName);

            onImageUploaded(publicUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            {preview ? (
                <div className="relative">
                    <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button
                        onClick={() => {
                            setPreview(null);
                            onImageUploaded(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition block">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploading}
                    />
                    {uploading ? (
                        <Loader className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Click to upload photo</p>
                        </>
                    )}
                </label>
            )}
        </div>
    );
}