import React from "react";

export default function Sidebar({
    currentUser,
    userProfile,
    activeTab,
    setActiveTab,
}) {
    // Име и аватар от profiles, а като резервен вариант ползваме email
    // Изчисляваме показаното име по същия начин като в постовете
    const displayName =
        userProfile?.full_name ||
        userProfile?.username ||
        currentUser?.email?.split("@")[0] ||
        "Анонимен";

    const avatarUrl = userProfile?.avatar_url;

    return (
        <aside className="space-y-4 sticky top-20">
            {/* Карта с профила на логнатия потребител */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center space-x-3 mb-6 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg overflow-hidden shrink-0">
                    {userProfile?.avatar_url ? (
                        <img
                            src={userProfile.avatar_url}
                            alt={displayName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        displayName[0].toUpperCase()
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                        {displayName}
                    </h3>
                    <p className="text-xs text-gray-400">Моят профил</p>
                </div>
            </div>

            {/* Навигационно меню */}
            <nav className="bg-white rounded-2xl border border-gray-100 p-2 shadow-2xs space-y-1">
                {[
                    { id: "feed", label: "Фийд", icon: "🏠" },
                    { id: "explore", label: "Откривай", icon: "🧭" },
                    { id: "groups", label: "Групи", icon: "👥" },
                    { id: "messages", label: "Съобщения", icon: "💬" },
                    { id: "profile", label: "Моят профил", icon: "👤" },
                    { id: "saved", label: "Запазени", icon: "🔖" },
                    { id: "settings", label: "Настройки", icon: "⚙️" },
                ].map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isActive
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                                }`}
                        >
                            <span className="text-sm">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}