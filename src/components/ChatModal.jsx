// src/components/ChatModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { X, Send } from "lucide-react";

export default function ChatModal({ currentUser, chatUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // Зареждане на съобщения и слушане за нови в реално време
    useEffect(() => {
        if (!chatUser || !currentUser) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${currentUser.id},receiver_id.eq.${chatUser.id}),and(sender_id.eq.${chatUser.id},receiver_id.eq.${currentUser.id})`
                )
                .order("created_at", { ascending: true });

            if (!error) setMessages(data || []);
        };

        fetchMessages();

        // Подписка за реално време (Realtime)
        const channel = supabase
            .channel(`chat_${chatUser.id}`)
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
                        (msg.sender_id === currentUser.id && msg.receiver_id === chatUser.id) ||
                        (msg.sender_id === chatUser.id && msg.receiver_id === currentUser.id)
                    ) {
                        setMessages((prev) => [...prev, msg]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatUser, currentUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const textToSend = newMessage.trim();
        setNewMessage("");

        const { error } = await supabase.from("messages").insert([
            {
                sender_id: currentUser.id,
                receiver_id: chatUser.id,
                content: textToSend,
            },
        ]);

        if (error) {
            console.error("Грешка при изпращане:", error.message);
        }
    };

    if (!chatUser) return null;

    return (
        /* ВАЖНО: fixed bottom-0 right-4 z-50 фиксира прозореца долу вдясно */
        <div className="fixed bottom-0 right-4 sm:right-10 w-80 sm:w-96 bg-white rounded-t-2xl shadow-2xl border border-gray-200 z-50 flex flex-col h-[450px] animate-in slide-in-from-bottom duration-200">

            {/* Заглавна част */}
            <div className="p-3 bg-blue-600 text-white rounded-t-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                        {chatUser.avatar_url ? (
                            <img src={chatUser.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span>{(chatUser.username || chatUser.full_name || "U")[0].toUpperCase()}</span>
                        )}
                    </div>
                    <span className="font-bold text-xs truncate">
                        {chatUser.username || chatUser.full_name || "Чат"}
                    </span>
                </div>

                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
                >
                    <X className="w-4 h-4 text-white" />
                </button>
            </div>

            {/* Зона със съобщения */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50 text-xs">
                {messages.map((m) => {
                    const isMe = m.sender_id === currentUser.id;
                    return (
                        <div
                            key={m.id || m.created_at}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] px-3 py-2 rounded-2xl ${isMe
                                        ? "bg-blue-600 text-white rounded-br-xs"
                                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs shadow-2xs"
                                    }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Поле за писане */}
            <form
                onSubmit={handleSendMessage}
                className="p-2 border-t border-gray-100 bg-white flex items-center space-x-2 shrink-0 rounded-b-2xl"
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напиши съобщение..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-blue-600"
                />
                <button
                    type="submit"
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition cursor-pointer shrink-0"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>
        </div>
    );
}