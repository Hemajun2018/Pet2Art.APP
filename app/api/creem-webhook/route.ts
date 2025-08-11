import { NextRequest, NextResponse } from "next/server";
import { CreemClient, CreemWebhookEvent } from "@/lib/creem";
import { updateOrderSession } from "@/models/order";
import { findUserByEmail } from "@/models/user";
import { increaseCredits } from "@/services/credit";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("x-creem-signature") || "";
    
    // Verify webhook signature
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Creem webhook secret is not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const creem = new CreemClient(process.env.CREEM_API_KEY || "");
    
    // Verify the webhook signature
    const isValid = creem.verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event: CreemWebhookEvent = JSON.parse(body);
    console.log("Received Creem webhook event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      
      case "payment.succeeded":
        await handlePaymentSucceeded(event);
        break;
      
      case "subscription.created":
        await handleSubscriptionCreated(event);
        break;
      
      case "subscription.updated":
        await handleSubscriptionUpdated(event);
        break;
      
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event);
        break;
      
      case "subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(event: CreemWebhookEvent) {
  const session = event.data.object;
  const metadata = session.metadata || {};
  
  const order_no = metadata.order_no;
  const user_email = metadata.user_email || session.customer_email;
  const credits = parseInt(metadata.credits || "0");
  const user_uuid = metadata.user_uuid;
  
  if (!order_no) {
    console.error("No order_no in checkout session metadata");
    return;
  }

  // Update order status
  await updateOrderSession(
    order_no,
    session.id, // Store Creem session ID in the same field
    JSON.stringify(session)
  );

  // Add credits to user
  if (credits > 0 && user_email) {
    let user = await findUserByEmail(user_email);
    if (!user && user_uuid) {
      // If user not found by email, try UUID
      const { findUserByUuid } = await import("@/models/user");
      user = await findUserByUuid(user_uuid);
    }
    
    if (user && user.uuid) {
      await increaseCredits({
        user_uuid: user.uuid,
        trans_type: "order_pay",
        credits: credits,
        order_no: order_no
      });
      console.log(`Added ${credits} credits to user ${user.email}`);
    } else {
      console.error(`User not found for email: ${user_email} or uuid: ${user_uuid}`);
    }
  }
}

async function handlePaymentSucceeded(event: CreemWebhookEvent) {
  const payment = event.data.object;
  console.log("Payment succeeded:", payment.id);
  // Additional payment processing logic if needed
}

async function handleSubscriptionCreated(event: CreemWebhookEvent) {
  const subscription = event.data.object;
  const metadata = subscription.metadata || {};
  
  console.log("Subscription created:", subscription.id);
  
  // Store subscription ID for future reference
  if (metadata.user_email) {
    // You might want to store the subscription ID in your database
    // for future cancellation or management
  }
}

async function handleSubscriptionUpdated(event: CreemWebhookEvent) {
  const subscription = event.data.object;
  console.log("Subscription updated:", subscription.id);
  
  // Handle subscription updates (e.g., plan changes)
}

async function handleSubscriptionCancelled(event: CreemWebhookEvent) {
  const subscription = event.data.object;
  const metadata = subscription.metadata || {};
  
  console.log("Subscription cancelled:", subscription.id);
  
  // Update user's subscription status
  if (metadata.user_email) {
    // Mark subscription as cancelled in your database
    // User still has access until the current period ends
  }
}

async function handleSubscriptionDeleted(event: CreemWebhookEvent) {
  const subscription = event.data.object;
  const metadata = subscription.metadata || {};
  
  console.log("Subscription deleted:", subscription.id);
  
  // Remove user's subscription access
  if (metadata.user_email) {
    // Remove subscription access from user
  }
}