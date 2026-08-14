import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StoriesBar from "./components/StoriesBar";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import FollowingList from "./components/FollowingList";
import GroupList from "./components/GroupList";
import Gallery from "./components/Gallery";
import SettingsPage from "./components/SettingsPage";
import ChatModal from "./components/ChatModal";
import ReelsFeed from "./components/ReelsFeed";
import CreateReelModal from "./components/CreateReelModal";
import Auth from "./components/Auth";

export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshPosts, setRefreshPosts] = useState(0);

  const [chatSelectedUser, setChatSelectedUser] = useState(null);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [refreshReels, setRefreshReels] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Грешка при зареждане на профила:", err);
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar
        currentUser={currentUser}
        userProfile={userProfile}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectUserForChat={(user) => setChatSelectedUser(user)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6">
        <div className="md:col-span-1 lg:col-span-3">
          <Sidebar
            currentUser={currentUser}
            userProfile={userProfile}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Средна колона */}
        <div className="md:col-span-3 lg:col-span-6 space-y-6">
          {activeTab === "feed" && (
            <>
              <StoriesBar currentUser={currentUser} />
              <CreatePost
                currentUser={currentUser}
                onPostCreated={() => setRefreshPosts((prev) => prev + 1)}
              />
              <PostList
                currentUser={currentUser}
                searchQuery={searchQuery}
                refreshTrigger={refreshPosts}
              />
            </>
          )}

          {/* Нов таб за Reels */}
          {activeTab === "reels" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Reels & Видеа</h2>
                  <p className="text-[11px] text-gray-400">Вертикален видео фийд (TikTok style)</p>
                </div>
                <button
                  onClick={() => setIsReelModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  + Качи Reel
                </button>
              </div>

              <ReelsFeed key={refreshReels} currentUser={currentUser} />
            </div>
          )}

          {activeTab === "groups" && <GroupList currentUser={currentUser} />}

          {activeTab === "gallery" && <Gallery currentUser={currentUser} />}

          {activeTab === "settings" && (
            <SettingsPage
              currentUser={currentUser}
              userProfile={userProfile}
              onProfileUpdate={() => fetchUserProfile(currentUser.id)}
            />
          )}
        </div>

        {/* Дясна колона */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <FollowingList
            currentUser={currentUser}
            onStartChat={(user) => setChatSelectedUser(user)}
          />
        </div>
      </main>

      {/* Модал за качване на Reel */}
      {isReelModalOpen && (
        <CreateReelModal
          currentUser={currentUser}
          onClose={() => setIsReelModalOpen(false)}
          onReelCreated={() => setRefreshReels((prev) => prev + 1)}
        />
      )}

      {/* Чат прозорец */}
      {chatSelectedUser && (
        <ChatModal
          currentUser={currentUser}
          selectedUser={chatSelectedUser}
          onClose={() => setChatSelectedUser(null)}
        />
      )}
    </div>
  );
}