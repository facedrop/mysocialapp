import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function FriendList({ currentUser, onStartChat }) {
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if (currentUser) {
            fetchFriends();
        }
    }, [currentUser]);

    const fetchFriends = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .neq("id", currentUser.id);

        if (!error && data) {
            setFriends(data);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                Приятели ({friends.length})
            </h3>

            <div className="space-y-3">
                {friends.map((friend) => {
                    const nameToDisplay =
                        friend.full_name ||
                        friend.username ||
                        friend.email?.split("@")[0] ||
                        "Потребител";

                    return (
                        <div key={friend.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                                    {friend.avatar_url ? (
                                        <img
                                            src={friend.avatar_url}
                                            alt={nameToDisplay}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        nameToDisplay[0].toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                        {nameToDisplay}
                                    </p>
                                </div>
                            </div>

                            {/* Бутон за започване на чат */}
                            <button
                                onClick={() => onStartChat && onStartChat(friend)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                                title="Започни чат"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}