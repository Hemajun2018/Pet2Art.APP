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

    // 调试：打印产品ID和API密钥信息
    console.log("Creating checkout with:");
    console.log("- Product ID:", product_id);
    console.log("- API Key prefix:", apiKey?.substring(0, 10) + "...");
    console.log("- Success URL:", successUrl);

    // 直接使用fetch调用API，绕过SDK
    const checkoutResponse = await fetch("https://api.creem.io/v1/checkouts", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: product_id,
        success_url: successUrl,
        request_id: String(order_no),
        metadata: {
          orderNo: String(order_no),
          email: user_email,
          userId: user_uuid,
          productName: product_name,
          credits: String(credits),
          currency,
          amount: String(amount),
          interval,
        },
      }),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error("Creem API error:", errorText);
      throw new Error(`Creem API error: ${errorText}`);
    }

    const checkout = await checkoutResponse.json();
    console.log("Checkout created successfully:", checkout.id);

    return respData({ checkout_url: checkout.checkout_url, order_no });
  } catch (e: any) {
    console.log("creem checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}


