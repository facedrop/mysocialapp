import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Gallery({ currentUser }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchUserPhotos();
        }
    }, [currentUser]);

    const fetchUserPhotos = async () => {
        setLoading(true);
        try {
            // Извличаме постовете на потребителя, които съдържат снимка (image_url)
            const { data, error } = await supabase
                .from("posts")
                .select("id, image_url, created_at, content")
                .eq("user_id", currentUser.id)
                .not("image_url", "is", null)
                .order("created_at", { ascending: false });

            if (!error && data) {
                setPhotos(data);
            }
        } catch (err) {
            console.error("Грешка при зареждане на галерията:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Моята Галерия</h2>
                    <p className="text-xs text-gray-400">Всички качени снимки в профила ти</p>
                </div>
                <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                    {photos.length} {photos.length === 1 ? "снимка" : "снимки"}
                </span>
            </div>

            {loading ? (
                <p className="text-xs text-gray-400 text-center py-8">Зареждане на снимки...</p>
            ) : photos.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-500">Все още нямаш качени снимки.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group border border-gray-100 shadow-2xs"
                        >
                            <img
                                src={photo.image_url}
                                alt={photo.content || "Галерия снимка"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <p className="text-[10px] text-white truncate font-medium">
                                    {photo.content || new Date(photo.created_at).toLocaleDateString("bg-BG")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}