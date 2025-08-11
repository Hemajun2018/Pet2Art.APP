import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, updateOrderSession } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { Order } from "@/types/order";
import { findUserByUuid } from "@/models/user";
import { getSnowId } from "@/lib/hash";
import { getPricingPage } from "@/services/page";
import { PricingItem } from "@/types/blocks/pricing";
import { CreemClient } from "@/lib/creem";

export async function POST(req: Request) {
  try {
    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
      cancel_url,
    } = await req.json();

    if (!cancel_url) {
      cancel_url = `${
        process.env.NEXT_PUBLIC_PAY_CANCEL_URL ||
        process.env.NEXT_PUBLIC_WEB_URL
      }`;
    }

    if (!amount || !interval || !currency || !product_id) {
      return respErr("invalid params");
    }

    // validate checkout params
    const page = await getPricingPage("en");
    if (!page || !page.pricing || !page.pricing.items) {
      return respErr("invalid pricing table");
    }

    const item = page.pricing.items.find(
      (item: PricingItem) => item.product_id === product_id
    );
    if (
      !item ||
      !item.amount ||
      !item.interval ||
      !item.currency ||
      item.amount !== amount ||
      item.interval !== interval ||
      item.currency !== currency
    ) {
      return respErr("invalid checkout params");
    }

    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
    }

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

    const order_no = getSnowId();

    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    let expired_at = "";

    const timePeriod = new Date(currentDate);
    timePeriod.setMonth(currentDate.getMonth() + valid_months);

    const timePeriodMillis = timePeriod.getTime();
    let delayTimeMillis = 0;

    // subscription
    if (is_subscription) {
      delayTimeMillis = 24 * 60 * 60 * 1000; // delay 24 hours expired
    }

    const newTimeMillis = timePeriodMillis + delayTimeMillis;
    const newDate = new Date(newTimeMillis);

    expired_at = newDate.toISOString();

    const order: Order = {
      order_no: order_no,
      created_at: created_at,
      user_uuid: user_uuid,
      user_email: user_email,
      amount: amount,
      interval: interval,
      expired_at: expired_at,
      status: "created",
      credits: credits,
      currency: currency,
      product_id: product_id,
      product_name: product_name,
      valid_months: valid_months,
    };
    await insertOrder(order);

    // Initialize Creem client
    const creemApiKey = process.env.CREEM_API_KEY;
    if (!creemApiKey) {
      throw new Error("Creem API key is not configured");
    }

    const creem = new CreemClient(creemApiKey);

    // Create Creem checkout session
    const session = await creem.createCheckoutSession({
      success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/pay-success/{CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      customer_email: user_email,
      metadata: {
        project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
        product_name: product_name,
        order_no: order_no.toString(),
        user_email: user_email,
        credits: credits.toString(),
        user_uuid: user_uuid,
      },
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: product_name,
                description: `${credits} credits for Pet2Art Studio`,
            },
            unit_amount: amount,
            recurring: is_subscription
              ? {
                  interval: interval as 'month' | 'year',
                }
              : undefined,
          },
          quantity: 1,
        },
      ],
      mode: is_subscription ? "subscription" : "payment",
      allow_promotion_codes: true,
    });

    const creem_session_id = session.id;
    const order_detail = JSON.stringify({
      creem_session: session,
      checkout_params: {
        product_id,
        product_name,
        credits,
        amount,
        currency,
        interval,
      },
    });

    await updateOrderSession(order_no, creem_session_id, order_detail);

    return respData({
      checkout_url: session.url,
      order_no: order_no,
      session_id: creem_session_id,
    });
  } catch (e: any) {
    console.log("creem checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}