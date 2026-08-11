import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PostCard from "./PostCard";
import { X } from "lucide-react";

export default function PostModal({ postId, currentUser, onClose }) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (postId) fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("posts")
                .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles (
            username,
            avatar_url
          )
        `)
                .eq("id", postId)
                .single();

            if (error) throw error;
            setPost(data);
        } catch (err) {
            console.error("Грешка при зареждане на публикацията:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-1.5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-4">
                    {loading ? (
                        <div className="py-12 text-center text-xs text-gray-400">
                            Зареждане на публикацията...
                        </div>
                    ) : post ? (
                        <PostCard
                            post={post}
                            currentUser={currentUser}
                            onPostDeleted={onClose}
                        />
                    ) : (
                        <div className="py-12 text-center text-xs text-gray-500">
                            Публикацията не беше намерена или е била изтрита.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}