import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function CreateReelModal({ currentUser, onClose, onReelCreated }) {
    const [caption, setCaption] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!videoFile) return alert("Моля, избери видео файл!");

        try {
            setUploading(true);

            // 1. Уникално име за файла
            const fileExt = videoFile.name.split(".").pop();
            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Качване в Supabase Storage bucket 'reels'
            const { error: uploadError } = await supabase.storage
                .from("reels")
                .upload(filePath, videoFile);

            if (uploadError) throw uploadError;

            // 3. Вземане на публичния URL
            const { data: urlData } = supabase.storage
                .from("reels")
                .getPublicUrl(filePath);

            const videoUrl = urlData.publicUrl;

            // 4. Запис в таблицата 'reels'
            const { error: dbError } = await supabase.from("reels").insert([
                {
                    user_id: currentUser.id,
                    video_url: videoUrl,
                    caption: caption,
                },
            ]);

            if (dbError) throw dbError;

            onReelCreated();
            onClose();
        } catch (error) {
            console.error("Грешка при качване:", error);
            alert("Възникна грешка при качването на видеото.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-800 text-sm">Качи нов Reel / TikTok Видео</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 font-bold"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Избери видео файл (.mp4, .mov)
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setVideoFile(e.target.files[0])}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Описание / Hashtags
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Напиши кратко описание..."
                            className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {uploading ? "Качване..." : "Публикувай Reel"}
                    </button>
                </form>
            </div>
        </div>
    );
}