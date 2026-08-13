import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import UserHoverCard from "./UserHoverCard";
import { MessageCircle, Users } from "lucide-react";

export default function FollowingList({ currentUser, refreshTrigger, onOpenChat }) {
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchFollowing();
        }
    }, [currentUser, refreshTrigger]);

    const fetchFollowing = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("follows")
                .select(`
          following_id,
          profiles:following_id (id, username, avatar_url, city, birth_date)
        `)
                .eq("follower_id", currentUser.id);

            if (error) throw error;

            const profilesList = data ? data.map((item) => item.profiles) : [];
            setFollowing(profilesList);
        } catch (err) {
            console.error("Грешка при зареждане на следваните потребители:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#1d4ed8]" />
                    <span>Приятели ({following.length})</span>
                </h3>
            </div>

            {loading ? (
                <div className="text-center py-3 text-xs text-gray-400">
                    Зареждане...
                </div>
            ) : following.length === 0 ? (
                <div className="text-center py-3 text-xs text-gray-400">
                    Все още нямате последвани приятели.
                </div>
            ) : (
                <div className="space-y-1.5">
                    {following.map((friend) => (
                        <div
                            key={friend.id}
                            className="flex items-center justify-between gap-2 p-1.5 hover:bg-gray-50 rounded-xl transition"
                        >
                            {/* Подаваме position="bottom", за да се отваря надолу и да не се реже */}
                            <UserHoverCard userId={friend.id} position="bottom">
                                <div className="flex items-center space-x-2.5 cursor-pointer group">
                                    <div className="w-8 h-8 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                        {friend.avatar_url ? (
                                            <img
                                                src={friend.avatar_url}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>
                                                {friend.username ? friend.username[0].toUpperCase() : "U"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-semibold text-gray-800 group-hover:text-[#1d4ed8] transition truncate">
                                            {friend.username || "Потребител"}
                                        </p>
                                    </div>
                                </div>
                            </UserHoverCard>

                            {onOpenChat && (
                                <button
                                    onClick={() => onOpenChat(friend)}
                                    className="p-1.5 text-gray-400 hover:text-[#1d4ed8] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Изпрати съобщение"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}