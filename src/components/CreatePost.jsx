import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/upload";

const QUICK_EMOJIS = ["😊", "🔥", "🚀", "❤️", "👍", "🎉"];

export default function CreatePost({ currentUser, onPostCreated }) {
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleAddEmoji = (emoji) => {
        setContent((prev) => prev + emoji);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;

        setUploading(true);

        try {
            let imageUrl = null;

            // Качване на снимката в Supabase Storage, ако има избрана
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, "posts");
            }

            const { error } = await supabase.from("posts").insert({
                user_id: currentUser.id,
                content: content.trim(),
                image_url: imageUrl,
            });

            if (error) {
                console.error("Грешка при създаване на пост:", error);
            } else {
                setContent("");
                setImageFile(null);
                setPreviewUrl(null);
                if (onPostCreated) onPostCreated();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Какво мислиш днес?"
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                    rows={3}
                />

                {/* Преглед на избраната снимка */}
                {previewUrl && (
                    <div className="relative inline-block">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Бързи емоджита */}
                <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-[11px] text-gray-400 mr-1 font-medium">Емоджи:</span>
                    {QUICK_EMOJIS.map((emoji, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleAddEmoji(emoji)}
                            className="hover:scale-125 transition-transform p-1 text-sm rounded-lg hover:bg-slate-50"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                {/* Долен панел с бутони */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <label className="cursor-pointer flex items-center space-x-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <span>Прикачи снимка</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={uploading || (!content.trim() && !imageFile)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                        {uploading ? "Публикуване..." : "Публикувай"}
                    </button>
                </div>
            </form>
        </div>
    );
}