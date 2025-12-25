"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import * as PortOne from "@portone/browser-sdk/v2";
import { analytics } from "@/lib/analytics";

interface StatusData {
  queueId: string;
  status: "pending" | "fetching" | "processing" | "completed" | "failed";
  progress: number;
  statusMessage: string;
  instagramUsername: string;
  queuePosition: number;
  totalInQueue: number;
  isPriority: boolean;
  result?: {
    resultUrl: string;
    totalLikes: number;
  };
  error?: string;
}

const SKIP_QUEUE_PRICE = 1000; // 1,000 KRW

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const queueId = params.queueId as string;

  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const completionTracked = useRef(false);

  const pollStatus = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/getStatus?queueId=${queueId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get status");
      }

      setStatus(data);

      if (data.status === "completed" && !completionTracked.current) {
        completionTracked.current = true;
        analytics.generateComplete(data.instagramUsername, data.result?.totalLikes || 0);
      }

      if (data.status === "failed" && !completionTracked.current) {
        completionTracked.current = true;
        analytics.generateFailed(data.instagramUsername, data.error || "Unknown error");
      }

      if (data.status === "completed" || data.status === "failed") {
        return;
      }

      setTimeout(pollStatus, 2000);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [queueId]);

  useEffect(() => {
    pollStatus();
  }, [pollStatus]);

  const handleSkipQueue = async () => {
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

    if (!storeId || !channelKey) {
      alert("Payment is not configured");
      return;
    }

    setIsPaymentLoading(true);

    try {
      const paymentId = `payment-${queueId}-${Date.now()}`;

      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: "Skip Queue - Insta Best 9",
        totalAmount: SKIP_QUEUE_PRICE,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          customerId: queueId,
        },
      });

      if (response?.code) {
        throw new Error(response.message || "Payment failed");
      }

      // Verify payment on server
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const verifyResponse = await fetch(`${apiUrl}/processPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: response?.paymentId,
          queueId,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Payment verification failed");
      }

      // Refresh status
      await pollStatus();
    } catch (err) {
      console.error("Payment error:", err);
      alert((err as Error).message || "Payment failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!status?.result?.resultUrl) return;

    analytics.download(status.instagramUsername);

    try {
      const response = await fetch(status.result.resultUrl);
      if (!response.ok) throw new Error("Image fetch failed");
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
      const a = document.createElement("a");
      a.href = status.result.resultUrl;
      a.download = `best9_${status.instagramUsername}_2025.jpg`;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleShare = async () => {
    if (navigator.share && status?.result?.resultUrl) {
      analytics.share(status.instagramUsername);
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleInstagramShare = async () => {
    if (!status?.result?.resultUrl) return;

    analytics.share(status.instagramUsername);

    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(status.result.resultUrl);
        if (!response.ok) throw new Error("Image fetch failed");
        const blob = await response.blob();
        const file = new File(
          [blob],
          `2025-best9-${status.instagramUsername}.jpg`,
          { type: blob.type || "image/jpeg" }
        );

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `@${status.instagramUsername}'s Best 9`,
            text: "Check out my Best 9 of 2025!",
          });
          return;
        }
      } catch (err) {
        console.error("Instagram share failed:", err);
      }
    }

    window.open(status.result.resultUrl, "_blank", "noopener,noreferrer");
  };
  const shareToTwitter = () => {
    const text = `Check out my Best 9 of 2025! @${status?.instagramUsername}`;
    const url = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareToFacebook = () => {
    const url = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const getEstimatedTime = (position: number) => {
    const secondsPerItem = 30;
    const totalSeconds = position * secondsPerItem;
    if (totalSeconds < 60) return `~${totalSeconds}s`;
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} min`;
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
      if (status?.isPriority) return "Priority processing";
      switch (status?.status) {
        case "fetching":
          return "Finding your posts";
        case "processing":
          return "Creating collage";
        default:
          return "In queue";
      }
    };

    const showQueueInfo = status?.status === "pending" && status.queuePosition > 0;

    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-xs text-center">
            {/* Loading animation */}
            <div className="flex justify-center gap-1.5 mb-8">
              <div className="w-2 h-2 bg-neutral-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-neutral-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-neutral-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>

            <p className="text-neutral-900 font-medium mb-1">
              {getStatusText()}
            </p>

            {status?.instagramUsername && (
              <p className="text-neutral-400 text-sm mb-4">
                @{status.instagramUsername}
              </p>
            )}

            {/* Queue position info */}
            {showQueueInfo && !status.isPriority && (
              <div className="bg-neutral-50 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-500 text-sm">Queue position</span>
                  <span className="font-bold text-lg">
                    #{status.queuePosition}
                    <span className="text-neutral-400 text-sm font-normal">
                      {" "}/ {status.totalInQueue}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">Est. wait</span>
                  <span className="font-medium">
                    {getEstimatedTime(status.queuePosition)}
                  </span>
                </div>
              </div>
            )}

            {/* Priority badge */}
            {status?.isPriority && (
              <div className="inline-flex items-center gap-1.5 bg-neutral-900 text-white px-3 py-1.5 rounded-full text-sm mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Priority
              </div>
            )}

            {/* Skip queue button */}
            {showQueueInfo && !status.isPriority && status.queuePosition > 1 && (
              <button
                onClick={handleSkipQueue}
                disabled={isPaymentLoading}
                className="w-full py-4 bg-neutral-900 text-white font-semibold rounded-2xl
                         hover:bg-black active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPaymentLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                ) : (
                  <>Skip Queue · ₩{SKIP_QUEUE_PRICE.toLocaleString()}</>
                )}
              </button>
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

  // Completed state
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          <p className="text-center text-neutral-400 text-sm mb-3">
            @{status.instagramUsername}
          </p>

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

          <div className="text-center mb-8">
            <span className="text-3xl font-bold">
              {formatNumber(status.result!.totalLikes)}
            </span>
            <span className="text-neutral-400 text-lg ml-2">likes</span>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full py-4 bg-neutral-900 text-white font-semibold rounded-2xl
                     hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Save Image
          </button>

          {/* Share Buttons */}
          <div className="mt-4">
            <p className="text-center text-neutral-400 text-xs mb-3">Share to</p>
            <div className="flex justify-center gap-3">
              {/* Instagram */}
              <button
                onClick={handleInstagramShare}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                title="Share to Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm10 2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2zm-5 3.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm5.25-2.75a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>

              {/* Twitter/X */}
              <button
                onClick={shareToTwitter}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                title="Share to X"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              {/* Facebook */}
              <button
                onClick={shareToFacebook}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                title="Share to Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Native Share */}
              <button
                onClick={handleShare}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                title="Share"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                title="Copy Link"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full py-4 mt-4 text-neutral-400 text-sm hover:text-neutral-900 transition-colors"
          >
            Create another
          </button>
        </div>
      </main>

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
