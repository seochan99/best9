"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface StatusData {
  queueId: string;
  status: "pending" | "fetching" | "processing" | "completed" | "failed";
  progress: number;
  statusMessage: string;
  instagramUsername: string;
  result?: {
    resultUrl: string;
    totalLikes: number;
  };
  error?: string;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const queueId = params.queueId as string;

  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const response = await fetch(`${apiUrl}/getStatus?queueId=${queueId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get status");
        }

        setStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          return;
        }

        setTimeout(pollStatus, 2000);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    pollStatus();
  }, [queueId]);

  const handleDownload = async () => {
    if (!status?.result?.resultUrl) return;

    try {
      const response = await fetch(status.result.resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `best9_${status.instagramUsername}_2025.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && status?.result?.resultUrl) {
      try {
        await navigator.share({
          title: `@${status.instagramUsername}'s Best 9`,
          text: "Check out my Best 9 of 2025!",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-full max-w-xs text-center">
          <div className="text-4xl mb-6">:/</div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-neutral-400 text-sm mb-8">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-full
                     hover:bg-black transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!status || status.status !== "completed") {
    const getStatusText = () => {
      switch (status?.status) {
        case "fetching":
          return "Finding your posts";
        case "processing":
          return "Creating collage";
        default:
          return "Getting ready";
      }
    };

    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-xs text-center">
            {/* Loading dots */}
            <div className="flex justify-center gap-1.5 mb-8">
              <div className="w-2 h-2 bg-neutral-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-neutral-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-neutral-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>

            <p className="text-neutral-900 font-medium mb-1">
              {getStatusText()}
            </p>

            {status?.instagramUsername && (
              <p className="text-neutral-400 text-sm">
                @{status.instagramUsername}
              </p>
            )}

            {status?.status === "failed" && (
              <div className="mt-8">
                <p className="text-red-500 text-sm mb-4">{status.error}</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-full"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Completed state
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Username */}
          <p className="text-center text-neutral-400 text-sm mb-3">
            @{status.instagramUsername}
          </p>

          {/* Collage Image */}
          <div className="relative rounded-2xl overflow-hidden bg-neutral-100 shadow-xl mb-6">
            <Image
              src={status.result!.resultUrl}
              alt={`${status.instagramUsername} Best 9`}
              width={1080}
              height={1080}
              className="w-full"
              unoptimized
              priority
            />
          </div>

          {/* Stats */}
          <div className="text-center mb-8">
            <span className="text-3xl font-bold">
              {formatNumber(status.result!.totalLikes)}
            </span>
            <span className="text-neutral-400 text-lg ml-2">likes</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 py-4 bg-neutral-900 text-white font-semibold rounded-2xl
                       hover:bg-black active:scale-[0.98] transition-all"
            >
              Download
            </button>

            <button
              onClick={handleShare}
              className="flex-1 py-4 border border-neutral-200 text-neutral-700 font-semibold rounded-2xl
                       hover:bg-neutral-50 active:scale-[0.98] transition-all"
            >
              Share
            </button>
          </div>

          {/* Create new */}
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 mt-3 text-neutral-400 text-sm hover:text-neutral-900 transition-colors"
          >
            Create another
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6">
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
