"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader } from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  product_name?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  current_period_end?: string;
}

export default function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "GET",
      });

      const { code, data, message } = await response.json();
      
      if (code === 0) {
        setSubscriptions(data.subscriptions || []);
      } else {
        console.error("Failed to fetch subscriptions:", message);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription? You will continue to have access until the end of your billing period.")) {
      return;
    }

    setIsCancelling(subscriptionId);
    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      const { code, data, message } = await response.json();

      if (code === 0) {
        toast.success(data.message || "Subscription cancelled successfully");
        await fetchSubscriptions(); // Refresh the list
      } else {
        toast.error(message || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsCancelling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

  if (activeSubscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have any active subscriptions. 
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            If you believe this is an error, please contact support@petart.studio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeSubscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{subscription.product_name || "Subscription"}</span>
              <span className="text-sm font-normal text-muted-foreground">
                Status: {subscription.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscription.amount && subscription.currency && (
                <p className="text-sm">
                  <strong>Amount:</strong> {subscription.currency.toUpperCase()} {(subscription.amount / 100).toFixed(2)} / {subscription.interval}
                </p>
              )}
              {subscription.current_period_end && (
                <p className="text-sm">
                  <strong>Current period ends:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
              <div className="pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleCancelSubscription(subscription.id)}
                  disabled={isCancelling === subscription.id}
                >
                  {isCancelling === subscription.id ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  You will continue to have access until the end of your billing period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Need help?</strong> Contact us at support@petart.studio or visit the{" "}
          <a href="https://creem.io/portal" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            Creem Customer Portal
          </a>{" "}
          for more options.
        </p>
      </div>
    </div>
  );
}