import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function FollowingList({ currentUser, onStartChat }) {
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if (currentUser) {
            fetchFriends();
        }
    }, [currentUser]);

    const fetchFriends = async () => {
        // Вземаме само онези профили, които са следвани / приятели
        const { data: follows } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUser.id);

        if (follows && follows.length > 0) {
            const ids = follows.map((f) => f.following_id);
            const { data: profiles } = await supabase
                .from("profiles")
                .select("*")
                .in("id", ids);

            if (profiles) setFriends(profiles);
        } else {
            setFriends([]);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Приятели ({friends.length})
                </h3>
            </div>

            {friends.length === 0 ? (
                <p className="text-xs text-gray-400">Няма намерени приятели</p>
            ) : (
                <div className="space-y-3">
                    {friends.map((friend) => {
                        const nameToDisplay =
                            friend.full_name || friend.username || friend.email?.split("@")[0];

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
                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                        {nameToDisplay}
                                    </p>
                                </div>

                                {/* Бутон за отваряне на чат */}
                                {onStartChat && (
                                    <button
                                        onClick={() => onStartChat(friend)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                                        title="Отвори чат"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}