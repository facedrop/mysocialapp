import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Send, MessageSquare } from "lucide-react";

export default function Chat({ currentUser }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchMessages();

        // Абонамент за нови съобщения в реално време
        const channel = supabase
            .channel("public:messages")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                async (payload) => {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("username, avatar_url")
                        .eq("id", payload.new.user_id)
                        .single();

                    const messageWithProfile = {
                        ...payload.new,
                        profiles: profile,
                    };

                    setMessages((prev) => [...prev, messageWithProfile]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select(`
          id,
          content,
          created_at,
          user_id,
          profiles ( username, avatar_url )
        `)
                .order("created_at", { ascending: true })
                .limit(50);

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error("Грешка при зареждане на чата:", err.message);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        setLoading(true);

        try {
            const { error } = await supabase.from("messages").insert([
                {
                    user_id: currentUser.id,
                    content: newMessage.trim(),
                },
            ]);

            if (error) throw error;
            setNewMessage("");
        } catch (err) {
            console.error("Грешка при изпращане:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-#1d4ed8" />
                <h3 className="font-semibold text-gray-800 text-sm">Общ Чат (Live)</h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center italic mt-10">
                        Няма съобщения. Напишете нещо първи!
                    </p>
                ) : (
                    messages.map((msg) => {
                        const isMine = msg.user_id === currentUser.id;

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                            >
                                <span className="text-[10px] text-gray-400 mb-0.5 px-1">
                                    {msg.profiles?.username || "Потребител"}
                                </span>
                                <div
                                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${isMine
                                        ? "bg-blue-#1d4ed8 text-white rounded-br-none"
                                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex space-x-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишете съобщение..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-#1d4ed8"
                />
                <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-#1d4ed8 hover:bg-blue-#1d4ed8 disabled:opacity-50 text-white p-2 rounded-lg transition"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}