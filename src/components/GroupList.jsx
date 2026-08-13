import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Users, Plus, X, Shield, ArrowRight } from "lucide-react";

export default function GroupList({ currentUser, onSelectGroup }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Полета за новата група
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [creating, setCreating] = useState(false);

    // Зареждане на групите, в които членува потребителят
    const fetchGroups = async () => {
        setLoading(true);
        try {
            // 1. Вземаме ID-тата на групите, на които потребителят е член
            const { data: memberData, error: memberError } = await supabase
                .from("group_members")
                .select("group_id")
                .eq("user_id", currentUser.id);

            if (memberError) throw memberError;

            const groupIds = (memberData || []).map((m) => m.group_id);

            if (groupIds.length > 0) {
                // 2. Вземаме данните за самите групи
                const { data: groupsData, error: groupsError } = await supabase
                    .from("groups")
                    .select("*")
                    .in("id", groupIds)
                    .order("created_at", { ascending: false });

                if (groupsError) throw groupsError;
                setGroups(groupsData || []);
            } else {
                setGroups([]);
            }
        } catch (err) {
            console.error("Грешка при зареждане на групите:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.id) {
            fetchGroups();
        }
    }, [currentUser]);

    // Създаване на нова група
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return;

        setCreating(true);
        try {
            // 1. Вмъкваме новата група
            const { data: newGroup, error: groupError } = await supabase
                .from("groups")
                .insert([
                    {
                        name: groupName.trim(),
                        description: groupDescription.trim(),
                        created_by: currentUser.id,
                    },
                ])
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Добавяме създателя като член/админ в group_members
            const { error: memberError } = await supabase.from("group_members").insert([
                {
                    group_id: newGroup.id,
                    user_id: currentUser.id,
                    role: "admin",
                },
            ]);

            if (memberError) throw memberError;

            // Нулиране на формата и презареждане
            setGroupName("");
            setGroupDescription("");
            setShowModal(false);
            fetchGroups();
        } catch (err) {
            console.error("Грешка при създаване на група:", err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Горна лента с бутон за създаване */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-gray-900">Моите Групи</h2>
                        <p className="text-xs text-gray-500">
                            Групите, в които членуваш и участваш
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                    <Plus className="w-4 h-4" />
                    <span>Създай група</span>
                </button>
            </div>

            {/* Списък с групи */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-xs text-gray-400">
                    Зареждане на групите...
                </div>
            ) : groups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-xs text-gray-800"> Все още не членуваш в групи</p>
                        <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                            Създай първата си група и покани приятели да се присъединят!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            onClick={() => onSelectGroup && onSelectGroup(group)}
                            className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 transition cursor-pointer shadow-2xs flex flex-col justify-between space-y-3 group"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-gray-700 flex items-center justify-center font-bold text-sm overflow-hidden">
                                        {group.cover_url ? (
                                            <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{group.name[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    {group.created_by === currentUser.id && (
                                        <span className="flex items-center space-x-1 text-[10px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">
                                            <Shield className="w-3 h-3" />
                                            <span>Админ</span>
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xs text-gray-900 group-hover:text-blue-600 transition">
                                        {group.name}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                                        {group.description || "Няма добавено описание."}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                                <span>Виж групата</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-blue-600" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* МОДАЛЕН ПРОЗОРЕЦ ЗА СЪЗДАВАНЕ НА ГРУПА */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">

                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-sm text-gray-900">Създаване на нова група</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroup} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Име на групата *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="напр. Разработчици Пловдив"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-blue-600 focus:outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Описание
                                </label>
                                <textarea
                                    rows={3}
                                    value={groupDescription}
                                    onChange={(e) => setGroupDescription(e.target.value)}
                                    placeholder="За какво е тази група?"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-blue-600 focus:outline-none transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                                >
                                    Отказ
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !groupName.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                                >
                                    {creating ? "Създаване..." : "Създай"}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}