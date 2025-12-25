declare global {
  interface Window {
    gtag: (
      command: "event",
      action: string,
      params?: Record<string, string | number | boolean>
    ) => void;
  }
}

export const trackEvent = (
  action: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
};

export const analytics = {
  generateStart: (username: string) => {
    trackEvent("generate_start", {
      username,
      year: 2025,
    });
  },

  generateComplete: (username: string, totalLikes: number) => {
    trackEvent("generate_complete", {
      username,
      total_likes: totalLikes,
      year: 2025,
    });
  },

  generateFailed: (username: string, error: string) => {
    trackEvent("generate_failed", {
      username,
      error,
      year: 2025,
    });
  },

  download: (username: string) => {
    trackEvent("download", {
      username,
      year: 2025,
    });
  },

  share: (username: string) => {
    trackEvent("share", {
      username,
      year: 2025,
    });
  },

  skipQueue: (username: string, amount: number) => {
    trackEvent("skip_queue", {
      username,
      amount,
      year: 2025,
    });
  },

  pageView: (page: string) => {
    trackEvent("page_view", {
      page,
    });
  },
};
