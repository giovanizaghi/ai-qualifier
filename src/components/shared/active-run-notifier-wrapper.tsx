"use client";

import { useEffect, useState } from "react";

import { ActiveRunNotifier } from "./active-run-notifier";

export function ActiveRunNotifierWrapper() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by calling an auth endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          if (data?.user?.id) {
            setUserId(data.user.id);
          }
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading || !userId) {
    return null;
  }

  return <ActiveRunNotifier userId={userId} />;
}
