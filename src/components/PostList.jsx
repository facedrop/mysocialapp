import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PostCard from "./PostCard";
import { Globe, Users } from "lucide-react";

export default function PostList({ currentUser, searchQuery }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // 'all' или 'following'

    useEffect(() => {
        fetchPosts();
    }, [searchQuery, filter]);

    const fetchPosts = async () => {
        try {
            setLoading(true);

            let followedUserIds = [];
            if (filter === "following") {
                const { data: followData } = await supabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", currentUser.id);

                followedUserIds = (followData || []).map((f) => f.following_id);

                // Включваме и собствените си публикации, за да виждаме нашия фийд
                followedUserIds.push(currentUser.id);
            }

            let query = supabase
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
                .order("created_at", { ascending: false });

            if (filter === "following") {
                query = query.in("user_id", followedUserIds);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Търсене (ако има въведена дума в търсачката)
            let filtered = data || [];
            if (searchQuery && searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(
                    (post) =>
                        post.content?.toLowerCase().includes(q) ||
                        post.profiles?.username?.toLowerCase().includes(q)
                );
            }

            setPosts(filtered);
        } catch (err) {
            console.error("Грешка при извличане на публикациите:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Табове за филтриране */}
            <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex space-x-1 shadow-sm">
                <button
                    onClick={() => setFilter("all")}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${filter === "all"
                            ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                >
                    <Globe className="w-4 h-4" />
                    <span>Всички</span>
                </button>

                <button
                    onClick={() => setFilter("following")}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${filter === "following"
                            ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Последвани</span>
                </button>
            </div>

            {/* Списък с публикации */}
            {loading ? (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500 animate-pulse">Зареждане на фийда...</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-gray-500 text-sm">
                        {filter === "following"
                            ? "Все още няма публикации от хората, които следваш."
                            : "Няма намерени публикации."}
                    </p>
                </div>
            ) : (
                posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onPostDeleted={fetchPosts}
                    />
                ))
            )}
        </div>
    );
}