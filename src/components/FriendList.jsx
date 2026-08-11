import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { UserPlus, UserCheck, X } from "lucide-react";

export default function FriendList({ currentUser, onClose }) {
    const [users, setUsers] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsersAndFollows();
    }, [currentUser]);

    const fetchUsersAndFollows = async () => {
        try {
            setLoading(true);

            // 1. Вземаме всички профили освен текущия
            const { data: usersData, error: usersErr } = await supabase
                .from("profiles")
                .select("id, username, avatar_url, city")
                .neq("id", currentUser.id);

            if (usersErr) throw usersErr;

            // 2. Вземаме хората, които текущият потребител вече следва
            const { data: followsData, error: followsErr } = await supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", currentUser.id);

            if (followsErr) throw followsErr;

            const followedSet = new Set(followsData.map((f) => f.following_id));
            setFollowingIds(followedSet);
            setUsers(usersData || []);
        } catch (err) {
            console.error("Грешка при зареждане на потребители:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = async (targetUserId) => {
        const isFollowing = followingIds.has(targetUserId);

        // Локален ъпдейт за бърз UI отговор
        const updated = new Set(followingIds);
        if (isFollowing) {
            updated.delete(targetUserId);
        } else {
            updated.add(targetUserId);
        }
        setFollowingIds(updated);

        try {
            if (isFollowing) {
                // Премахване на последването
                await supabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", currentUser.id)
                    .eq("following_id", targetUserId);
            } else {
                // Добавяне на последване
                await supabase
                    .from("follows")
                    .insert([{ follower_id: currentUser.id, following_id: targetUserId }]);
            }
        } catch (err) {
            console.error("Грешка при промяна на последването:", err.message);
            // Връщаме предишното състояние при грешка
            fetchUsersAndFollows();
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Потребители в мрежата
                </h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {loading ? (
                <p className="text-xs text-gray-500 py-2">Зареждане...</p>
            ) : users.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">Няма намерени други потребители.</p>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {users.map((user) => {
                        const isFollowing = followingIds.has(user.id);
                        return (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
                            >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
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
                                    onClick={() => toggleFollow(user.id)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 shrink-0 transition ${isFollowing
                                            ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Следваш</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span>Последвай</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}