import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Image, Send, X, FolderPlus } from "lucide-react";

const DEFAULT_ALBUMS = ["Общи", "Ваканция", "Приятели", "Природа", "Семейство", "Парти"];

export default function CreatePost({ currentUser, onPostCreated, defaultAlbum = "Общи" }) {
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [albumName, setAlbumName] = useState(defaultAlbum);
    const [customAlbum, setCustomAlbum] = useState("");
    const [isCustomAlbum, setIsCustomAlbum] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;

        setLoading(true);
        try {
            let imageUrl = null;

            if (imageFile) {
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
                const filePath = `${currentUser.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("post-images")
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("post-images")
                    .getPublicUrl(filePath);

                imageUrl = urlData.publicUrl;
            }

            const finalAlbum = isCustomAlbum && customAlbum.trim()
                ? customAlbum.trim()
                : albumName;

            const { error } = await supabase.from("posts").insert([
                {
                    user_id: currentUser.id,
                    content: content.trim(),
                    image_url: imageUrl,
                    album_name: imageUrl ? finalAlbum : "Общи",
                },
            ]);

            if (error) throw error;

            setContent("");
            setImageFile(null);
            setImagePreview(null);
            setIsCustomAlbum(false);
            setCustomAlbum("");

            if (onPostCreated) onPostCreated();
        } catch (err) {
            console.error("Грешка при публикуване:", err.message);
            alert("Възникна грешка при публикуването.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Какво мислиш днес?..."
                    rows={2}
                    className="w-full text-xs text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white p-3 rounded-xl border border-transparent focus:border-blue-#1d4ed8 focus:outline-none transition resize-none"
                />

                {/* Преглед на избраната снимка и настройки за Албум */}
                {imagePreview && (
                    <div className="space-y-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <div className="relative rounded-lg overflow-hidden max-h-48">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black text-white rounded-full transition"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Избор на Албум */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-gray-200/60">
                            <div className="flex items-center text-xs text-gray-500 gap-1 shrink-0">
                                <FolderPlus className="w-3.5 h-3.5 text-blue-#1d4ed8" />
                                <span className="font-semibold">Албум:</span>
                            </div>

                            {!isCustomAlbum ? (
                                <div className="flex items-center gap-2 w-full">
                                    <select
                                        value={albumName}
                                        onChange={(e) => {
                                            if (e.target.value === "NEW") {
                                                setIsCustomAlbum(true);
                                            } else {
                                                setAlbumName(e.target.value);
                                            }
                                        }}
                                        className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-#1d4ed8 flex-1"
                                    >
                                        {DEFAULT_ALBUMS.map((alb) => (
                                            <option key={alb} value={alb}>{alb}</option>
                                        ))}
                                        <option value="NEW">+ Нов албум...</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 w-full">
                                    <input
                                        type="text"
                                        value={customAlbum}
                                        onChange={(e) => setCustomAlbum(e.target.value)}
                                        placeholder="Име на нов албум..."
                                        className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-#1d4ed8 flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomAlbum(false)}
                                        className="text-[11px] text-gray-500 hover:text-gray-700 px-1"
                                    >
                                        Отказ
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-1.5 text-xs text-gray-600 hover:text-blue-#1d4ed8 cursor-pointer transition px-2 py-1 rounded-lg hover:bg-gray-50">
                        <Image className="w-4 h-4 text-blue-#1d4ed8" />
                        <span className="font-semibold">Снимка</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading || (!content.trim() && !imageFile)}
                        className="flex items-center space-x-1.5 bg-blue-#1d4ed8 hover:bg-blue-#1d4ed8 disabled:opacity-50 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{loading ? "Публикуване..." : "Публикувай"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}