import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function ReelsFeed({ currentUser }) {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReels();
    }, []);

    const fetchReels = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("reels")
            .select("*, profiles(full_name, username, avatar_url)")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setReels(data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh] text-gray-500">
                Зареждане на Reels...
            </div>
        );
    }

    if (reels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-4">
                <p className="text-gray-500 text-sm mb-4">Все още няма качени видеа.</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center w-full">
            {/* TikTok Style Vertical Container */}
            <div className="w-full max-w-sm h-[80vh] overflow-y-scroll snap-y snap-mandatory rounded-3xl bg-black shadow-2xl relative scrollbar-hide">
                {reels.map((reel) => (
                    <ReelItem key={reel.id} reel={reel} currentUser={currentUser} />
                ))}
            </div>
        </div>
    );
}

function ReelItem({ reel, currentUser }) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [liked, setLiked] = useState(false);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const authorName =
        reel.profiles?.full_name || reel.profiles?.username || "Потребител";

    return (
        <div className="w-full h-full snap-start relative flex-shrink-0 bg-black flex items-center justify-center">
            {/* Видео контейнер */}
            <video
                ref={videoRef}
                src={reel.video_url}
                className="w-full h-full object-cover cursor-pointer"
                loop
                autoPlay
                playsInline
                onClick={togglePlay}
            />

            {/* Сенка за по-добра видимост на текста */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

            {/* Информация за автора и описанието (Долу вляво) */}
            <div className="absolute bottom-6 left-4 right-16 text-white z-10 space-y-2">
                <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white overflow-hidden shrink-0">
                        {reel.profiles?.avatar_url ? (
                            <img
                                src={reel.profiles.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                {authorName[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="font-semibold text-sm drop-shadow-md">
                        @{authorName}
                    </span>
                </div>
                {reel.caption && (
                    <p className="text-xs text-gray-200 line-clamp-2 drop-shadow-sm">
                        {reel.caption}
                    </p>
                )}
            </div>

            {/* TikTok Бутони отстрани (Вдясно) */}
            <div className="absolute bottom-8 right-3 flex flex-col items-center space-y-5 z-10 text-white">
                {/* Бутон за харесване */}
                <button
                    onClick={() => setLiked(!liked)}
                    className="flex flex-col items-center group"
                >
                    <div
                        className={`p-3 rounded-full bg-black/40 backdrop-blur-md transition-transform active:scale-125 ${liked ? "text-rose-500" : "text-white"
                            }`}
                    >
                        <svg
                            className="w-6 h-6 fill-current"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                    <span className="text-[10px] mt-1 font-medium">Харесва ми</span>
                </button>

                {/* Коментари */}
                <button className="flex flex-col items-center">
                    <div className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                    <span className="text-[10px] mt-1 font-medium">Коментари</span>
                </button>
            </div>
        </div>
    );
}