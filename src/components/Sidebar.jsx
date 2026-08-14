import React from "react";

export default function Sidebar({ currentUser, userProfile, activeTab, setActiveTab }) {
    const name = userProfile?.full_name || userProfile?.username || "Потребител";

    return (
        <aside className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-2">
            {/* Профил */}
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                    {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        name[0]?.toUpperCase()
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{currentUser?.email}</p>
                </div>
            </div>

            {/* 1. Новини (Синьо) */}
            <button
                onClick={() => setActiveTab("feed")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${activeTab === "feed"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-slate-50"
                    }`}
            >
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Новини (Feed)</span>
            </button>

            {/* 2. Reels & Видеа (Червено / Розово) */}
            <button
                onClick={() => setActiveTab("reels")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${activeTab === "reels"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-slate-50"
                    }`}
            >
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 002-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Reels & Видеа</span>
            </button>

            {/* 3. Групи (Лилаво) */}
            <button
                onClick={() => setActiveTab("groups")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${activeTab === "groups"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-slate-50"
                    }`}
            >
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Групи</span>
            </button>

            {/* 4. Галерия (Зелено) */}
            <button
                onClick={() => setActiveTab("gallery")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${activeTab === "gallery"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-slate-50"
                    }`}
            >
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Галерия</span>
            </button>

            {/* 5. Настройки (Оранжево / Сиво-оранжево) */}
            <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${activeTab === "settings"
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-gray-600 hover:bg-slate-50"
                    }`}
            >
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <span>Настройки</span>
            </button>
        </aside>
    );
}