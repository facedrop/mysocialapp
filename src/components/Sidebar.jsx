import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Image, Home, Users, Bookmark, Settings, LogOut } from "lucide-react";

export default function Sidebar({ currentUser, activeTab, setActiveTab, onEditProfile }) {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (currentUser) fetchProfile();
    }, [currentUser]);

    const fetchProfile = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", currentUser.id)
            .single();

        if (data) setProfile(data);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
            {/* Профил секция (при клик подава към App.jsx да отвори модала) */}
            <div
                onClick={onEditProfile}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition border border-transparent hover:border-gray-200"
            >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span>{currentUser?.email ? currentUser.email[0].toUpperCase() : "U"}</span>
                    )}
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">
                        {profile?.username || currentUser?.email?.split("@")[0]}
                    </h3>
                    <p className="text-xs text-blue-600 font-medium">Редактирай профила</p>
                </div>
            </div>

            {/* Навигация */}
            <nav className="space-y-1 text-sm font-medium">
                <button
                    onClick={() => setActiveTab && setActiveTab("gallery")}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition cursor-pointer ${activeTab === "gallery"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Image className="w-5 h-5 shrink-0" />
                    <span className="truncate">Галерия</span>
                </button>

                <button
                    onClick={() => setActiveTab && setActiveTab("feed")}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition cursor-pointer ${activeTab === "feed"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Home className="w-5 h-5 shrink-0" />
                    <span className="truncate">Начало</span>
                </button>

                <button
                    onClick={() => setActiveTab && setActiveTab("friends")}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition cursor-pointer ${activeTab === "friends"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="truncate">Приятели</span>
                </button>

                <button
                    onClick={() => setActiveTab && setActiveTab("saved")}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition cursor-pointer ${activeTab === "saved"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Bookmark className="w-5 h-5 shrink-0" />
                    <span className="truncate">Запазени</span>
                </button>

                <button
                    onClick={() => setActiveTab && setActiveTab("settings")}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition cursor-pointer ${activeTab === "settings"
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Settings className="w-5 h-5 shrink-0" />
                    <span className="truncate">Настройки</span>
                </button>
            </nav>

            <div className="pt-2 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition cursor-pointer"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Изход</span>
                </button>
            </div>
        </div>
    );
}