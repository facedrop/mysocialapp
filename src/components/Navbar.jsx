import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar({
    currentUser,
    userProfile,
    searchQuery,
    setSearchQuery,
    onSelectUserForChat,
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .neq("id", currentUser.id);

        if (data) setUsers(data);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Лого */}
                <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xs">
                        S
                    </div>
                    <span className="font-bold text-gray-900 text-base hidden sm:inline">
                        SocialApp
                    </span>
                </div>

                {/* Търсачка */}
                <div className="flex-1 max-w-md relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Търси..."
                        className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <svg
                        className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Дясна част */}
                <div className="flex items-center space-x-3 relative" ref={dropdownRef}>
                    {/* Бутон за Съобщения */}
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        title="Съобщения"
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors relative"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>

                    {/* Падащо меню с чатове под иконката */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <h4 className="text-xs font-bold text-gray-800">Съобщения</h4>
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                                {users.length === 0 ? (
                                    <p className="p-4 text-xs text-gray-400 text-center">Няма намерени потребители</p>
                                ) : (
                                    users.map((u) => {
                                        const name = u.full_name || u.username || u.email?.split("@")[0];
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    onSelectUserForChat(u);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 text-left transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        name[0].toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                                                    <p className="text-[10px] text-gray-400">Кликни за чат</p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Изход */}
                    <button
                        onClick={handleLogout}
                        title="Изход"
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}