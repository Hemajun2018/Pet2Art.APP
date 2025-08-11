import { NextResponse } from "next/server";
import { findOrderByOrderNo, updateOrderStatus } from "@/models/order";
import { getIsoTimestr } from "@/lib/time";
import { increaseCredits, updateCreditForOrder } from "@/services/credit";
import { updateAffiliateForOrder } from "@/services/affiliate";

// 适配 creem-template 的 webhook 结构（精简版）
interface CreemWebhookEvent {
  id: string;
  eventType: string;
  object: {
    request_id?: string; // 我们在 createCheckout 里用 order_no 作为 requestId
    id: string; // 支付/订阅 id
    customer?: { id: string };
    product?: { id: string; billing_type?: string };
    status?: string;
    metadata?: any;
  };
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as CreemWebhookEvent;

    // 一次性支付：checkout.completed
    if (payload.eventType === "checkout.completed") {
      const orderNo = payload.object.request_id || payload.object.metadata?.orderNo;
      if (!orderNo) {
        return NextResponse.json({ error: "invalid orderNo" }, { status: 400 });
      }

      const order = await findOrderByOrderNo(String(orderNo));
      if (!order) {
        return NextResponse.json({ error: "order not found" }, { status: 404 });
      }

      if (order.status !== "created") {
        // 幂等
        return NextResponse.json({ ok: true });
      }

      const paid_at = getIsoTimestr();
      const paid_email = payload.object.metadata?.email || order.user_email || "";
      const paid_detail = JSON.stringify(payload);

      await updateOrderStatus(String(orderNo), "paid", paid_at, paid_email, paid_detail);

      if (order.user_uuid) {
        if (order.credits > 0) {
          await updateCreditForOrder(order);
        }
        await updateAffiliateForOrder(order);
      }

      return NextResponse.json({ ok: true });
    }

    // 订阅相关事件：subscription.paid / subscription.canceled / subscription.expired
    if (
      payload.eventType === "subscription.paid" ||
      payload.eventType === "subscription.canceled" ||
      payload.eventType === "subscription.expired"
    ) {
      // 如果你希望支持订阅续费与状态管理，可在此扩展：
      // 目前先记录日志并返回 200，避免阻塞
      console.log("creem subscription event:", payload.eventType, payload.id);
      return NextResponse.json({ ok: true });
    }

    // 其他事件暂不处理
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log("creem webhook failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


