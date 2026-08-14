import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function SettingsPage({ currentUser, userProfile, onProfileUpdate }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [city, setCity] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (userProfile) {
            const names = (userProfile.full_name || "").trim().split(" ");
            setFirstName(names[0] || "");
            setLastName(names.slice(1).join(" ") || "");
            setUsername(userProfile.username || "");
            setCity(userProfile.city || "");
            setBirthDate(userProfile.birth_date || "");
            setAvatarUrl(userProfile.avatar_url || "");
        }
    }, [userProfile]);

    // Избор на снимка и генериране на предварителен преглед
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const fullName = `${cleanFirstName} ${cleanLastName}`.trim();

        // Ако потребителското име е празно, генерираме го от Име и Фамилия
        let finalUsername = username.trim();
        if (!finalUsername) {
            finalUsername = `${cleanFirstName}_${cleanLastName}`.toLowerCase().replace(/\s+/g, "");
        }

        try {
            let updatedAvatarUrl = avatarUrl;

            // 1. Качване на новата снимка в Supabase Storage (ако е избрана такава)
            if (avatarFile) {
                const fileExt = avatarFile.name.split(".").pop();
                const filePath = `avatars/${currentUser.id}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) {
                    // Ако нямате бъкет 'avatars', опитваме да съхраним файл като Data URL или хвърляме грешка
                    console.warn("Грешка при качване в storage (уверете се, че имате бъкет 'avatars'):", uploadError);
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from("avatars")
                        .getPublicUrl(filePath);

                    if (publicUrlData?.publicUrl) {
                        updatedAvatarUrl = publicUrlData.publicUrl;
                    }
                }
            }

            // 2. Обновяване на профила в базата данни
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    username: finalUsername,
                    city: city,
                    birth_date: birthDate || null,
                    avatar_url: updatedAvatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", currentUser.id);

            if (error) throw error;

            setUsername(finalUsername);
            setAvatarUrl(updatedAvatarUrl);
            setAvatarFile(null);
            setMessage({ type: "success", text: "Профилът е обновен успешно!" });

            // Презареждаме данните глобално в App.jsx
            if (onProfileUpdate) {
                onProfileUpdate();
            }
        } catch (err) {
            console.error("Грешка при запис:", err);
            setMessage({ type: "error", text: "Възникна грешка при запазването." });
        } finally {
            setLoading(false);
        }
    };

    const currentDisplayName = `${firstName} ${lastName}`.trim() || currentUser?.email || "U";
    const displayAvatar = previewUrl || avatarUrl;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
            <div>
                <h2 className="text-lg font-bold text-gray-900">Настройки на профила</h2>
                <p className="text-xs text-gray-400">Редактирай личната си информация</p>
            </div>

            {message.text && (
                <div
                    className={`p-3 rounded-xl text-xs font-medium ${message.type === "success"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Смяна на профилна снимка */}
                <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
                    <div className="relative w-20 h-20 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-2xl overflow-hidden shrink-0 border-2 border-gray-100 shadow-xs">
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt="Профилна снимка"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            currentDisplayName[0].toUpperCase()
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="avatar-upload"
                            className="cursor-pointer inline-block px-4 py-2 bg-slate-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Промени снимката
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            JPG, PNG или GIF (препоръчително квадратен формат)
                        </p>
                    </div>
                </div>

                {/* Име и Фамилия */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Име
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Иван"
                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Фамилия
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Годуманов"
                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* Потребителско име */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Потребителско име (@username)
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Остави празно за автоматично генериране (напр. ivan_godumanov)"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Град и Рождена дата */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Град
                        </label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Пловдив"
                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Дата на раждане
                        </label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                    {loading ? "Запазване..." : "Запази промените"}
                </button>
            </form>
        </div>
    );
}