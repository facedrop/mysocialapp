import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

// Компоненти
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StoriesBar from "./components/StoriesBar";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import ChatModal from "./components/ChatModal";
import GroupList from "./components/GroupList";
import Auth from "./components/Auth";

export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [refreshPosts, setRefreshPosts] = useState(0);

  // Състояние за дясната колона (предложени потребители)
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Проверка за автентикация в Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchSuggestedUsers(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchSuggestedUsers(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Извличане на други потребители от Supabase
  const fetchSuggestedUsers = async (currentUserId) => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId) // Пропускаме текущия логнат потребител
        .limit(5);

      if (error) {
        console.error("Грешка при зареждане на потребители:", error);
      } else {
        setSuggestedUsers(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePostCreated = () => {
    setRefreshPosts((prev) => prev + 1);
  };

  // Ако потребителят не е влязъл, показваме форма за вход / регистрация
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans pb-12">
      {/* 1. ГОРНА ЛЕНТА (NAVBAR) */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenProfile={(userId) => {
          setActiveTab("profile");
        }}
        onSelectChatUser={(user) => setActiveChatUser(user)}
      />

      {/* 2. ОСНОВНО СЪДЪРЖАНИЕ */}
      <main className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-6">

        {/* ЛЯВА КОЛОНА - Навигация (2 колони) */}
        <div className="md:col-span-1 lg:col-span-2">
          <Sidebar
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* ЦЕНТРАЛНА КОЛОНА - Основно съдържание (4 колони) */}
        <div className="md:col-span-3 lg:col-span-4 space-y-4">

          {/* ТАБ ФИЙД */}
          {activeTab === "feed" && (
            <>
              <StoriesBar currentUser={currentUser} />
              <CreatePost
                currentUser={currentUser}
                onPostCreated={handlePostCreated}
              />
              <PostList
                currentUser={currentUser}
                searchQuery={searchQuery}
                refreshTrigger={refreshPosts} /* Ползваме пропс вместо key */
              />
            </>
          )}

          {/* ТАБ ОТКРИВАЙ */}
          {activeTab === "explore" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
              <h3 className="font-bold text-sm text-gray-900">Разгледай</h3>
              <p className="text-xs text-gray-500">
                Използвай търсачката отгоре за намиране на публикации или потребители.
              </p>
            </div>
          )}

          {/* ТАБ ГРУПИ */}
          {activeTab === "groups" && (
            <GroupList
              currentUser={currentUser}
              onSelectGroup={(group) => {
                setSelectedGroup(group);
                console.log("Избрана група:", group);
              }}
            />
          )}

          {/* ТАБ СЪОБЩЕНИЯ */}
          {activeTab === "messages" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
              <h3 className="font-bold text-sm text-gray-900">Съобщения</h3>
              <p className="text-xs text-gray-500">
                Кликни върху иконата за чат в горната лента или избери потребител за започване на разговор.
              </p>
            </div>
          )}

          {/* ТАБ МОЯТ ПРОФИЛ */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
              <h3 className="font-bold text-sm text-gray-900">Моят Профил</h3>
              <p className="text-xs text-gray-500">
                Тук се показват вашите лични публикации и информация за профила.
              </p>
            </div>
          )}

          {/* ТАБ ЗАПАЗЕНИ */}
          {activeTab === "saved" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
              <h3 className="font-bold text-sm text-gray-900">Запазени публикации</h3>
              <p className="text-xs text-gray-500">
                Все още нямате запазени публикации.
              </p>
            </div>
          )}

          {/* ТАБ НАСТРОЙКИ */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
              <h3 className="font-bold text-sm text-gray-900">Настройки</h3>
              <p className="text-xs text-gray-500">
                Управление на акаунта и предпочитанията.
              </p>
            </div>
          )}

        </div>

        {/* ДЯСНА КОЛОНА - ДИНАМИЧНИ ПРЕДЛОЖЕНИ ХОРА И ТРЕНДОВЕ (2 колони) */}
        <div className="hidden lg:block lg:col-span-2 space-y-4 sticky top-20 h-fit">

          {/* Блок: Предложени хора (Динамично от Supabase) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs text-gray-900">Предложени профили</h3>

            {loadingUsers ? (
              <p className="text-[11px] text-gray-400">Зареждане...</p>
            ) : suggestedUsers.length === 0 ? (
              <p className="text-[11px] text-gray-400">Няма други регистрирани потребители.</p>
            ) : (
              <div className="space-y-3">
                {suggestedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (user.username || user.full_name || "U")[0].toUpperCase()
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-gray-800 truncate">
                          {user.full_name || user.username || "Потребител"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          @{user.username || "user"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveChatUser(user)}
                      className="ml-2 px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shrink-0"
                    >
                      Чат
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Блок: Актуално / Трендове */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs text-gray-900">Актуални теми</h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-semibold text-gray-800">#ReactJS</p>
                <p className="text-[10px] text-gray-400">124 публикации</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">#Supabase</p>
                <p className="text-[10px] text-gray-400">89 публикации</p>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* 3. ИЗСКАЧАЩ ПРОЗОРЕЦ ЗА ЧАТ (МЕСЕНДЖЪР) */}
      {activeChatUser && (
        <ChatModal
          currentUser={currentUser}
          chatUser={activeChatUser}
          onClose={() => setActiveChatUser(null)}
        />
      )}
    </div>
  );
}