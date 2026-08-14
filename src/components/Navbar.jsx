import React from "react";

export default function Navbar({
    currentUser,
    userProfile,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    onSelectUserForChat,
}) {
    const name = userProfile?.full_name || userProfile?.username || "Потребител";

    // Функция за връщане в началото на Feed-а
    const handleLogoClick = () => {
        if (setActiveTab) {
            setActiveTab("feed");
        }
        // Скролва гладко най-горе на страницата
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

                {/* Лого Lumo */}
                <div
                    onClick={handleLogoClick}
                    className="flex items-center space-x-2 cursor-pointer group select-none"
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform duration-200">
                        L
                    </div>
                    <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 bg-clip-text text-transparent tracking-tight">
                        Lumo
                    </span>
                </div>

                {/* Търсачка */}
                <div className="flex-1 max-w-md hidden sm:block">
                    <div className="relative">
                        <svg
                            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Търси в Lumo..."
                            className="w-full bg-slate-100 text-xs text-gray-800 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Профил */}
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                            {userProfile?.avatar_url ? (
                                <img
                                    src={userProfile.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                name[0]?.toUpperCase()
                            )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 hidden md:block pr-1">
                            {name}
                        </span>
                    </div>
                </div>

            </div>
        </header>
    );
}