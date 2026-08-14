import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
    const [activePickerId, setActivePickerId] = useState(null);

    // Коментари състояния
    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const [commentsMap, setCommentsMap] = useState({}); // { postId: [comments] }
    const [commentInputs, setCommentInputs] = useState({}); // { postId: "text" }
    const [submittingComment, setSubmittingComment] = useState(false);

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
          likes (user_id, reaction_type),
          comments (id)
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
                        comments_count: post.comments ? post.comments.length : 0,
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

    // Реакции
    const handleSelectReaction = async (postId, currentReaction, selectedType) => {
        if (!currentUser) return;
        setActivePickerId(null);

        const isRemoving = currentReaction === selectedType;
        const newReaction = isRemoving ? null : selectedType;

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

        try {
            if (isRemoving) {
                await supabase
                    .from("likes")
                    .delete()
                    .eq("post_id", postId)
                    .eq("user_id", currentUser.id);
            } else {
                await supabase.from("likes").upsert(
                    {
                        post_id: postId,
                        user_id: currentUser.id,
                        reaction_type: selectedType,
                    },
                    { onConflict: "post_id,user_id" }
                );
            }
        } catch (err) {
            console.error("Грешка при реакция:", err);
            fetchPosts();
        }
    };

    // Зареждане на коментари за конкретен пост
    const toggleComments = async (postId) => {
        if (openCommentsPostId === postId) {
            setOpenCommentsPostId(null);
            return;
        }

        setOpenCommentsPostId(postId);

        if (!commentsMap[postId]) {
            try {
                const { data, error } = await supabase
                    .from("comments")
                    .select("*, profiles(id, username, full_name, avatar_url)")
                    .eq("post_id", postId)
                    .order("created_at", { ascending: true });

                if (!error) {
                    setCommentsMap((prev) => ({ ...prev, [postId]: data || [] }));
                }
            } catch (err) {
                console.error("Грешка при зареждане на коментари:", err);
            }
        }
    };

    // Изпращане на коментар
    const handleAddComment = async (postId) => {
        const text = commentInputs[postId]?.trim();
        if (!text || !currentUser) return;

        setSubmittingComment(true);

        try {
            const { data, error } = await supabase
                .from("comments")
                .insert({
                    post_id: postId,
                    user_id: currentUser.id,
                    content: text,
                })
                .select("*, profiles(id, username, full_name, avatar_url)")
                .single();

            if (!error && data) {
                setCommentsMap((prev) => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), data],
                }));

                setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

                setPosts((prevPosts) =>
                    prevPosts.map((p) =>
                        p.id === postId
                            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
                            : p
                    )
                );
            }
        } catch (err) {
            console.error("Грешка при добавяне на коментар:", err);
        } finally {
            setSubmittingComment(false);
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
                const postComments = commentsMap[post.id] || [];
                const isCommentsOpen = openCommentsPostId === post.id;

                return (
                    <div
                        key={post.id}
                        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-3 relative"
                    >
                        {/* Автор */}
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

                        {/* Изображение */}
                        {post.image_url && (
                            <img
                                src={post.image_url}
                                alt="Post content"
                                className="rounded-xl w-full max-h-96 object-cover"
                            />
                        )}

                        {/* БУТОНИ И РЕАКЦИИ */}
                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs relative">
                            <div className="flex items-center space-x-4">
                                {/* Реакция */}
                                <div className="relative">
                                    {activePickerId === post.id && (
                                        <div
                                            onMouseLeave={() => setActivePickerId(null)}
                                            className="absolute bottom-full mb-2 left-0 bg-white shadow-xl border border-gray-100 rounded-full px-3 py-1.5 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 z-10"
                                        >
                                            {REACTIONS.map((r) => (
                                                <button
                                                    key={r.type}
                                                    onClick={() =>
                                                        handleSelectReaction(
                                                            post.id,
                                                            post.user_reaction,
                                                            r.type
                                                        )
                                                    }
                                                    className="text-lg hover:scale-125 transition-transform p-1"
                                                    title={r.label}
                                                >
                                                    {r.emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}

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

                                {/* Бутон за коментари */}
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="flex items-center space-x-1 font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                >
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
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                    <span>Коментари</span>
                                </button>
                            </div>

                            {/* Бройки */}
                            <div className="text-[11px] text-gray-400 font-medium space-x-2">
                                {post.likes_count > 0 && <span>{post.likes_count} реакции</span>}
                                {post.comments_count > 0 && (
                                    <span>• {post.comments_count} коментара</span>
                                )}
                            </div>
                        </div>

                        {/* СЕКЦИЯ С КОМЕНТАРИ (Сгъваема) */}
                        {isCommentsOpen && (
                            <div className="pt-3 border-t border-gray-100 space-y-3">
                                {/* Списък с коментари */}
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {postComments.length === 0 ? (
                                        <p className="text-[11px] text-gray-400 italic">
                                            Все още няма коментари. Bъведете първия!
                                        </p>
                                    ) : (
                                        postComments.map((comment) => {
                                            const cAuthor = comment.profiles || {};
                                            return (
                                                <div
                                                    key={comment.id}
                                                    className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                                        {cAuthor.avatar_url ? (
                                                            <img
                                                                src={cAuthor.avatar_url}
                                                                alt=""
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            (cAuthor.username || cAuthor.full_name || "U")[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-semibold text-[11px] text-gray-800">
                                                                {cAuthor.full_name || cAuthor.username || "Потребител"}
                                                            </p>
                                                            <span className="text-[9px] text-gray-400">
                                                                {new Date(comment.created_at).toLocaleDateString("bg-BG", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 leading-snug mt-0.5">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Форма за писане на нов коментар */}
                                <div className="flex items-center space-x-2 pt-1">
                                    <input
                                        type="text"
                                        value={commentInputs[post.id] || ""}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                                ...prev,
                                                [post.id]: e.target.value,
                                            }))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAddComment(post.id);
                                        }}
                                        placeholder="Напиши коментар..."
                                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={() => handleAddComment(post.id)}
                                        disabled={submittingComment || !commentInputs[post.id]?.trim()}
                                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
                                    >
                                        Изпрати
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}