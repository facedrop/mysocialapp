import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { X, User, MapPin, Loader2, Save, Camera, Check } from "lucide-react";

export default function EditProfileModal({ currentUser, profile, onClose, onProfileUpdated }) {
    const [username, setUsername] = useState(profile?.username || "");
    const [city, setCity] = useState(profile?.city || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Качване на файл в Supabase Storage
    const handleFileUpload = async (e) => {
        try {
            setErrorMsg("");
            setUploadSuccess(false);
            const file = e.target.files[0];
            if (!file) return;

            // Валидация за файл – само изображения
            if (!file.type.startsWith("image/")) {
                setErrorMsg("Моля, избери валиден снимков файл (PNG, JPG, WEBP).");
                return;
            }

            // Валидация за размер (макс 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrorMsg("Снимката трябва да е по-малка от 5MB.");
                return;
            }

            setUploading(true);

            const fileExt = file.name.split(".").pop();
            const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;

            // Качване във вече създадения bucket "avatars"
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrlData.publicUrl);
            setUploadSuccess(true);
        } catch (err) {
            console.error("Грешка при качване на снимката:", err.message);
            setErrorMsg("Възникна грешка при качването на снимката.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!username.trim()) {
            setErrorMsg("Моля, въведи потребителско име.");
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            const updates = {
                id: currentUser.id,
                username: username.trim(),
                avatar_url: avatarUrl,
                city: city.trim(),
                updated_at: new Date(),
            };

            const { error } = await supabase.from("profiles").upsert(updates);

            if (error) throw error;

            if (onProfileUpdated) onProfileUpdated();
            onClose();
        } catch (err) {
            console.error("Грешка при обновяване на профила:", err.message);
            setErrorMsg("Нещо се обърка при запазването. Опитай отново.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-blue-#1d4ed8 px-5 py-4 text-white flex items-center justify-between">
                    <h3 className="font-bold text-sm">Редактиране на профила</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-medium">
                            {errorMsg}
                        </div>
                    )}

                    {/* Аватар & Бутон за качване */}
                    <div className="flex flex-col items-center justify-center space-y-3 py-1">
                        <div className="relative group w-24 h-24">
                            <div className="w-24 h-24 rounded-full bg-blue-#1d4ed8 text-white flex items-center justify-center font-bold text-3xl overflow-hidden border-4 border-blue-50 shadow-md">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{(username || "U")[0]?.toUpperCase()}</span>
                                )}
                            </div>

                            {/* Индикатор за зареждане върху самата снимка */}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white space-y-1">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-#1d4ed8" />
                                    <span className="text-[10px]">Качване...</span>
                                </div>
                            )}
                        </div>

                        {/* Компактен красив бутон за избор на файл */}
                        <div className="flex flex-col items-center space-y-1">
                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl flex items-center space-x-2 transition border border-gray-200 active:scale-95">
                                <Camera className="w-4 h-4 text-blue-#1d4ed8" />
                                <span>{uploading ? "Качване..." : "Смени снимката"}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>

                            {uploadSuccess && (
                                <span className="text-[11px] text-green-600 flex items-center space-x-1 font-medium mt-1">
                                    <Check className="w-3 h-3" />
                                    <span>Снимката е качена успешно!</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Потребителско име */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-gray-700 flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-blue-#1d4ed8" />
                            <span>Потребителско име</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Твоето име"
                            className="w-full bg-gray-50 text-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-blue-#1d4ed8 focus:bg-white focus:outline-none transition"
                        />
                    </div>

                    {/* Град */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-gray-700 flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-#1d4ed8" />
                            <span>Град</span>
                        </label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Пловдив, София..."
                            className="w-full bg-gray-50 text-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none transition"
                        />
                    </div>

                    {/* Бутони */}
                    <div className="pt-3 flex items-center justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer font-medium"
                        >
                            Отказ
                        </button>
                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer font-medium shadow-sm"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Запазване...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Запази промените</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}