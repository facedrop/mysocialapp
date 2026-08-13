import React from "react";
import {
    Home,
    Compass,
    Users,
    MessageSquare,
    User,
    Bookmark,
    Settings,
} from "lucide-react";

export default function Sidebar({ currentUser, activeTab, setActiveTab }) {
    const menuItems = [
        { id: "feed", label: "Фийд", icon: Home },
        { id: "explore", label: "Откривай", icon: Compass },
        { id: "groups", label: "Групи", icon: Users },
        { id: "messages", label: "Съобщения", icon: MessageSquare },
        { id: "profile", label: "Моят профил", icon: User },
        { id: "saved", label: "Запазени", icon: Bookmark },
        { id: "settings", label: "Настройки", icon: Settings },
    ];

    return (
        <aside className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-2 sticky top-20">
            {/* Профилна информация горе */}
            <div className="flex items-center space-x-3 p-2 mb-2 rounded-xl bg-slate-50 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                    {currentUser?.user_metadata?.avatar_url ? (
                        <img
                            src={currentUser.user_metadata.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span>
                            {(currentUser?.email || "U")[0].toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                        {currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">Моят профил</p>
                </div>
            </div>

            {/* Навигационни бутони */}
            <nav className="space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab && setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${isActive
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}