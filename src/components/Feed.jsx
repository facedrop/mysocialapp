import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Image, Smile, Heart, MessageSquare, Share2, AlertCircle, Send, Loader2 } from "lucide-react";

export default function Feed({ currentUser }) {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);

    // Състояние за коментарите
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from("posts")
                .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles ( username, avatar_url ),
          likes ( user_id ),
          comments (
            id,
            content,
            created_at,
            user_id,
            profiles ( username, avatar_url )
          )
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error("Грешка при зареждане на постове:", err.message);
        }
    };

    // ФУНКЦИЯ ЗА КАЧВАНЕ НА СНИМКА В SUPABASE STORAGE
    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            setError("");

            const file = e.target.files[0];
            if (!file) return;

            // Проверка за тип и размер (макс 5MB)
            if (!file.type.startsWith("image/")) {
                setError("Моля, изберете валиден графичен файл (изображение).");
                return;
            }

            const fileExt = file.name.split(".").pop();
            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Качване във файловата система на Supabase
            const { error: uploadError } = await supabase.storage
                .from("post-images")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Вземане на публичния URL адрес
            const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
            setImageUrl(data.publicUrl);
        } catch (err) {
            setError("Грешка при качване на снимката: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!content.trim() && !imageUrl) return;

        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase
                .from("posts")
                .insert([
                    {
                        content,
                        image_url: imageUrl || null,
                        user_id: currentUser.id,
                    },
                ])
                .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles ( username, avatar_url ),
          likes ( user_id ),
          comments ( id )
        `);

            if (error) throw error;

            if (data && data[0]) {
                setPosts([data[0], ...posts]);
            }
            setContent("");
            setImageUrl("");
        } catch (err) {
            setError("Грешка при публикуване: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLike = async (postId, currentLikes) => {
        if (!currentUser) return;

        const hasLiked = currentLikes?.some((like) => like.user_id === currentUser.id);

        try {
            if (hasLiked) {
                const { error } = await supabase
                    .from("likes")
                    .delete()
                    .eq("post_id", postId)
                    .eq("user_id", currentUser.id);

                if (error) throw error;

                setPosts(
                    posts.map((p) =>
                        p.id === postId
                            ? { ...p, likes: p.likes.filter((l) => l.user_id !== currentUser.id) }
                            : p
                    )
                );
            } else {
                const { error } = await supabase
                    .from("likes")
                    .insert([{ post_id: postId, user_id: currentUser.id }]);

                if (error) throw error;

                setPosts(
                    posts.map((p) =>
                        p.id === postId
                            ? { ...p, likes: [...(p.likes || []), { user_id: currentUser.id }] }
                            : p
                    )
                );
            }
        } catch (err) {
            console.error("Грешка при харесване:", err.message);
        }
    };

    const handleAddComment = async (postId) => {
        if (!commentText.trim() || !currentUser) return;

        setCommentLoading(true);

        try {
            const { data, error } = await supabase
                .from("comments")
                .insert([
                    {
                        post_id: postId,
                        user_id: currentUser.id,
                        content: commentText.trim(),
                    },
                ])
                .select(`
          id,
          content,
          created_at,
          user_id,
          profiles ( username, avatar_url )
        `);

            if (error) throw error;

            if (data && data[0]) {
                setPosts(
                    posts.map((p) =>
                        p.id === postId
                            ? { ...p, comments: [...(p.comments || []), data[0]] }
                            : p
                    )
                );
            }

            setCommentText("");
        } catch (err) {
            console.error("Грешка при коментиране:", err.message);
        } finally {
            setCommentLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Форма за нов пост */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <form onSubmit={handleCreatePost} className="space-y-4">
                    <div className="flex space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-#1d4ed8 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {currentUser?.email ? currentUser.email[0].toUpperCase() : "U"}
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Какво мислите днес?"
                            className="w-full resize-none border-none focus:ring-0 text-gray-700 placeholder-gray-400 text-base min-h-[80px] outline-none"
                        />
                    </div>

                    {/* Преглед на избраната снимка */}
                    {uploading && (
                        <div className="flex items-center space-x-2 text-sm text-blue-#1d4ed8 p-2 bg-blue-50 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Качване на снимката...</span>
                        </div>
                    )}

                    {imageUrl && !uploading && (
                        <div className="relative">
                            <img
                                src={imageUrl}
                                alt="Предварителен преглед"
                                className="max-h-60 rounded-lg object-cover w-full"
                            />
                            <button
                                type="button"
                                onClick={() => setImageUrl("")}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-black/80"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center space-x-2 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                            {/* Скрит файл инпут */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center space-x-1.5 text-gray-500 hover:text-blue-#1d4ed8 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
                            >
                                <Image className="w-5 h-5 text-green-500" />
                                <span>Снимка</span>
                            </button>

                            <button
                                type="button"
                                className="flex items-center space-x-1.5 text-gray-500 hover:text-blue-#1d4ed8 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                            >
                                <Smile className="w-5 h-5 text-yellow-500" />
                                <span>Чувство</span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || uploading || (!content.trim() && !imageUrl)}
                            className="bg-blue-#1d4ed8 hover:bg-blue-#1d4ed8 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg font-medium transition text-sm ml-auto"
                        >
                            {loading ? "Публикуване..." : "Публикувай"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Списък с постове */}
            <div className="space-y-4">
                {posts.map((post) => {
                    const postLikes = post.likes || [];
                    const postComments = post.comments || [];
                    const isLiked =
                        currentUser && postLikes.some((like) => like.user_id === currentUser.id);
                    const isCommentsOpen = activeCommentPostId === post.id;

                    return (
                        <div
                            key={post.id}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-#1d4ed8 to-indigo-#1d4ed8 text-white flex items-center justify-center font-bold relative">
                                    {post.profiles?.avatar_url ? (
                                        <img
                                            src={post.profiles.avatar_url}
                                            alt={post.profiles.username}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl">
                                            {post.profiles?.username
                                                ? post.profiles.username[0].toUpperCase()
                                                : "U"}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                        {post.profiles?.username || "Анонимен потребител"}
                                    </h4>
                                    <p className="text-xs text-gray-400">
                                        {new Date(post.created_at).toLocaleDateString("bg-BG", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <p className="text-gray-800 text-sm whitespace-pre-line">{post.content}</p>

                            {post.image_url && (
                                <img
                                    src={post.image_url}
                                    alt="Post attachment"
                                    className="rounded-lg max-h-96 w-full object-cover"
                                />
                            )}

                            {/* Бутони за интеракция */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-gray-500">
                                <button
                                    onClick={() => handleToggleLike(post.id, postLikes)}
                                    className={`flex items-center space-x-1.5 transition ${isLiked ? "text-red-500 font-semibold" : "text-gray-500 hover:text-red-500"
                                        }`}
                                >
                                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current text-red-500" : ""}`} />
                                    <span>{postLikes.length > 0 ? postLikes.length : ""} Харесвам</span>
                                </button>

                                <button
                                    onClick={() =>
                                        setActiveCommentPostId(isCommentsOpen ? null : post.id)
                                    }
                                    className="flex items-center space-x-1.5 hover:text-blue-500 transition"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>
                                        {postComments.length > 0 ? postComments.length : ""} Коментирай
                                    </span>
                                </button>

                                <button className="flex items-center space-x-1.5 hover:text-blue-500 transition">
                                    <Share2 className="w-4 h-4" />
                                    <span>Сподели</span>
                                </button>
                            </div>

                            {/* Секция с коментари */}
                            {isCommentsOpen && (
                                <div className="pt-3 border-t border-gray-100 space-y-3">
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Напишете коментар..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleAddComment(post.id);
                                            }}
                                        />
                                        <button
                                            onClick={() => handleAddComment(post.id)}
                                            disabled={commentLoading || !commentText.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
                                        {postComments.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">
                                                Все още няма коментари. Бъдете първият!
                                            </p>
                                        ) : (
                                            postComments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    className="bg-gray-50 p-2.5 rounded-lg text-xs space-y-1"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-gray-800">
                                                            {comment.profiles?.username || "Потребител"}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px]">
                                                            {new Date(comment.created_at).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700">{comment.content}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}