"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  totalGenerated: number;
  totalVisits: number;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) return;
        const response = await fetch(`${apiUrl}/getStats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch {
        // Silent fail - stats are optional
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const cleanUsername = username.replace("@", "").trim();

    if (!cleanUsername) {
      setError("Please enter a username");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/createCollage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramUsername: cleanUsername, year: 2025 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      router.push(`/result/${data.queueId}`);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs">
          {/* Hero */}
          <div className="text-center mb-10">
            <p className="text-7xl font-black tracking-tighter mb-2">
              2025
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-600">
              Insta Best 9
            </h1>
            <p className="text-neutral-400 text-sm mt-3">
              Your top 9 posts this year
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 text-lg">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace("@", ""))}
                placeholder="your username"
                className="w-full pl-10 pr-4 py-4 bg-neutral-50 border-0
                         rounded-2xl text-base placeholder:text-neutral-300
                         focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                disabled={isLoading}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center py-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full py-4 rounded-2xl bg-neutral-900 text-white font-semibold text-base
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-black active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </form>

          {/* Stats */}
          {stats && (
            <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-neutral-100">
              <div className="text-center">
                <p className="text-lg font-bold">{formatNumber(stats.totalGenerated)}</p>
                <p className="text-xs text-neutral-400">generated</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{formatNumber(stats.totalVisits)}</p>
                <p className="text-xs text-neutral-400">visits</p>
              </div>
            </div>
          )}

          {/* Subtext */}
          <p className="text-center text-neutral-300 text-xs mt-6">
            Public accounts only
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8">
        <p className="text-center text-neutral-300 text-xs">
          made by{" "}
          <a
            href="https://www.instagram.com/dev_seochan/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            @seochan
          </a>
        </p>
      </footer>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}
