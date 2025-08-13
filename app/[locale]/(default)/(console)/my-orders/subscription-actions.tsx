"use client";

import { Button } from "@/components/ui/button";
import CancelSubscriptionDialog from "@/components/console/cancel-subscription-dialog";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface SubscriptionActionsProps {
  order: any;
}

export default function SubscriptionActions({ order }: SubscriptionActionsProps) {
  const t = useTranslations();
  const router = useRouter();

  const handleCancel = () => {
    // Refresh the page to show updated status
    router.refresh();
  };

  // Debug: Log order details to console
  console.log("Order debug info:", {
    order_no: order.order_no,
    sub_id: order.sub_id,
    interval: order.interval,
    status: order.status,
    hasSubId: !!order.sub_id,
    hasInterval: !!order.interval,
    isOnce: order.interval === "once",
    isCanceled: order.status === "canceled"
  });

  // Show cancel button for subscriptions (with or without sub_id for testing)
  if (!order.interval || order.interval === "once" || order.status === "canceled") {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <CancelSubscriptionDialog
      orderNo={order.order_no}
      onCancel={handleCancel}
      trigger={
        <Button variant="outline" size="sm">
          {t("my_orders.table.cancel_subscription")}
        </Button>
      }
    />
  );
}