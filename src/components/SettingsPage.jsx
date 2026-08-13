import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
    User,
    Lock,
    Bell,
    Palette,
    ShieldCheck,
    Save,
    Camera,
    Check,
    AlertCircle,
    MapPin,
    Calendar,
    Globe
} from "lucide-react";

export default function SettingsPage({ currentUser, onProfileUpdated }) {
    const [activeTab, setActiveTab] = useState("profile"); // profile, security, notifications, appearance
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Form states - Profile
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [city, setCity] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);

    // Form states - Security
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Form states - Preferences / Notifications
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [publicProfile, setPublicProfile] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadProfileData();
        }
    }, [currentUser]);

    const loadProfileData = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("username, bio, city, birth_date, avatar_url")
                .eq("id", currentUser.id)
                .single();

            if (error && error.code !== "PGRST116") throw error;

            if (data) {
                setUsername(data.username || "");
                setBio(data.bio || "");
                setCity(data.city || "");
                setBirthDate(data.birth_date || "");
                setAvatarUrl(data.avatar_url || "");
            }
        } catch (err) {
            console.error("Грешка при зареждане на профила:", err.message);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
            let finalAvatarUrl = avatarUrl;

            // Прикачване на нова снимка, ако има избрана
            if (avatarFile) {
                const fileExt = avatarFile.name.split(".").pop();
                const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("post-images")
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("post-images")
                    .getPublicUrl(filePath);

                finalAvatarUrl = urlData.publicUrl;
            }

            // Обновяване на данните в DB
            const { error } = await supabase.from("profiles").upsert({
                id: currentUser.id,
                username: username.trim(),
                bio: bio.trim(),
                city: city.trim(),
                birth_date: birthDate || null,
                avatar_url: finalAvatarUrl,
                updated_at: new Date(),
            });

            if (error) throw error;

            setSuccessMsg("Профилът беше обновен успешно!");
            if (onProfileUpdated) onProfileUpdated();
        } catch (err) {
            setErrorMsg("Възникна грешка: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setErrorMsg("Паролите не съвпадат!");
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg("Паролата трябва да е поне 6 символа!");
            return;
        }

        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setSuccessMsg("Паролата е променена успешно!");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setErrorMsg("Грешка при промяна на паролата: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Заглавна част */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Настройки на профила</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Управлявайте личната си информация, сигурността и предпочитанията си.
                    </p>
                </div>
            </div>

            {/* Известия за успех/грешка */}
            {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                </div>
            )}

            {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Основна част с ляво меню и десен панел */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Ляво меню с табове */}
                <div className="md:col-span-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-xs space-y-1 h-fit">
                    <button
                        onClick={() => { setActiveTab("profile"); setSuccessMsg(""); setErrorMsg(""); }}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "profile"
                            ? "bg-[#1d4ed8] text-white shadow-xs"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#1d4ed8]"
                            }`}
                    >
                        <User className="w-4 h-4 shrink-0" />
                        <span>Профил</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("security"); setSuccessMsg(""); setErrorMsg(""); }}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "security"
                            ? "bg-[#1d4ed8] text-white shadow-xs"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#1d4ed8]"
                            }`}
                    >
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>Сигурност и Парола</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("notifications"); setSuccessMsg(""); setErrorMsg(""); }}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "notifications"
                            ? "bg-[#1d4ed8] text-white shadow-xs"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#1d4ed8]"
                            }`}
                    >
                        <Bell className="w-4 h-4 shrink-0" />
                        <span>Известия & Поверителност</span>
                    </button>
                </div>

                {/* Дясна част - Съдържание */}
                <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">

                    {/* TAB 1: ПРОФИЛ */}
                    {activeTab === "profile" && (
                        <form onSubmit={handleSaveProfile} className="space-y-5">
                            <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
                                Публична информация
                            </h2>

                            {/* Снимка на профила */}
                            <div className="flex items-center space-x-4">
                                <div className="relative w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-100 overflow-hidden shrink-0 flex items-center justify-center text-[#1d4ed8] font-bold text-2xl">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{currentUser?.email ? currentUser.email[0].toUpperCase() : "U"}</span>
                                    )}
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer text-white">
                                        <Camera className="w-6 h-6" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-800">Профилна снимка</h3>
                                    <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG или GIF. Макс 5MB.</p>
                                </div>
                            </div>

                            {/* Полета */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Потребителско име
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Напр. ivan_dev"
                                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:border-[#1d4ed8] focus:outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        За мен (Bio)
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Разкажи малко за себе си..."
                                        rows={3}
                                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white focus:border-[#1d4ed8] focus:outline-none transition resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> Град
                                        </label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="Напр. Пловдив"
                                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:border-[#1d4ed8] focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Дата на раждане
                                        </label>
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:border-[#1d4ed8] focus:outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center space-x-2 bg-[#1d4ed8] hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{loading ? "Запазване..." : "Запази промените"}</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 2: СИГУРНОСТ */}
                    {activeTab === "security" && (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
                                Промяна на парола
                            </h2>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Нова парола
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:border-[#1d4ed8] focus:outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Потвърди новата парола
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:border-[#1d4ed8] focus:outline-none transition"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !newPassword}
                                    className="flex items-center space-x-2 bg-[#1d4ed8] hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{loading ? "Актуализиране..." : "Промени паролата"}</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB 3: ИЗВЕСТИЯ & ПОВЕРИТЕЛНОСТ */}
                    {activeTab === "notifications" && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
                                Предпочитания
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-800">Имейл известия</h4>
                                        <p className="text-[11px] text-gray-400">Получавай известия при нови съобщения и последвания.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications}
                                        onChange={(e) => setEmailNotifications(e.target.checked)}
                                        className="w-4 h-4 text-[#1d4ed8] rounded cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-800">Публичен профил</h4>
                                        <p className="text-[11px] text-gray-400">Позволи на други потребители да намират твоя профил.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={publicProfile}
                                        onChange={(e) => setPublicProfile(e.target.checked)}
                                        className="w-4 h-4 text-[#1d4ed8] rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}