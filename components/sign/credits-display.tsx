"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { useAppContext } from "@/contexts/app";

export default function CreditsDisplay() {
  const { user } = useAppContext();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserCredits();
    }
  }, [user]);

  const fetchUserCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/get-user-credits", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch credits");
      }

      const { data } = await response.json();
      setCredits(data.left_credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted/50 border border-border">
      <Coins className="w-4 h-4 text-yellow-500" />
      <span className="text-sm font-medium">
        {loading ? "..." : credits.toLocaleString()}
      </span>
    </div>
  );
}