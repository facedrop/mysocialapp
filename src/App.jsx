import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import FollowingList from "./components/FollowingList";
import SuggestedUsers from "./components/SuggestedUsers";
import Gallery from "./components/Gallery";
import Sidebar from "./components/Sidebar";
import SettingsPage from "./components/SettingsPage";
import EditProfileModal from "./components/EditProfileModal";
import NotificationsDropdown from "./components/NotificationsDropdown";
import ChatModal from "./components/ChatModal";
import PostModal from "./components/PostModal";
import {
  LogOut,
  MapPin,
  Sparkles,
  Search,
  X,
  Bookmark,
  Users
} from "lucide-react";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [refreshPosts, setRefreshPosts] = useState(0);
  const [refreshFollows, setRefreshFollows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // По подразбиране стартираме с 'feed' (Начало) или 'gallery'
  const [activeTab, setActiveTab] = useState("feed");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel(`global_chat:${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${session.user.id}`,
        },
        async (payload) => {
          const newMsg = payload.new;

          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, city")
            .eq("id", newMsg.sender_id)
            .single();

          if (senderProfile) {
            setActiveChatUser(senderProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url, city, birth_date, bio")
        .eq("id", session.user.id)
        .single();

      if (data) setProfile(data);
    } catch (err) {
      console.error("Грешка при зареждане на профила:", err.message);
    }
  };

  const handlePostCreated = () => {
    setRefreshPosts((prev) => prev + 1);
  };

  const handleFollowToggle = () => {
    setRefreshFollows((prev) => prev + 1);
    setRefreshPosts((prev) => prev + 1);
  };

  if (!session) {
    return <Auth />;
  }

  const currentUser = session.user;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            onClick={() => setActiveTab("feed")}
            className="flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-[#1d4ed8]" />
            <h1 className="text-xl font-black text-[#1d4ed8] tracking-tight hidden sm:block">
              MySocialNet
            </h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търси публикации или автори..."
                className="w-full bg-gray-100 focus:bg-white text-xs text-gray-800 pl-9 pr-8 py-2 rounded-full border border-transparent focus:border-[#1d4ed8] focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <NotificationsDropdown
              currentUser={currentUser}
              onSelectPost={(postId) => setSelectedPostId(postId)}
              onSelectUser={(user) => setActiveChatUser(user)}
            />

            <div
              onClick={() => setActiveTab("settings")}
              className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-gray-100 rounded-lg transition"
              title="Настройки на профила"
            >
              <div className="w-8 h-8 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-gray-200">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {currentUser?.email ? currentUser.email[0].toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-gray-700 leading-none">
                  {profile?.username || currentUser?.email?.split("@")[0]}
                </div>
                {profile?.city && (
                  <div className="text-[10px] text-gray-400 flex items-center mt-0.5">
                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                    {profile.city}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Изход"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="md:col-span-3">
          <div className="sticky top-20">
            <Sidebar
              currentUser={currentUser}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onEditProfile={() => setActiveTab("settings")}
            />
          </div>
        </aside>

        {/* CENTER COLUMN */}
        <section className="md:col-span-5 lg:col-span-6 space-y-4">
          {activeTab === "gallery" && (
            <Gallery
              currentUser={currentUser}
              onSelectPost={(postId) => setSelectedPostId(postId)}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage
              currentUser={currentUser}
              onProfileUpdated={fetchProfile}
            />
          )}

          {activeTab === "friends" && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Моите Приятели
              </h2>
              <FollowingList
                currentUser={currentUser}
                refreshTrigger={refreshFollows}
                onOpenChat={(user) => setActiveChatUser(user)}
              />
            </div>
          )}

          {activeTab === "saved" && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-center text-gray-500 text-xs">
              <Bookmark className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-gray-700">Запазени публикации</p>
              <p className="mt-1">Нямате запазени публикации все още.</p>
            </div>
          )}

          {activeTab === "feed" && (
            <>
              <CreatePost
                currentUser={currentUser}
                onPostCreated={handlePostCreated}
              />
              <PostList
                currentUser={currentUser}
                searchQuery={searchQuery}
                key={refreshPosts}
              />
            </>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-4">
          <div className="sticky top-20 space-y-4">
            <FollowingList
              currentUser={currentUser}
              refreshTrigger={refreshFollows}
              onOpenChat={(user) => setActiveChatUser(user)}
            />
            <SuggestedUsers
              currentUser={currentUser}
              onFollowToggle={handleFollowToggle}
            />
          </div>
        </aside>
      </main>

      {/* Modals & Widgets */}
      {isEditProfileOpen && (
        <EditProfileModal
          currentUser={currentUser}
          profile={profile}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={fetchProfile}
        />
      )}

      {activeChatUser && (
        <ChatModal
          currentUser={currentUser}
          targetUser={activeChatUser}
          onClose={() => setActiveChatUser(null)}
        />
      )}

      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          currentUser={currentUser}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}