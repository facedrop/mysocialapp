import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Heart, MessageCircle, Trash2, Send } from "lucide-react";

export default function PostCard({ post, currentUser, onPostDeleted }) {
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        fetchLikes();
        fetchCommentsCount();

        // 1. Realtime абонамент за лайкове
        const likesChannel = supabase
            .channel(`post_likes:${post.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "likes",
                    filter: `post_id=eq.${post.id}`,
                },
                () => {
                    fetchLikes(); // Обновяваме броя и състоянието при промяна
                }
            )
            .subscribe();

        // 2. Realtime абонамент за коментари
        const commentsChannel = supabase
            .channel(`post_comments:${post.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "comments",
                    filter: `post_id=eq.${post.id}`,
                },
                (payload) => {
                    fetchCommentsCount(); // Обновяваме брояча

                    // Ако списъкът с коментари е отворен и има нов коментар, го презареждаме
                    if (payload.eventType === "INSERT") {
                        fetchComments();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(likesChannel);
            supabase.removeChannel(commentsChannel);
        };
    }, [post.id]);

    // Извличане на броя харесвания
    const fetchLikes = async () => {
        try {
            const { data, error } = await supabase
                .from("likes")
                .select("user_id")
                .eq("post_id", post.id);

            if (error) throw error;

            setLikesCount(data.length);
            setIsLiked(data.some((like) => like.user_id === currentUser.id));
        } catch (err) {
            console.error("Грешка при зареждане на лайкове:", err.message);
        }
    };

    // Извличане на броя коментари
    const fetchCommentsCount = async () => {
        try {
            const { count, error } = await supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id);

            if (error) throw error;

            setCommentsCount(count || 0);
        } catch (err) {
            console.error("Грешка при зареждане броя коментари:", err.message);
        }
    };

    // Превключване на харесване
    const handleLikeToggle = async () => {
        try {
            if (isLiked) {
                await supabase
                    .from("likes")
                    .delete()
                    .eq("post_id", post.id)
                    .eq("user_id", currentUser.id);
            } else {
                await supabase.from("likes").insert([
                    { post_id: post.id, user_id: currentUser.id },
                ]);

                // Известие за лайк
                if (post.user_id !== currentUser.id) {
                    await supabase.from("notifications").insert([
                        {
                            user_id: post.user_id,
                            actor_id: currentUser.id,
                            type: "like",
                            post_id: post.id,
                        },
                    ]);
                }
            }
        } catch (err) {
            console.error("Грешка при лайкване:", err.message);
        }
    };

    // Зареждане на самите коментари
    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const { data, error } = await supabase
                .from("comments")
                .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            username,
            avatar_url
          )
        `)
                .eq("post_id", post.id)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setComments(data || []);
            setCommentsCount(data?.length || 0);
        } catch (err) {
            console.error("Грешка при зареждане на коментари:", err.message);
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleCommentsSection = () => {
        if (!showComments) {
            fetchComments();
        }
        setShowComments(!showComments);
    };

    // Добавяне на нов коментар
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const content = newComment.trim();
        setNewComment("");

        try {
            const { error } = await supabase.from("comments").insert([
                {
                    post_id: post.id,
                    user_id: currentUser.id,
                    content: content,
                },
            ]);

            if (error) throw error;

            // Известие за коментар
            if (post.user_id !== currentUser.id) {
                await supabase.from("notifications").insert([
                    {
                        user_id: post.user_id,
                        actor_id: currentUser.id,
                        type: "comment",
                        post_id: post.id,
                    },
                ]);
            }
        } catch (err) {
            console.error("Грешка при коментиране:", err.message);
        }
    };

    // Изтриване на публикация
    const handleDeletePost = async () => {
        if (!window.confirm("Сигурен ли си, че искаш да изтриеш тази публикация?")) return;

        try {
            const { error } = await supabase
                .from("posts")
                .delete()
                .eq("id", post.id);

            if (error) throw error;
            if (onPostDeleted) onPostDeleted(post.id);
        } catch (err) {
            console.error("Грешка при изтриване:", err.message);
        }
    };

    const isOwner = post.user_id === currentUser.id;

    return (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 transition hover:shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                        {post.profiles?.avatar_url ? (
                            <img
                                src={post.profiles.avatar_url}
                                alt={post.profiles.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>
                                {post.profiles?.username ? post.profiles.username[0].toUpperCase() : "U"}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-xs text-gray-900 leading-none">
                            {post.profiles?.username || "Анонимен"}
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(post.created_at).toLocaleString("bg-BG", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                </div>

                {isOwner && (
                    <button
                        onClick={handleDeletePost}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                        title="Изтрий публикацията"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Съдържание */}
            <p className="text-xs text-gray-800 leading-relaxed mb-3 whitespace-pre-line">
                {post.content}
            </p>

            {/* Изображение (ако има) */}
            {post.image_url && (
                <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 max-h-96">
                    <img
                        src={post.image_url}
                        alt="Post content"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Бутони за действия (Лайкове и Коментари) */}
            <div className="flex items-center space-x-4 pt-2 border-t border-gray-50 text-xs">
                <button
                    onClick={handleLikeToggle}
                    className={`flex items-center space-x-1.5 font-medium transition ${isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                        }`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
                    <span>{likesCount}</span>
                </button>

                <button
                    onClick={toggleCommentsSection}
                    className="flex items-center space-x-1.5 text-gray-500 hover:text-blue-600 font-medium transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>{commentsCount}</span>
                </button>
            </div>

            {/* Секция с коментари */}
            {showComments && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {loadingComments ? (
                            <p className="text-[11px] text-gray-400 py-1">Зареждане на коментарите...</p>
                        ) : comments.length === 0 ? (
                            <p className="text-[11px] text-gray-400 py-1">Все още няма коментари.</p>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="flex items-start space-x-2 text-xs bg-gray-50 p-2 rounded-xl">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                                        {c.profiles?.avatar_url ? (
                                            <img
                                                src={c.profiles.avatar_url}
                                                alt={c.profiles.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{c.profiles?.username ? c.profiles.username[0].toUpperCase() : "U"}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-bold text-gray-900 mr-1.5">
                                            {c.profiles?.username || "Анонимен"}
                                        </span>
                                        <span className="text-gray-700">{c.content}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Напиши коментар..."
                            className="flex-1 bg-gray-100 focus:bg-white text-xs text-gray-800 px-3 py-1.5 rounded-full border border-transparent focus:border-blue-500 focus:outline-none transition"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-40 transition shrink-0"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}