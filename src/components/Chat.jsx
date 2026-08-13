import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Send, Smile, User, Search, MessageSquare } from "lucide-react";

// Популярни емоджита за бърз избор
const EMOJI_LIST = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛",
    "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
    "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮", "😴", "😌",
    "👍", "👎", "👏", "🙌", "🔥", "❤️", "💖", "✨", "🎉", "💯"
];

export default function Chat({ currentUser }) {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef(null);

    // 1. Зареждаме списъка с потребители, с които има намерени съобщения
    useEffect(() => {
        fetchConversations();
    }, [currentUser]);

    // 2. Слушаме за нови съобщения в реално време (Supabase Realtime)
    useEffect(() => {
        if (!selectedUser) return;

        fetchMessages(selectedUser.id);

        const channel = supabase
            .channel("realtime-messages")
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
                        (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
                        (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
                    ) {
                        setMessages((prev) => [...prev, msg]);
                        scrollToBottom();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Извличане на всички уникални потребители, с които има разменени съобщения
    const fetchConversations = async () => {
        setLoading(true);
        try {
            // Взимаме съобщенията, в които участва текущият потребител
            const { data: userMessages, error } = await supabase
                .from("messages")
                .select("sender_id, receiver_id, created_at")
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Извличаме уникалните ID-та на събеседниците
            const partnerIds = new Set();
            (userMessages || []).forEach((m) => {
                if (m.sender_id !== currentUser.id) partnerIds.add(m.sender_id);
                if (m.receiver_id !== currentUser.id) partnerIds.add(m.receiver_id);
            });

            if (partnerIds.size === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            // Взимаме профилите на тези събеседници
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .in("id", Array.from(partnerIds));

            if (profilesError) throw profilesError;

            setConversations(profiles || []);
            if (profiles && profiles.length > 0 && !selectedUser) {
                setSelectedUser(profiles[0]);
            }
        } catch (err) {
            console.error("Грешка при зареждане на разговорите:", err.message);
        } finally {
            setLoading(false);
        }
    };

    // Зареждане на съобщенията с конкретния събеседник
    const fetchMessages = async (partnerId) => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`
                )
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error("Грешка при извличане на съобщенията:", err.message);
        }
    };

    // Изпращане на съобщение
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const messageText = newMessage.trim();
        setNewMessage("");
        setShowEmojiPicker(false);

        try {
            const { error } = await supabase.from("messages").insert({
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                content: messageText,
            });

            if (error) throw error;
        } catch (err) {
            console.error("Грешка при изпращане:", err.message);
        }
    };

    // Добавяне на емоджи към текста
    const addEmoji = (emoji) => {
        setNewMessage((prev) => prev + emoji);
    };

    // Филтриране на разговорите чрез търсачката
    const filteredConversations = conversations.filter((c) =>
        c.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs h-[600px] grid grid-cols-1 md:grid-cols-12 overflow-hidden">

            {/* ЛЯВА СЕКЦИЯ - СПИСЪК С СЪБЕСЕДНИЦИ */}
            <div className="md:col-span-4 border-r border-gray-100 flex flex-col h-full bg-slate-50/50">
                <div className="p-3 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-900 mb-2">Съобщения</h3>
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Търси разговор..."
                            className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-600 transition"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-4 text-center text-xs text-gray-400">Зареждане...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 space-y-1">
                            <MessageSquare className="w-6 h-6 mx-auto text-gray-300" />
                            <p>Няма намерени разговори.</p>
                        </div>
                    ) : (
                        filteredConversations.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`flex items-center space-x-3 p-3 cursor-pointer transition ${selectedUser?.id === user.id ? "bg-blue-50/80" : "hover:bg-gray-100/50"
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user.username ? user.username[0].toUpperCase() : "U"}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-gray-900 truncate">{user.username}</h4>
                                    <p className="text-[11px] text-gray-400 truncate">Кликни за преглед на чата</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ДЯСНА СЕКЦИЯ - ЧАТ ПРОЗОРЕЦ */}
            <div className="md:col-span-8 flex flex-col h-full bg-white relative">
                {selectedUser ? (
                    <>
                        {/* Header на разговора */}
                        <div className="p-3 border-b border-gray-100 flex items-center space-x-3 bg-white">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                                {selectedUser.avatar_url ? (
                                    <img src={selectedUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{selectedUser.username ? selectedUser.username[0].toUpperCase() : "U"}</span>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900">{selectedUser.username}</h4>
                                <p className="text-[10px] text-emerald-500 font-medium">Активен</p>
                            </div>
                        </div>

                        {/* Списък със съобщения */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === currentUser.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${isMe
                                                ? "bg-blue-600 text-white rounded-br-xs shadow-xs"
                                                : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs shadow-xs"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ЕМОДЖИ МЕНЮ (EMOJI PICKER) */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-16 left-4 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 grid grid-cols-10 gap-1.5 z-30 max-w-xs animate-in fade-in zoom-in-95 duration-150">
                                {EMOJI_LIST.map((emoji, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => addEmoji(emoji)}
                                        className="text-lg hover:bg-gray-100 p-1 rounded-lg transition transform hover:scale-125 cursor-pointer"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Форма за писане на съобщение */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex items-center space-x-2 bg-white relative">
                            {/* Бутон за Емоджи */}
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2 rounded-xl transition cursor-pointer ${showEmojiPicker ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    }`}
                                title="Добави емоджи"
                            >
                                <Smile className="w-5 h-5" />
                            </button>

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Напиши съобщение..."
                                className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                            />

                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs space-y-2">
                        <MessageSquare className="w-10 h-10 opacity-30" />
                        <p>Избери разговор от лявото меню, за да започнеш чат.</p>
                    </div>
                )}
            </div>

        </div>
    );
}