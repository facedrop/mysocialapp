import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import UserHoverCard from "./UserHoverCard";
import { Heart, MessageCircle, Share2, Trash2, Send } from "lucide-react";

export default function PostList({ currentUser, searchQuery }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentInputs, setCommentInputs] = useState({});
    const [showComments, setShowComments] = useState({});

    useEffect(() => {
        fetchPosts();
    }, [searchQuery]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("posts")
                .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles:user_id (id, username, avatar_url, city, birth_date),
          likes (user_id),
          comments (
            id,
            content,
            created_at,
            user_id,
            profiles:user_id (id, username, avatar_url)
          )
        `)
                .order("created_at", { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            let filteredData = data || [];

            // Филтриране по търсене (ако има такова)
            if (searchQuery && searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                filteredData = filteredData.filter(
                    (post) =>
                        post.content?.toLowerCase().includes(q) ||
                        post.profiles?.username?.toLowerCase().includes(q)
                );
            }

            setPosts(filteredData);
        } catch (err) {
            console.error("Грешка при зареждане на публикациите:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId, currentLikes) => {
        const hasLiked = currentLikes.some((like) => like.user_id === currentUser.id);

        if (hasLiked) {
            await supabase
                .from("likes")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", currentUser.id);
        } else {
            await supabase
                .from("likes")
                .insert({ post_id: postId, user_id: currentUser.id });
        }

        fetchPosts();
    };

    const handleAddComment = async (postId, e) => {
        e.preventDefault();
        const commentText = commentInputs[postId];
        if (!commentText || !commentText.trim()) return;

        try {
            const { error } = await supabase.from("comments").insert({
                post_id: postId,
                user_id: currentUser.id,
                content: commentText.trim(),
            });

            if (error) throw error;

            setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
            fetchPosts();
        } catch (err) {
            console.error("Грешка при добавяне на коментар:", err.message);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Сигурни ли сте, че искате да изтриете тази публикация?")) return;

        try {
            const { error } = await supabase.from("posts").delete().eq("id", postId);
            if (error) throw error;
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch (err) {
            console.error("Грешка при изтриване:", err.message);
        }
    };

    const toggleComments = (postId) => {
        setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-center text-xs text-gray-400">
                Зареждане на публикациите...
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-center text-xs text-gray-500">
                Няма намерени публикации.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => {
                const isOwner = post.user_id === currentUser.id;
                const hasLiked = post.likes?.some((l) => l.user_id === currentUser.id);
                const likesCount = post.likes?.length || 0;
                const commentsCount = post.comments?.length || 0;

                return (
                    <div
                        key={post.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3"
                    >
                        {/* Header на публикацията */}
                        <div className="flex items-center justify-between">

                            {/* ХОВЪР КАРТИЧКА ВЪРХУ АВАТОРА И ИМЕТО */}
                            <UserHoverCard userId={post.user_id}>
                                <div className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                        {post.profiles?.avatar_url ? (
                                            <img
                                                src={post.profiles.avatar_url}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>
                                                {post.profiles?.username
                                                    ? post.profiles.username[0].toUpperCase()
                                                    : "U"}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition">
                                            {post.profiles?.username || "Потребител"}
                                        </h4>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(post.created_at).toLocaleDateString("bg-BG", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </UserHoverCard>

                            {isOwner && (
                                <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                    title="Изтрий публикацията"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Съдържание */}
                        {post.content && (
                            <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                                {post.content}
                            </p>
                        )}

                        {/* Снимка (ако има) */}
                        {post.image_url && (
                            <div className="rounded-xl overflow-hidden border border-gray-100 max-h-96 bg-black/5">
                                <img
                                    src={post.image_url}
                                    alt="Post content"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Бутони за взаимодействие */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => handleLike(post.id, post.likes || [])}
                                    className={`flex items-center space-x-1.5 transition cursor-pointer ${hasLiked ? "text-red-500 font-bold" : "hover:text-red-500"
                                        }`}
                                >
                                    <Heart className={`w-4 h-4 ${hasLiked ? "fill-red-500" : ""}`} />
                                    <span>{likesCount}</span>
                                </button>

                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="flex items-center space-x-1.5 hover:text-blue-600 transition cursor-pointer"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{commentsCount}</span>
                                </button>
                            </div>

                            <button className="hover:text-gray-700 p-1 rounded-lg transition cursor-pointer">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Коментари Секция */}
                        {showComments[post.id] && (
                            <div className="pt-3 border-t border-gray-100 space-y-3">
                                {/* Списък с коментари */}
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {post.comments?.map((comment) => (
                                        <div key={comment.id} className="flex items-start space-x-2 text-xs">
                                            {/* Картичка при ховър и за авторите на коментари */}
                                            <UserHoverCard userId={comment.user_id}>
                                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0 mt-0.5 cursor-pointer">
                                                    {comment.profiles?.avatar_url ? (
                                                        <img
                                                            src={comment.profiles.avatar_url}
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>
                                                            {comment.profiles?.username
                                                                ? comment.profiles.username[0].toUpperCase()
                                                                : "U"}
                                                        </span>
                                                    )}
                                                </div>
                                            </UserHoverCard>

                                            <div className="flex-1 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                <UserHoverCard userId={comment.user_id}>
                                                    <span className="font-bold text-gray-900 cursor-pointer hover:underline">
                                                        {comment.profiles?.username || "Потребител"}
                                                    </span>
                                                </UserHoverCard>
                                                <p className="text-gray-700 mt-0.5">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Форма за нов коментар */}
                                <form
                                    onSubmit={(e) => handleAddComment(post.id, e)}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={commentInputs[post.id] || ""}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                                ...prev,
                                                [post.id]: e.target.value,
                                            }))
                                        }
                                        placeholder="Напиши коментар..."
                                        className="flex-1 bg-gray-50 text-xs px-3 py-1.5 rounded-full border border-gray-200 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                                    />
                                    <button
                                        type="submit"
                                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}