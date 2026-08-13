import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Sparkles, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function Auth() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (isSignUp) {
                // 1. Регистрация
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                // 2. Създаване на профил при успешна регистрация
                if (data?.user) {
                    const { error: profileError } = await supabase.from("profiles").upsert({
                        id: data.user.id,
                        username: username.trim() || email.split("@")[0],
                        created_at: new Date(),
                    });

                    if (profileError) console.error("Грешка при създаване на профила:", profileError.message);
                }

                setSuccessMessage("Успешна регистрация! Вече можете да влезете.");
                setIsSignUp(false);
            } else {
                // Вход
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
            }
        } catch (err) {
            setErrorMessage(err.message || "Възникна грешка при автентикацията.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">

                {/* Лява част - Промо панел с градиент */}
                <div className="md:col-span-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                    {/* Декоративни кръгове на фона */}
                    <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

                    {/* Лого */}
                    <div className="flex items-center space-x-2 relative z-10">
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight">MySocialNet</span>
                    </div>

                    {/* Текст / Акценти */}
                    <div className="my-8 relative z-10 space-y-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                            Свържи се с хората около теб.
                        </h2>
                        <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                            Споделяй моменти, разглеждай интересни публикации и се свързвай с приятели в реално време.
                        </p>
                    </div>

                    {/* Подпис / Футър */}
                    <div className="text-[11px] text-blue-200/80 relative z-10">
                        © {new Date().getFullYear()} MySocialNet. Всички права запазени.
                    </div>
                </div>

                {/* Дясна част - Форма за Вход / Регистрация */}
                <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
                    <div className="max-w-sm w-full mx-auto space-y-6">

                        {/* Заглавие */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {isSignUp ? "Създай профил" : "Добре дошъл отново"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {isSignUp
                                    ? "Попълни данните си, за да станеш част от общността."
                                    : "Въведи данните си за вход, за да продължиш."}
                            </p>
                        </div>

                        {/* Известие за грешка */}
                        {errorMessage && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-2 text-red-600 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Известие за успех */}
                        {successMessage && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-2 text-emerald-600 text-xs">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {/* Форма */}
                        <form onSubmit={handleAuth} className="space-y-4">

                            {/* Потребителско име (само при Регистрация) */}
                            {isSignUp && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Потребителско име
                                    </label>
                                    <div className="relative flex items-center">
                                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                        <input
                                            type="text"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="ivan_godumanov"
                                            className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Имейл */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Имейл адрес
                                </label>
                                <div className="relative flex items-center">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@mail.com"
                                        className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Парола */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Парола
                                </label>
                                <div className="relative flex items-center">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Бутон за изпращане */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
                            >
                                <span>{loading ? "Зареждане..." : isSignUp ? "Регистрирай се" : "Вход"}</span>
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>

                        {/* Превключване между Вход / Регистрация */}
                        <div className="pt-2 text-center text-xs text-slate-500">
                            {isSignUp ? "Вече имаш профил?" : "Нямаш профил?"}{" "}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setErrorMessage("");
                                    setSuccessMessage("");
                                }}
                                className="font-bold text-blue-600 hover:underline cursor-pointer ml-1"
                            >
                                {isSignUp ? "Влез тук" : "Регистрирай се"}
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}