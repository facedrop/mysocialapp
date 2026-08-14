import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StoriesBar from "./components/StoriesBar";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import FollowingList from "./components/FollowingList"; // Горният блок (Истински приятели)
import GroupList from "./components/GroupList";
import SettingsPage from "./components/SettingsPage";
import ChatModal from "./components/ChatModal";
import Auth from "./components/Auth";

export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshPosts, setRefreshPosts] = useState(0);

  // Избран потребител за активен чат
  const [chatSelectedUser, setChatSelectedUser] = useState(null);

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

          {activeTab === "groups" && <GroupList currentUser={currentUser} />}

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
          {/* Оставяме само горния блок с приятелите */}
          <FollowingList
            currentUser={currentUser}
            onStartChat={(user) => setChatSelectedUser(user)}
          />
        </div>
      </main>

      {/* Прозорец за Чат долу вдясно */}
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