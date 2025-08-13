import { NextResponse } from "next/server";
import { findOrderByOrderNo, findOrderBySubId, updateOrderStatus } from "@/models/order";
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

    // checkout.completed 事件：处理一次性支付和订阅的首次支付
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
      
      // 检查是否为订阅订单（基于 interval 字段）
      const isSubscription = order.interval === "month" || order.interval === "year";
      
      if (isSubscription) {
        // 对于订阅订单，保存订阅ID
        const subscriptionId = payload.object.id; // Creem 返回的订阅ID
        
        // 导入需要的函数
        const { updateOrderSubscription } = await import("@/models/order");
        
        // 更新订阅信息
        await updateOrderSubscription(
          String(orderNo),
          subscriptionId, // sub_id
          1, // sub_interval_count
          Math.floor(Date.now() / 1000), // sub_cycle_anchor
          Math.floor(Date.now() / 1000) + (order.interval === "month" ? 30 * 24 * 60 * 60 : 365 * 24 * 60 * 60), // sub_period_end
          Math.floor(Date.now() / 1000), // sub_period_start
          "paid",
          paid_at,
          1, // sub_times
          paid_email,
          paid_detail
        );
      } else {
        // 一次性支付，只更新状态
        await updateOrderStatus(String(orderNo), "paid", paid_at, paid_email, paid_detail);
      }

      if (order.user_uuid) {
        if (order.credits > 0) {
          await updateCreditForOrder(order);
        }
        await updateAffiliateForOrder(order);
      }

      return NextResponse.json({ ok: true });
    }

    // 订阅相关事件：subscription.paid / subscription.canceled / subscription.expired
    if (payload.eventType === "subscription.paid") {
      // 处理订阅续费
      console.log("Subscription paid event:", payload.object.id);
      // TODO: 如果需要处理续费，可以在这里添加逻辑
      return NextResponse.json({ ok: true });
    }

    if (payload.eventType === "subscription.canceled") {
      // 处理订阅取消事件
      const subscriptionId = payload.object.id;
      console.log("Processing subscription.canceled event for:", subscriptionId);
      
      try {
        // 通过订阅ID查找订单
        const order = await findOrderBySubId(subscriptionId);
        if (order) {
          // 更新订单状态为已取消
          const canceledAt = getIsoTimestr();
          await updateOrderStatus(
            order.order_no,
            "canceled",
            canceledAt,
            order.paid_email || order.user_email || "",
            JSON.stringify({
              ...payload,
              canceled_by_webhook: true,
              canceled_at: canceledAt
            })
          );
          console.log(`Order ${order.order_no} marked as canceled via webhook`);
        } else {
          console.log(`No order found for subscription ${subscriptionId}`);
        }
      } catch (error) {
        console.error("Error processing subscription.canceled:", error);
      }
      
      return NextResponse.json({ ok: true });
    }

    if (payload.eventType === "subscription.expired") {
      // 处理订阅过期事件
      const subscriptionId = payload.object.id;
      console.log("Processing subscription.expired event for:", subscriptionId);
      
      try {
        // 通过订阅ID查找订单
        const order = await findOrderBySubId(subscriptionId);
        if (order) {
          // 更新订单状态为已过期
          const expiredAt = getIsoTimestr();
          await updateOrderStatus(
            order.order_no,
            "expired",
            expiredAt,
            order.paid_email || order.user_email || "",
            JSON.stringify({
              ...payload,
              expired_at: expiredAt
            })
          );
          console.log(`Order ${order.order_no} marked as expired via webhook`);
        }
      } catch (error) {
        console.error("Error processing subscription.expired:", error);
      }
      
      return NextResponse.json({ ok: true });
    }

    // 其他事件暂不处理
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log("creem webhook failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


