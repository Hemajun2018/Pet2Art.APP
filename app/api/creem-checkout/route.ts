import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { Order } from "@/types/order";
import { getSnowId } from "@/lib/hash";
import { getPricingPage } from "@/services/page";
import { PricingItem } from "@/types/blocks/pricing";
import { Creem } from "creem";

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
        process.env.NEXT_PUBLIC_PAY_CANCEL_URL || process.env.NEXT_PUBLIC_WEB_URL
      }`;
    }

    if (!amount || !interval || !currency || !product_id) {
      return respErr("invalid params");
    }

    const page = await getPricingPage("en");
    if (!page || !page.pricing || !page.pricing.items) {
      return respErr("invalid pricing table");
    }

    const item = page.pricing.items.find(
      (it: PricingItem) => it.product_id === product_id
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
    if (is_subscription) {
      // 订阅单额外延迟有效期一天，避免临界点
      delayTimeMillis = 24 * 60 * 60 * 1000;
    }
    const newTimeMillis = timePeriodMillis + delayTimeMillis;
    const newDate = new Date(newTimeMillis);
    expired_at = newDate.toISOString();

    const order: Order = {
      order_no,
      created_at,
      user_uuid,
      user_email,
      amount,
      interval,
      expired_at,
      status: "created",
      credits,
      currency,
      product_id,
      product_name,
      valid_months,
    };
    await insertOrder(order);

    const apiKey = process.env.CREEM_API_KEY;
    const successUrl = process.env.SUCCESS_URL || process.env.NEXT_PUBLIC_PAY_SUCCESS_URL;
    if (!apiKey || !successUrl) {
      return respErr("invalid creem config");
    }

    const serverIdxStr = process.env.CREEM_SERVER_IDX;
    const serverIdx = serverIdxStr ? Number(serverIdxStr) : 1; // 1: test server per template
    const creem = new Creem({ serverIdx });

    const checkout = await creem.createCheckout({
      xApiKey: apiKey,
      createCheckoutRequest: {
        productId: product_id,
        successUrl,
        // 使用订单号作为 requestId，方便 webhook 直接定位订单
        requestId: String(order_no),
        metadata: {
          orderNo: String(order_no),
          email: user_email,
          userId: user_uuid,
          productName: product_name,
          credits,
          currency,
          amount,
          interval,
        },
      },
    });

    return respData({ checkout_url: checkout.checkoutUrl, order_no });
  } catch (e: any) {
    console.log("creem checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}


