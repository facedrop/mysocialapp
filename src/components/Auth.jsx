import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                // РЕГИСТРАЦИЯ
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username || email.split('@')[0],
                        },
                    },
                });

                if (signUpError) throw signUpError;

                setMessage('Регистрацията е успешна! Влез с новия си акаунт.');
                setIsSignUp(false);
                setPassword('');
            } else {
                // ВХОД
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (onAuthSuccess) {
                    onAuthSuccess(data.user);
                }
            }
        } catch (err) {
            setError(err.message || 'Възникна грешка при аутентикацията.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">

                {/* Заглавие */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-#1d4ed8 text-white rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-blue-#1d4ed8">
                        {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isSignUp ? 'Създай нов акаунт' : 'Добре дошъл отново'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {isSignUp
                            ? 'Въведи данните си, за да се присъединиш към социалната мрежа'
                            : 'Въведи имейл и парола, за да влезеш'}
                    </p>
                </div>

                {/* Съобщения за грешка / успех */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                {/* Форма */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                Потребителско име
                            </label>
                            <div className="relative">
                                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    required
                                    placeholder="ivan_godumanov"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-#1d4ed8 focus:bg-white transition"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Имейл адрес
                        </label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                required
                                placeholder="example@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-#1d4ed8 focus:bg-white transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Парола
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-#1d4ed8 focus:bg-white transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-blue-#1d4ed8 disabled:opacity-50"
                    >
                        {loading
                            ? 'Зареждане...'
                            : isSignUp ? 'Регистрирай се' : 'Влез в акаунта'}
                    </button>
                </form>

                {/* Превключване Вход / Регистрация */}
                <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                        }}
                        className="text-sm text-blue-#1d4ed8 hover:underline font-medium"
                    >
                        {isSignUp
                            ? 'Вече имаш акаунт? Влез тук'
                            : 'Нямаш акаунт? Регистрирай се'}
                    </button>
                </div>

            </div>
        </div>
    );
}