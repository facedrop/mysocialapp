import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Send, Trash2, Loader2 } from "lucide-react";

export default function CommentSection({ postId, currentUser }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);

            // Извличаме коментарите с данните от profiles
            const { data, error } = await supabase
                .from("comments")
                .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (username, avatar_url)
        `)
                .eq("post_id", postId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (err) {
            console.error("Грешка при зареждане на коментарите:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);

            const { data, error } = await supabase
                .from("comments")
                .insert([
                    {
                        post_id: postId,
                        user_id: currentUser.id,
                        content: newComment.trim(),
                    },
                ])
                .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (username, avatar_url)
        `);

            if (error) throw error;

            // Ако записът е успешен, добавяме го веднага към списъка
            if (data && data.length > 0) {
                setComments((prev) => [...prev, data[0]]);
            } else {
                fetchComments();
            }

            setNewComment("");
            if (onCommentAdded) onCommentAdded();
        } catch (err) {
            console.error("Грешка при запис на коментар:", err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId)
                .eq("user_id", currentUser.id);

            if (error) throw error;

            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            console.error("Грешка при изтриване на коментар:", err.message);
        }
    };

    return (
        <div className="pt-3 border-t border-gray-100 space-y-3">
            {/* Списък с коментари */}
            {loading ? (
                <div className="flex justify-center py-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                </div>
            ) : comments.length === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-1">
                    Все още няма коментари. Бъди първият!
                </p>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {comments.map((comment) => {
                        const author = comment.profiles || {};
                        const isOwner = comment.user_id === currentUser.id;

                        return (
                            <div key={comment.id} className="flex space-x-2 text-xs group">
                                <div className="w-6 h-6 rounded-full bg-blue-#1d4ed8 text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                                    {author.avatar_url ? (
                                        <img src={author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{(author.username || "U")[0].toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="flex-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800 text-[11px]">
                                            {author.username || "Потребител"}
                                        </span>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                                title="Изтрий коментара"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-700 text-xs mt-0.5 break-words">{comment.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Форма за нов коментар */}
            <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Напиши коментар..."
                    className="flex-1 bg-gray-50 focus:bg-white text-xs text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-#1d4ed8 focus:outline-none transition"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-blue-#1d4ed8 hover:bg-blue-#1d4ed8 disabled:opacity-50 text-white p-1.5 rounded-lg transition cursor-pointer"
                >
                    {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Send className="w-3.5 h-3.5" />
                    )}
                </button>
            </form>
        </div>
    );
}