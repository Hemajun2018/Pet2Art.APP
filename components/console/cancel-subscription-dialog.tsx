"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CancelSubscriptionDialogProps {
  orderNo: string;
  trigger: React.ReactNode;
  onCancel?: () => void;
}

export default function CancelSubscriptionDialog({
  orderNo,
  trigger,
  onCancel,
}: CancelSubscriptionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  const handleCancel = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNo }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t("cancel_subscription.success"));
        setOpen(false);
        onCancel?.();
      } else {
        toast.error(data.error || t("cancel_subscription.error"));
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      toast.error(t("cancel_subscription.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("cancel_subscription.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{t("cancel_subscription.description")}</p>
            <p className="text-sm text-muted-foreground">
              {t("cancel_subscription.warning")}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("cancel_subscription.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Processing..." : t("cancel_subscription.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}