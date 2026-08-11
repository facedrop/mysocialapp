import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { UserPlus, Sparkles } from "lucide-react";

export default function SuggestedUsers({ currentUser, onFollowToggle }) {
    const [suggested, setSuggested] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuggested();
    }, [currentUser]);

    const fetchSuggested = async () => {
        try {
            setLoading(true);

            // 1. Вземаме списъка с хората, които вече следваме
            const { data: followData } = await supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", currentUser.id);

            const followedIds = (followData || []).map((f) => f.following_id);
            followedIds.push(currentUser.id); // изключваме и самия себе си

            // 2. Вземаме потребители, които НЕ следваме
            const { data: usersData, error } = await supabase
                .from("profiles")
                .select("id, username, avatar_url, city")
                .not("id", "in", `(${followedIds.join(",")})`)
                .limit(10);

            if (error) throw error;

            setSuggested(usersData || []);
        } catch (err) {
            console.error("Грешка при зареждане на предложения за приятели:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetUserId) => {
        try {
            // Премахваме моментално от предложенията
            setSuggested((prev) => prev.filter((u) => u.id !== targetUserId));

            await supabase
                .from("follows")
                .insert([{ follower_id: currentUser.id, following_id: targetUserId }]);

            // Уведомяваме родителския компонент, че има ново последване
            if (onFollowToggle) onFollowToggle();
        } catch (err) {
            console.error("Грешка при последване:", err.message);
            fetchSuggested();
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Хора, които може да познаваш
                </h2>
            </div>

            {loading ? (
                <p className="text-xs text-gray-400 py-2">Зареждане...</p>
            ) : suggested.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Няма нови предложения за момента.</p>
            ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {suggested.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center space-x-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{user.username ? user.username[0].toUpperCase() : "U"}</span>
                                    )}
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                        {user.username || "Анонимен"}
                                    </p>
                                    {user.city && (
                                        <p className="text-[10px] text-gray-400 truncate">{user.city}</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleFollow(user.id)}
                                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-700 transition shrink-0 flex items-center space-x-1"
                            >
                                <UserPlus className="w-3 h-3" />
                                <span>Последвай</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}