import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Send, X, MessageSquare, Check, CheckCheck, Minus } from "lucide-react";

export default function ChatModal({ currentUser, targetUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!targetUser) return;

        fetchMessages();
        markMessagesAsRead();

        const channel = supabase
            .channel(`chat:${currentUser.id}_${targetUser.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    const msg = payload.new;
                    if (
                        (msg.sender_id === currentUser.id && msg.receiver_id === targetUser.id) ||
                        (msg.sender_id === targetUser.id && msg.receiver_id === currentUser.id)
                    ) {
                        setMessages((prev) => [...prev, msg]);
                        if (msg.receiver_id === currentUser.id) {
                            markMessagesAsRead();
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [targetUser]);

    useEffect(() => {
        if (!isMinimized) scrollToBottom();
    }, [messages, isMinimized]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUser.id})`
                )
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error("Грешка при зареждане на съобщенията:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async () => {
        try {
            await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("sender_id", targetUser.id)
                .eq("receiver_id", currentUser.id)
                .eq("is_read", false);
        } catch (err) {
            console.error("Грешка при маркиране като прочетени:", err.message);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage("");

        try {
            const { error } = await supabase.from("messages").insert([
                {
                    sender_id: currentUser.id,
                    receiver_id: targetUser.id,
                    content: content,
                },
            ]);

            if (error) throw error;
        } catch (err) {
            console.error("Грешка при изпращане:", err.message);
        }
    };

    return (
        <div className="fixed bottom-0 right-4 sm:right-10 z-50 w-80 sm:w-88 bg-white rounded-t-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-200">
            {/* Чат Header (Винаги видим) */}
            <div className="p-3 bg-blue-600 text-white flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsMinimized(!isMinimized)}>
                <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white text-blue-300 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                        {targetUser.avatar_url ? (
                            <img src={targetUser.avatar_url} alt={targetUser.username} className="w-full h-full object-cover" />
                        ) : (
                            <span>{targetUser.username ? targetUser.username[0].toUpperCase() : "U"}</span>
                        )}
                    </div>
                    <div className="truncate">
                        <h3 className="font-bold text-xs truncate leading-none">
                            {targetUser.username || "Анонимен"}
                        </h3>
                        <span className="text-[10px] text-blue-100">Активен сега</span>
                    </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        className="p-1 hover:bg-blue-500 rounded transition"
                        title={isMinimized ? "Разгъни" : "Свий"}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1 hover:bg-blue-500 rounded transition"
                        title="Затвори"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Съдържание на чата (Скрива се при минимизиране) */}
            {!isMinimized && (
                <div className="h-80 flex flex-col bg-gray-50/50">
                    <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-[11px] text-gray-400">Зареждане...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-1">
                                <MessageSquare className="w-6 h-6 opacity-40" />
                                <p className="text-[11px]">Пиши на {targetUser.username}!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.sender_id === currentUser.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${isMe
                                                ? "bg-blue-800 text-white rounded-br-none"
                                                : "bg-white text-gray-800 border border-gray-300 rounded-bl-none"
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <div
                                                className={`flex items-center justify-end space-x-1 mt-0.5 text-[8px] ${isMe ? "text-blue-100" : "text-gray-800"
                                                    }`}
                                            >
                                                <span>
                                                    {new Date(msg.created_at).toLocaleTimeString("bg-BG", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {isMe && (
                                                    msg.is_read ? (
                                                        <CheckCheck className="w-3 h-3 text-blue-100" />
                                                    ) : (
                                                        <Check className="w-3 h-3 text-blue-100" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form
                        onSubmit={handleSendMessage}
                        className="p-2 bg-white border-t border-gray-100 flex items-center space-x-1.5 shrink-0"
                    >
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Съобщение..."
                            className="flex-1 bg-gray-100 focus:bg-white text-xs text-gray-800 px-3 py-1.5 rounded-full border border-transparent focus:border-blue-500 focus:outline-none transition"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shrink-0"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}