import React, { useState, useEffect } from "react";
import { Newspaper, TrendingUp, ExternalLink, RefreshCw, Loader2, X } from "lucide-react";

export default function NewsTab() {
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [activeTag, setActiveTag] = useState(null);

    // Стабилно CORS прокси и списък с източници за резерв
    // В NewsTab.jsx смени списъка с източници:
    const RSS_FEEDS = [
        {
            name: "Dir.bg",
            url: "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://dir.bg/rss"),
        },
        {
            name: "Nova News",
            url: "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://nova.bg/rss"),
        },
    ];

    const fetchNews = async () => {
        setLoading(true);
        let success = false;

        for (const feedUrl of FEEDS) {
            if (success) break;
            try {
                // corsproxy.io препраща заявката чисто и без 522 грешки
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`;
                const response = await fetch(proxyUrl);

                if (!response.ok) continue;

                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 10);

                if (items.length > 0) {
                    const formattedNews = items.map((item, index) => {
                        const title = item.querySelector("title")?.textContent || "Без заглавие";
                        const link = item.querySelector("link")?.textContent || "#";
                        const pubDate = item.querySelector("pubDate")?.textContent;
                        const category = item.querySelector("category")?.textContent || "България";

                        const formattedTime = pubDate
                            ? new Date(pubDate).toLocaleTimeString("bg-BG", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "Днес";

                        return {
                            id: index,
                            title,
                            url: link,
                            time: formattedTime,
                            source: feedUrl.includes("dnevnik") ? "Дневник" : "БНТ",
                            category,
                        };
                    });

                    setNewsItems(formattedNews);
                    setLastUpdated(
                        new Date().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })
                    );
                    success = true;
                }
            } catch (err) {
                console.warn(`Неуспешно зареждане от ${feedUrl}:`, err);
            }
        }

        if (!success) {
            console.error("Всички източници за новини бяха недостъпни.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNews();
        const interval = setInterval(() => fetchNews(), 300000);
        return () => clearInterval(interval);
    }, []);

    const trendingTopics = ["България", "Технологии", "Бизнес", "Спорт", "Свят"];

    const filteredNews = activeTag
        ? newsItems.filter(
            (item) =>
                item.title.toLowerCase().includes(activeTag.toLowerCase()) ||
                item.category.toLowerCase().includes(activeTag.toLowerCase())
        )
        : newsItems.slice(0, 5);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-5">
            {/* Секция Хаштагове */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span>Популярни теми</span>
                    </div>
                    {activeTag && (
                        <button
                            onClick={() => setActiveTag(null)}
                            className="text-[10px] text-blue-600 hover:underline flex items-center space-x-0.5"
                        >
                            <span>Покажи всички</span>
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {trendingTopics.map((tag, i) => {
                        const isActive = activeTag === tag;
                        return (
                            <button
                                key={i}
                                onClick={() => setActiveTag(isActive ? null : tag)}
                                className={`text-xs font-medium px-2.5 py-1 rounded-full transition cursor-pointer ${isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    }`}
                            >
                                #{tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Секция Новини */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <Newspaper className="w-4 h-4 text-blue-600" />
                        <span>{activeTag ? `Новини: #${activeTag}` : "Актуални новини"}</span>
                    </div>

                    <button
                        onClick={fetchNews}
                        disabled={loading}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-lg transition"
                        title="Обнови"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                </div>

                {loading && newsItems.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-gray-400 space-x-2 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Зареждане...</span>
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                        Няма намерени новини за #{activeTag}.
                        <br />
                        <a
                            href={`https://news.google.com/search?q=${encodeURIComponent(activeTag || "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mt-1 inline-block"
                        >
                            Търси в Google News ↗
                        </a>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNews.map((item) => (
                            <a
                                key={item.id}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2.5 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100 cursor-pointer group"
                            >
                                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                    <span className="font-semibold text-blue-600 uppercase tracking-wider">
                                        {item.category}
                                    </span>
                                    <span>{item.time} ч.</span>
                                </div>
                                <h4 className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition leading-snug">
                                    {item.title}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center space-x-1">
                                    <span>{item.source}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-gray-400 group-hover:text-blue-600 transition" />
                                </p>
                            </a>
                        ))}
                    </div>
                )}

                {lastUpdated && (
                    <p className="text-[10px] text-gray-400 text-right mt-3">
                        Последно обновени в {lastUpdated} ч.
                    </p>
                )}
            </div>
        </div>
    );
}