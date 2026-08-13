import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// Списък с поддържаните реакции и техните емоджита
const REACTIONS = [
    { type: "like", label: "Харесва ми", emoji: "👍", color: "text-blue-500" },
    { type: "love", label: "Любов", emoji: "❤️", color: "text-rose-500" },
    { type: "haha", label: "Ха-ха", emoji: "😆", color: "text-amber-500" },
    { type: "wow", label: "Уау", emoji: "😮", color: "text-amber-500" },
    { type: "sad", label: "Тъжно", emoji: "😢", color: "text-amber-500" },
    { type: "angry", label: "Ядосан", emoji: "😡", color: "text-orange-600" },
];

export default function PostList({ currentUser, searchQuery, refreshTrigger }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePickerId, setActivePickerId] = useState(null); // Кой пост има отворено меню за реакции

    useEffect(() => {
        fetchPosts();
    }, [refreshTrigger, searchQuery]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("posts")
                .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          likes (user_id, reaction_type)
        `)
                .order("created_at", { ascending: false });

            if (searchQuery) {
                query = query.ilike("content", `%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Грешка при зареждане на публикации:", error);
            } else {
                const formattedPosts = (data || []).map((post) => {
                    const userLike = post.likes?.find(
                        (like) => like.user_id === currentUser?.id
                    );
                    return {
                        ...post,
                        likes_count: post.likes ? post.likes.length : 0,
                        user_reaction: userLike ? userLike.reaction_type || "like" : null,
                    };
                });
                setPosts(formattedPosts);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Обработка на реакция без презареждане на скрола
    const handleSelectReaction = async (postId, currentReaction, selectedType) => {
        if (!currentUser) return;

        setActivePickerId(null); // Затваряме менюто с емоджита

        const isRemoving = currentReaction === selectedType;
        const newReaction = isRemoving ? null : selectedType;

        // 1. Оптимистично обновяване на локалното състояние (без скрол!)
        setPosts((prevPosts) =>
            prevPosts.map((post) => {
                if (post.id === postId) {
                    let newCount = post.likes_count;
                    if (!currentReaction && newReaction) newCount += 1;
                    if (currentReaction && !newReaction) newCount -= 1;

                    return {
                        ...post,
                        user_reaction: newReaction,
                        likes_count: Math.max(0, newCount),
                    };
                }
                return post;
            })
        );

        // 2. Изпращане към Supabase
        try {
            if (isRemoving) {
                // Премахване на реакцията
                await supabase
                    .from("likes")
                    .delete()
                    .eq("post_id", postId)
                    .eq("user_id", currentUser.id);
            } else {
                // Добавяне или обновяване на реакцията
                await supabase
                    .from("likes")
                    .upsert(
                        {
                            post_id: postId,
                            user_id: currentUser.id,
                            reaction_type: selectedType,
                        },
                        { onConflict: "post_id,user_id" }
                    );
            }
        } catch (err) {
            console.error("Грешка при запис на реакция:", err);
            fetchPosts(); // Резервен вариант при грешка
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-xs text-gray-400">
                Зареждане на публикации...
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-xs text-gray-400">
                Няма намерени публикации.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => {
                const author = post.profiles || {};
                const activeReactionObj = REACTIONS.find(
                    (r) => r.type === post.user_reaction
                );

                return (
                    <div
                        key={post.id}
                        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-3 relative"
                    >
                        {/* Заглавна част на поста */}
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                                {author.avatar_url ? (
                                    <img
                                        src={author.avatar_url}
                                        alt=""
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    (author.username || author.full_name || "U")[0].toUpperCase()
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-xs text-gray-800">
                                    {author.full_name || author.username || "Анонимен"}
                                </p>
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

                        {/* Съдържание */}
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                            {post.content}
                        </p>

                        {/* Изображение към поста (ако има) */}
                        {post.image_url && (
                            <img
                                src={post.image_url}
                                alt="Post content"
                                className="rounded-xl w-full max-h-96 object-cover"
                            />
                        )}

                        {/* БУТОНИ И ЛЕНТА С РЕАКЦИИ */}
                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs relative">
                            <div className="relative">

                                {/* Лента с емоджита при hover/натискане */}
                                {activePickerId === post.id && (
                                    <div
                                        onMouseLeave={() => setActivePickerId(null)}
                                        className="absolute bottom-full mb-2 left-0 bg-white shadow-xl border border-gray-100 rounded-full px-3 py-1.5 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 z-10"
                                    >
                                        {REACTIONS.map((r) => (
                                            <button
                                                key={r.type}
                                                onClick={() =>
                                                    handleSelectReaction(post.id, post.user_reaction, r.type)
                                                }
                                                className="text-lg hover:scale-125 transition-transform p-1"
                                                title={r.label}
                                            >
                                                {r.emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Основен бутон за реакция */}
                                <button
                                    onMouseEnter={() => setActivePickerId(post.id)}
                                    onClick={() =>
                                        handleSelectReaction(
                                            post.id,
                                            post.user_reaction,
                                            post.user_reaction || "like"
                                        )
                                    }
                                    className={`flex items-center space-x-1.5 font-medium transition-colors ${activeReactionObj
                                            ? activeReactionObj.color
                                            : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <span className="text-base">
                                        {activeReactionObj ? activeReactionObj.emoji : "👍"}
                                    </span>
                                    <span>
                                        {activeReactionObj ? activeReactionObj.label : "Харесва ми"}
                                    </span>
                                </button>
                            </div>

                            {/* Брой общи реакции */}
                            <div className="text-[11px] text-gray-400 font-medium">
                                {post.likes_count > 0 && `${post.likes_count} реакции`}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}