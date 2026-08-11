import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Image, Heart, MessageCircle, Folder, Plus, X } from "lucide-react";
import CreatePost from "./CreatePost";

export default function Gallery({ currentUser, onSelectPost }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlbum, setSelectedAlbum] = useState("Всички");
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        fetchGalleryImages();
    }, []);

    const fetchGalleryImages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("posts")
                .select(`
          id,
          image_url,
          album_name,
          created_at,
          user_id,
          profiles (username, avatar_url),
          likes (id),
          comments (id)
        `)
                .not("image_url", "is", null)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setImages(data || []);
        } catch (err) {
            console.error("Грешка при зареждане на галерията:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const albums = [
        "Всички",
        ...Array.from(new Set(images.map((img) => img.album_name || "Общи"))),
    ];

    const filteredImages =
        selectedAlbum === "Всички"
            ? images
            : images.filter((img) => (img.album_name || "Общи") === selectedAlbum);

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2">
                    <Image className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-bold text-gray-800">Фото Галерия</h2>
                </div>

                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добави снимка</span>
                </button>
            </div>

            {/* Album Filters */}
            {albums.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
                    {albums.map((alb) => (
                        <button
                            key={alb}
                            onClick={() => setSelectedAlbum(alb)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${selectedAlbum === alb
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                                }`}
                        >
                            {alb}
                        </button>
                    ))}
                </div>
            )}

            {/* Modal for Quick Upload */}
            {showUploadModal && currentUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-4 max-w-md w-full relative shadow-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h3 className="text-xs font-bold text-gray-800">
                                Добави снимка в албум
                            </h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <CreatePost
                            currentUser={currentUser}
                            defaultAlbum={selectedAlbum !== "Всички" ? selectedAlbum : "Общи"}
                            onPostCreated={() => {
                                setShowUploadModal(false);
                                fetchGalleryImages();
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="text-center py-10 text-xs text-gray-400">
                    Зареждане на снимките...
                </div>
            ) : filteredImages.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400">
                    Няма намерени снимки в този албум.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredImages.map((img) => (
                        <div
                            key={img.id}
                            onClick={() => onSelectPost && onSelectPost(img.id)}
                            className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer border border-gray-100"
                        >
                            <img
                                src={img.image_url}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />

                            <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-full font-medium">
                                {img.album_name || "Общи"}
                            </div>

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center space-x-4 text-white">
                                <div className="flex items-center space-x-1 text-xs font-bold">
                                    <Heart className="w-4 h-4 fill-white" />
                                    <span>{img.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs font-bold">
                                    <MessageCircle className="w-4 h-4 fill-white" />
                                    <span>{img.comments?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}