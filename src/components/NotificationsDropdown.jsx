import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Bell, Heart, MessageCircle, UserPlus, Check } from "lucide-react";

export default function NotificationsDropdown({ currentUser, onSelectPost, onSelectUser }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        fetchNotifications();

        const channel = supabase
            .channel(`notifications:${currentUser.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${currentUser.id}`,
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select(`
          id,
          type,
          post_id,
          is_read,
          created_at,
          actor:actor_id (
            id,
            username,
            avatar_url,
            city
          )
        `)
                .eq("user_id", currentUser.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount((data || []).filter((n) => !n.is_read).length);
        } catch (err) {
            console.error("Грешка при извличане на известия:", err.message);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);

            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", currentUser.id)
                .eq("is_read", false);
        } catch (err) {
            console.error("Грешка при маркиране на известията:", err.message);
        }
    };

    const handleNotificationClick = async (n) => {
        setIsOpen(false);

        // Маркираме конкретното известие като прочетено
        if (!n.is_read) {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", n.id);

            setNotifications((prev) =>
                prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Реакция според типа
        if ((n.type === "like" || n.type === "comment") && n.post_id) {
            if (onSelectPost) onSelectPost(n.post_id);
        } else if (n.type === "follow" && n.actor) {
            if (onSelectUser) onSelectUser(n.actor);
        }
    };

    const getNotificationText = (type) => {
        switch (type) {
            case "like":
                return "хареса твоя публикация.";
            case "comment":
                return "коментира твоя публикация.";
            case "follow":
                return "започна да те следва.";
            default:
                return "направи действие.";
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "like":
                return <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />;
            case "comment":
                return <MessageCircle className="w-3.5 h-3.5 text-blue-500" />;
            case "follow":
                return <UserPlus className="w-3.5 h-3.5 text-green-500" />;
            default:
                return <Bell className="w-3.5 h-3.5 text-gray-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition relative cursor-pointer"
                title="Известия"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-xs text-gray-800">Известия</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[11px] text-blue-600 hover:underline font-medium flex items-center space-x-1"
                                >
                                    <Check className="w-3 h-3" />
                                    <span>Прочетени</span>
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                            {notifications.length === 0 ? (
                                <p className="p-4 text-center text-xs text-gray-400">
                                    Все още нямаш известия.
                                </p>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-3 flex items-start space-x-3 transition cursor-pointer ${!n.is_read ? "bg-blue-50/50 hover:bg-blue-100/50" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs overflow-hidden">
                                                {n.actor?.avatar_url ? (
                                                    <img
                                                        src={n.actor.avatar_url}
                                                        alt={n.actor.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{n.actor?.username ? n.actor.username[0].toUpperCase() : "U"}</span>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs">
                                                {getNotificationIcon(n.type)}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-800 leading-tight">
                                                <span className="font-bold text-gray-900">
                                                    {n.actor?.username || "Някой"}
                                                </span>{" "}
                                                {getNotificationText(n.type)}
                                            </p>
                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                {new Date(n.created_at).toLocaleString("bg-BG", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}