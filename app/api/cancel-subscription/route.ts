import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { CreemClient } from "@/lib/creem";
import { findUserByUuid } from "@/models/user";

export async function POST(req: Request) {
  try {
    const { subscription_id } = await req.json();

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      const user = await findUserByUuid(user_uuid);
      if (user) {
        user_email = user.email;
      }
    }
    if (!user_email) {
      return respErr("invalid user");
    }

    const creemApiKey = process.env.CREEM_API_KEY;
    if (!creemApiKey) {
      return respErr("Payment system not configured");
    }

    const creem = new CreemClient(creemApiKey);

    try {
      // If subscription_id is provided, cancel specific subscription
      if (subscription_id) {
        await creem.cancelSubscription(subscription_id);
        return respData({
          success: true,
          message: "Subscription cancelled successfully. You will continue to have access until the end of your billing period.",
        });
      }

      // Otherwise, find and cancel all subscriptions for this user
      const subscriptions = await creem.listCustomerSubscriptions(user_email);
      
      if (!subscriptions || subscriptions.length === 0) {
        return respErr("No active subscriptions found");
      }

      // Cancel all active subscriptions
      const cancellationPromises = subscriptions
        .filter((sub: any) => sub.status === 'active')
        .map((sub: any) => creem.cancelSubscription(sub.id));

      await Promise.all(cancellationPromises);

      return respData({
        success: true,
        message: `Successfully cancelled ${cancellationPromises.length} subscription(s). You will continue to have access until the end of your billing period.`,
      });
    } catch (error: any) {
      console.error("Failed to cancel subscription:", error);
      return respErr(`Failed to cancel subscription: ${error.message}`);
    }
  } catch (e: any) {
    console.log("cancel subscription failed: ", e);
    return respErr("cancel subscription failed: " + e.message);
  }
}

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      const user = await findUserByUuid(user_uuid);
      if (user) {
        user_email = user.email;
      }
    }
    if (!user_email) {
      return respErr("invalid user");
    }

    const creemApiKey = process.env.CREEM_API_KEY;
    if (!creemApiKey) {
      return respErr("Payment system not configured");
    }

    const creem = new CreemClient(creemApiKey);

    try {
      const subscriptions = await creem.listCustomerSubscriptions(user_email);
      
      return respData({
        subscriptions: subscriptions || [],
      });
    } catch (error: any) {
      console.error("Failed to list subscriptions:", error);
      return respErr(`Failed to list subscriptions: ${error.message}`);
    }
  } catch (e: any) {
    console.log("list subscriptions failed: ", e);
    return respErr("list subscriptions failed: " + e.message);
  }
}