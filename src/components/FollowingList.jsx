import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { UserCheck, Users, MessageSquare } from "lucide-react";

export default function FollowingList({ currentUser, refreshTrigger, onOpenChat }) {
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowing();
    }, [currentUser, refreshTrigger]);

    const fetchFollowing = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("follows")
                .select(`
          following_id,
          profiles:following_id (
            id,
            username,
            avatar_url,
            city
          )
        `)
                .eq("follower_id", currentUser.id);

            if (error) throw error;

            const followedProfiles = (data || [])
                .map((f) => f.profiles)
                .filter(Boolean);

            setFollowing(followedProfiles);
        } catch (err) {
            console.error("Грешка при зареждане на следваните потребители:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (targetUserId) => {
        try {
            setFollowing((prev) => prev.filter((user) => user.id !== targetUserId));
            await supabase
                .from("follows")
                .delete()
                .eq("follower_id", currentUser.id)
                .eq("following_id", targetUserId);
        } catch (err) {
            console.error("Грешка при отследване:", err.message);
            fetchFollowing();
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Приятели ({following.length})
                </h2>
            </div>

            {loading ? (
                <p className="text-xs text-gray-400 py-2">Зареждане...</p>
            ) : following.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Все още не следваш никого.</p>
            ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {following.map((user) => (
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

                            {/* Бутони: Съобщение и Отследвай */}
                            <div className="flex items-center space-x-1 shrink-0">
                                <button
                                    onClick={() => onOpenChat && onOpenChat(user)}
                                    className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                                    title="Изпрати съобщение"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    onClick={() => handleUnfollow(user.id)}
                                    title="Отследвай"
                                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition flex items-center space-x-1"
                                >
                                    <UserCheck className="w-3 h-3 text-green-600" />
                                    <span className="hidden sm:inline">Следваш</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}