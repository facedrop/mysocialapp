import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Plus, X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export default function StoriesBar({ currentUser }) {
    const [stories, setStories] = useState([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);

    // Състояние за преглед на стори
    const [activeStoryGroup, setActiveStoryGroup] = useState(null); // Сторитата на избрания потребител
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    useEffect(() => {
        fetchStories();
    }, []);

    // Зареждаме само сторита от последните 24 часа
    const fetchStories = async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data, error } = await supabase
                .from("stories")
                .select(`
          id,
          media_url,
          caption,
          created_at,
          user_id,
          profiles:user_id (id, username, avatar_url)
        `)
                .gte("created_at", twentyFourHoursAgo)
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Групираме сторитата по потребител
            const grouped = (data || []).reduce((acc, story) => {
                const uid = story.user_id;
                if (!acc[uid]) {
                    acc[uid] = {
                        user: story.profiles,
                        items: [],
                    };
                }
                acc[uid].items.push(story);
                return acc;
            }, {});

            setStories(Object.values(grouped));
        } catch (err) {
            console.error("Грешка при зареждане на сторита:", err.message);
        }
    };

    // Качване на снимка за стори
    const handleUploadStory = async (e) => {
        e.preventDefault();
        if (!selectedImage) return;

        setUploading(true);
        try {
            const fileExt = selectedImage.name.split(".").pop();
            const fileName = `${currentUser.id}_story_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("post-images") // Ползваме съществуващия ти бакет
                .upload(fileName, selectedImage);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("post-images")
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase.from("stories").insert({
                user_id: currentUser.id,
                media_url: publicUrlData.publicUrl,
                caption: caption.trim() || null,
            });

            if (dbError) throw dbError;

            setSelectedImage(null);
            setCaption("");
            setIsUploadOpen(false);
            fetchStories();
        } catch (err) {
            console.error("Грешка при качване на стори:", err.message);
            alert("Неуспешно качване на стори.");
        } finally {
            setUploading(false);
        }
    };

    const handleNextStory = () => {
        if (!activeStoryGroup) return;
        if (activeStoryIndex < activeStoryGroup.items.length - 1) {
            setActiveStoryIndex((prev) => prev + 1);
        } else {
            setActiveStoryGroup(null);
        }
    };

    const handlePrevStory = () => {
        if (activeStoryIndex > 0) {
            setActiveStoryIndex((prev) => prev - 1);
        }
    };

    const myStoriesGroup = stories.find((g) => g.user?.id === currentUser?.id);

    return (
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs mb-4 overflow-hidden">
            <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1">

                {/* БУТОН ЗА ДОБАВЯНЕ НА СТОРИ */}
                <div className="flex flex-col items-center space-y-1 shrink-0 cursor-pointer group" onClick={() => setIsUploadOpen(true)}>
                    <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-blue-500 p-0.5 flex items-center justify-center transition group-hover:scale-105">
                        <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Plus className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700">Твоето стори</span>
                </div>

                {/* СПИСЪК СЪС СТОРИТА НА ПОТРЕБИТЕЛИТЕ */}
                {stories.map((group) => {
                    const isMe = group.user?.id === currentUser?.id;

                    return (
                        <div
                            key={group.user?.id}
                            onClick={() => {
                                setActiveStoryGroup(group);
                                setActiveStoryIndex(0);
                            }}
                            className="flex flex-col items-center space-y-1 shrink-0 cursor-pointer group"
                        >
                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-blue-600 transition group-hover:scale-105">
                                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {group.user?.avatar_url ? (
                                        <img
                                            src={group.user.avatar_url}
                                            alt="Story"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="font-bold text-xs text-gray-700">
                                            {group.user?.username ? group.user.username[0].toUpperCase() : "U"}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="text-[11px] font-medium text-gray-700 truncate max-w-[60px]">
                                {isMe ? "Аз" : group.user?.username}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* МОДАЛ ЗА КАЧВАНЕ НА СТОРИ */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white max-w-sm w-full rounded-3xl p-5 space-y-4 relative shadow-2xl animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => setIsUploadOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="font-bold text-gray-900 text-sm">Добави нов момент (Стори)</h3>

                        <form onSubmit={handleUploadStory} className="space-y-3">
                            <label className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                                {selectedImage ? (
                                    <img
                                        src={URL.createObjectURL(selectedImage)}
                                        alt="Preview"
                                        className="max-h-40 rounded-xl object-cover"
                                    />
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-blue-500 mb-2 opacity-60" />
                                        <span className="text-xs font-semibold text-gray-600">Избери снимка</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setSelectedImage(e.target.files[0])}
                                />
                            </label>

                            <input
                                type="text"
                                placeholder="Добави описание (по избор)..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:border-blue-600 outline-none transition"
                            />

                            <button
                                type="submit"
                                disabled={!selectedImage || uploading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                            >
                                {uploading ? "Качване..." : "Публикувай Стори"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ПРЕГЛЕД НА СТОРИ (FULLSCREEN MODAL) */}
            {activeStoryGroup && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <button
                        onClick={() => setActiveStoryGroup(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50 cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="max-w-sm w-full h-[80vh] relative flex flex-col justify-between bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                        {/* Header на Сторито */}
                        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10 flex items-center space-x-3 text-white">
                            <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden">
                                <img
                                    src={activeStoryGroup.user?.avatar_url}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-xs font-bold">{activeStoryGroup.user?.username}</p>
                                <p className="text-[10px] text-gray-300">
                                    {new Date(
                                        activeStoryGroup.items[activeStoryIndex]?.created_at
                                    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </div>

                        {/* Изображение */}
                        <div className="w-full h-full flex items-center justify-center">
                            <img
                                src={activeStoryGroup.items[activeStoryIndex]?.media_url}
                                alt="Story content"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Описание (ако има) */}
                        {activeStoryGroup.items[activeStoryIndex]?.caption && (
                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-center text-xs font-medium">
                                {activeStoryGroup.items[activeStoryIndex].caption}
                            </div>
                        )}

                        {/* Навигационни бутони */}
                        {activeStoryIndex > 0 && (
                            <button
                                onClick={handlePrevStory}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={handleNextStory}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition cursor-pointer"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}