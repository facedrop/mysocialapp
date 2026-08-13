import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MapPin, Calendar } from "lucide-react";

export default function UserHoverCard({ userId, children, position = "top" }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered && !profile && userId) {
            fetchUserProfile();
        }
    }, [isHovered, userId]);

    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("username, avatar_url, city, birth_date, bio")
                .eq("id", userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error("Грешка при зареждане на картичка:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (birthDateString) => {
        if (!birthDateString) return null;
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = profile?.birth_date ? calculateAge(profile.birth_date) : null;

    // Позициониране: горе или долу
    const isTop = position === "top";

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}

            {isHovered && (
                <div
                    className={`absolute left-0 z-50 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 text-left pointer-events-none animate-in fade-in duration-150 ${isTop ? "bottom-full mb-2" : "top-full mt-2"
                        }`}
                >
                    {loading ? (
                        <div className="text-center py-2 text-[11px] text-gray-400 font-medium">
                            Зареждане...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-blue-100">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>
                                            {profile?.username ? profile.username[0].toUpperCase() : "U"}
                                        </span>
                                    )}
                                </div>
                                <div className="overflow-hidden min-w-0">
                                    <h4 className="font-bold text-gray-900 text-xs truncate leading-tight">
                                        {profile?.username || "Потребител"}
                                    </h4>
                                    {profile?.bio && (
                                        <p className="text-[10px] text-gray-500 truncate italic mt-0.5">
                                            "{profile.bio}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Детайли */}
                            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-1.5 text-[10px] text-gray-600">
                                <div className="flex items-center space-x-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100/60 overflow-hidden">
                                    <MapPin className="w-3 h-3 text-[#1d4ed8] shrink-0" />
                                    <span className="truncate font-medium">
                                        {profile?.city || "—"}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100/60 overflow-hidden">
                                    <Calendar className="w-3 h-3 text-[#1d4ed8] shrink-0" />
                                    <span className="font-medium truncate">
                                        {age ? `${age} г.` : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Стрелка на балончето */}
                    <div
                        className={`absolute left-5 w-2.5 h-2.5 bg-white rotate-45 border-gray-100 ${isTop
                            ? "top-full -mt-1 border-r border-b"
                            : "bottom-full -mb-1 border-l border-t"
                            }`}
                    />
                </div>
            )}
        </div>
    );
}