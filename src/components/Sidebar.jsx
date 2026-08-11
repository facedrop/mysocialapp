import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Home, Users, Bookmark, Settings, LogOut, User } from "lucide-react";
import EditProfileModal from "./EditProfileModal";

export default function Sidebar({ currentUser }) {
    const [profile, setProfile] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        if (currentUser) fetchProfile();
    }, [currentUser]);

    const fetchProfile = async () => {
        const { data } = supabase
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
        <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                {/* Профил секция (при клик отваря модала) */}
                <div
                    onClick={() => setIsEditOpen(true)}
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

                <nav className="space-y-1 text-sm font-medium text-gray-600">
                    <a
                        href="#"
                        className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 text-blue-600"
                    >
                        <Home className="w-5 h-5" />
                        <span>Начало</span>
                    </a>
                    <a
                        href="#"
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                        <Users className="w-5 h-5" />
                        <span>Приятели</span>
                    </a>
                    <a
                        href="#"
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                        <Bookmark className="w-5 h-5" />
                        <span>Запазени</span>
                    </a>
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 text-left"
                    >
                        <Settings className="w-5 h-5" />
                        <span>Настройки</span>
                    </button>
                </nav>

                <div className="pt-2 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Изход</span>
                    </button>
                </div>
            </div>

            {/* Модален прозорец за редакция */}
            {isEditOpen && (
                <EditProfileModal
                    currentUser={currentUser}
                    profile={profile}
                    onClose={() => setIsEditOpen(false)}
                    onProfileUpdated={fetchProfile}
                />
            )}
        </>
    );
}