import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function ChatModal({ currentUser, selectedUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [activeChatUser, setActiveChatUser] = useState(selectedUser || null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            setActiveChatUser(selectedUser);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (activeChatUser) {
            fetchMessages();

            const subscription = supabase
                .channel(`chat_${activeChatUser.id}`)
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
                            (msg.sender_id === currentUser.id && msg.receiver_id === activeChatUser.id) ||
                            (msg.sender_id === activeChatUser.id && msg.receiver_id === currentUser.id)
                        ) {
                            setMessages((prev) => [...prev, msg]);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [activeChatUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchUsers = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .neq("id", currentUser.id);

        if (data) {
            setUsers(data);
            if (!activeChatUser && data.length > 0) {
                setActiveChatUser(data[0]);
            }
        }
    };

    const fetchMessages = async () => {
        if (!activeChatUser) return;

        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .or(
                `and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${currentUser.id})`
            )
            .order("created_at", { ascending: true });

        if (!error && data) {
            setMessages(data);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatUser) return;

        const textToSend = newMessage.trim();
        setNewMessage("");

        const { error } = await supabase.from("messages").insert([
            {
                sender_id: currentUser.id,
                receiver_id: activeChatUser.id,
                content: textToSend,
            },
        ]);

        if (error) {
            console.error("Грешка при изпращане на съобщение:", error);
        }
    };

    const activeName =
        activeChatUser?.full_name || activeChatUser?.username || "Потребител";

    return (
        <div className="fixed bottom-0 right-4 z-50 w-80 sm:w-96 bg-white rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col h-[420px] overflow-hidden">
            {/* Заглавна част */}
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-white/30">
                        {activeChatUser?.avatar_url ? (
                            <img
                                src={activeChatUser.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            activeName[0].toUpperCase()
                        )}
                    </div>
                    <span className="font-semibold text-xs truncate">{activeName}</span>
                </div>

                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Съобщения */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                        <div
                            key={msg.id || Math.random()}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs break-words shadow-2xs ${isMe
                                        ? "bg-blue-600 text-white rounded-br-xs"
                                        : "bg-white text-gray-800 rounded-bl-xs border border-gray-100"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Поле за въвеждане */}
            <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-2"
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напиши съобщение..."
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                    type="submit"
                    className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shrink-0"
                >
                    Прати
                </button>
            </form>
        </div>
    );
}