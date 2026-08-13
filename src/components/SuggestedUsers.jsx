import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import UserHoverCard from "./UserHoverCard";
import { UserPlus, UserCheck } from "lucide-react";

export default function SuggestedUsers({ currentUser, onFollowToggle }) {
    const [users, setUsers] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchSuggestedUsers();
        }
    }, [currentUser]);

    const fetchSuggestedUsers = async () => {
        try {
            // 1. Вземаме списъка с вече последваните
            const { data: follows } = await supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", currentUser.id);

            const followedSet = new Set(follows?.map((f) => f.following_id) || []);
            setFollowingIds(followedSet);

            // 2. Вземаме другите потребители
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, username, avatar_url, city, birth_date")
                .neq("id", currentUser.id)
                .limit(5);

            if (profiles) setUsers(profiles);
        } catch (err) {
            console.error("Грешка при зареждане на предложения за приятели:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetUserId) => {
        const isFollowing = followingIds.has(targetUserId);

        if (isFollowing) {
            await supabase
                .from("follows")
                .delete()
                .eq("follower_id", currentUser.id)
                .eq("following_id", targetUserId);

            setFollowingIds((prev) => {
                const next = new Set(prev);
                next.delete(targetUserId);
                return next;
            });
        } else {
            await supabase
                .from("follows")
                .insert({ follower_id: currentUser.id, following_id: targetUserId });

            setFollowingIds((prev) => new Set(prev).add(targetUserId));
        }

        if (onFollowToggle) onFollowToggle();
    };

    if (loading) return null;

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Предложения за вас
            </h3>

            <div className="space-y-2.5">
                {users.map((user) => {
                    const isFollowing = followingIds.has(user.id);

                    return (
                        <div
                            key={user.id}
                            className="flex items-center justify-between gap-2"
                        >
                            {/* При минаване с мишката върху снимката/името излиза картичката */}
                            <UserHoverCard userId={user.id}>
                                <div className="flex items-center space-x-2.5 cursor-pointer group">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{user.username ? user.username[0].toUpperCase() : "U"}</span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition truncate">
                                            {user.username || "Потребител"}
                                        </p>
                                    </div>
                                </div>
                            </UserHoverCard>

                            <button
                                onClick={() => handleFollow(user.id)}
                                className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${isFollowing
                                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    }`}
                                title={isFollowing ? "Последван" : "Последвай"}
                            >
                                {isFollowing ? (
                                    <UserCheck className="w-4 h-4" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}