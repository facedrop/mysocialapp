import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Search, MessageSquare, Compass, LogOut, User } from "lucide-react";

export default function Navbar({
    currentUser,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    onOpenProfile,
    onSelectChatUser,
}) {
    const [showChatDropdown, setShowChatDropdown] = useState(false);
    const [recentChats, setRecentChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const dropdownRef = useRef(null);

    // Затваряне при клик извън менюто
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowChatDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Извличане на последните чатове
    const toggleChatDropdown = async () => {
        const nextState = !showChatDropdown;
        setShowChatDropdown(nextState);

        if (nextState) {
            setLoadingChats(true);
            try {
                const { data: userMessages, error } = await supabase
                    .from("messages")
                    .select("sender_id, receiver_id, created_at")
                    .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const partnerIds = new Set();
                (userMessages || []).forEach((m) => {
                    if (m.sender_id !== currentUser.id) partnerIds.add(m.sender_id);
                    if (m.receiver_id !== currentUser.id) partnerIds.add(m.receiver_id);
                });

                const topPartnerIds = Array.from(partnerIds).slice(0, 4);

                if (topPartnerIds.length > 0) {
                    const { data: profiles, error: profilesError } = await supabase
                        .from("profiles")
                        .select("*") // Вземаме всички полета (id, username, full_name, avatar_url и т.н.)
                        .in("id", topPartnerIds);

                    if (profilesError) throw profilesError;

                    const sortedProfiles = topPartnerIds
                        .map((id) => profiles.find((p) => p.id === id))
                        .filter(Boolean);

                    setRecentChats(sortedProfiles);
                } else {
                    setRecentChats([]);
                }
            } catch (err) {
                console.error("Грешка при зареждане на бързи чатове:", err.message);
            } finally {
                setLoadingChats(false);
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-100 z-40 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">

                {/* Лого */}
                <div
                    className="flex items-center space-x-2 shrink-0 cursor-pointer"
                    onClick={() => setActiveTab && setActiveTab("feed")}
                >
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xs">
                        S
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-gray-900 hidden sm:inline">
                        SocialApp
                    </span>
                </div>

                {/* Търсачка */}
                <div className="flex-1 max-w-md relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery || ""}
                        onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                        placeholder="Търси..."
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-full pl-9 pr-4 py-2 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                    />
                </div>

                {/* Икони */}
                <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 relative">

                    {/* Икона за чат */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={toggleChatDropdown}
                            className={`p-2 rounded-xl transition cursor-pointer ${showChatDropdown
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            title="Последно писани"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>

                        {/* БАЛОНСЧЕ С ПОСЛЕДНИТЕ ЧАТОВЕ */}
                        {showChatDropdown && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-900">Последно писани</span>
                                </div>

                                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                                    {loadingChats ? (
                                        <div className="p-4 text-center text-xs text-gray-400">
                                            Зареждане...
                                        </div>
                                    ) : recentChats.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-gray-400">
                                            Няма скорошни разговори
                                        </div>
                                    ) : (
                                        recentChats.map((chatUser) => (
                                            <div
                                                key={chatUser.id}
                                                onClick={() => {
                                                    if (typeof onSelectChatUser === "function") {
                                                        onSelectChatUser(chatUser);
                                                    } else {
                                                        console.error("Пропът onSelectChatUser липсва в Navbar компонента в App.jsx!");
                                                    }
                                                    setShowChatDropdown(false);
                                                }}
                                                className="flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                                    {chatUser.avatar_url ? (
                                                        <img
                                                            src={chatUser.avatar_url}
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>
                                                            {(chatUser.username || chatUser.full_name || "U")[0].toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">
                                                        {chatUser.username || chatUser.full_name || "Потребител"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        Кликни за отваряне на прозорец
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Бутон "Откривай" */}
                    <button
                        onClick={() => setActiveTab && setActiveTab("explore")}
                        className={`p-2 rounded-xl transition cursor-pointer ${activeTab === "explore"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        title="Откривай"
                    >
                        <Compass className="w-5 h-5" />
                    </button>

                    {/* Профил */}
                    <button
                        onClick={() => onOpenProfile && onOpenProfile(currentUser?.id)}
                        className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-50 transition cursor-pointer"
                        title="Профил"
                    >
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-gray-200">
                            {currentUser?.user_metadata?.avatar_url ? (
                                <img
                                    src={currentUser.user_metadata.avatar_url}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-4 h-4" />
                            )}
                        </div>
                    </button>

                    {/* Изход */}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Изход"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </header>
    );
}