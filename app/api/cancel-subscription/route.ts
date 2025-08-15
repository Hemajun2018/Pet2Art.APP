import { NextResponse } from "next/server";
import { findOrderByOrderNo, updateOrderStatus } from "@/models/order";
import { getUserUuid } from "@/services/user";
import { getIsoTimestr } from "@/lib/time";
import { Creem } from "creem";

export async function POST(req: Request) {
  try {
    const { orderNo } = await req.json();
    
    if (!orderNo) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    // 验证用户身份
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // 查找订单
    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 验证订单是否属于当前用户
    if (order.user_uuid !== userUuid) {
      return NextResponse.json({ error: "Unauthorized to modify this order" }, { status: 403 });
    }

    // 检查是否是订阅订单 - 修复判断逻辑
    // 只要 interval 是 month 或 year 就是订阅订单，不一定需要 sub_id（可能还没保存）
    const isSubscription = order.interval === "month" || order.interval === "year";
    if (!isSubscription) {
      return NextResponse.json({ error: "This order is not a subscription" }, { status: 400 });
    }

    // 检查订阅是否已经取消
    if (order.status === "canceled") {
      return NextResponse.json({ error: "Subscription already canceled" }, { status: 400 });
    }

    // 调用 Creem API 取消订阅
    if (order.sub_id) {
      try {
        // 初始化 Creem 客户端
        // 不指定 serverIdx，让 SDK 根据 API key 自动判断
        const creem = new Creem();
        
        // 调用 Creem SDK 取消订阅
        await creem.cancelSubscription({
          xApiKey: process.env.CREEM_API_KEY as string,
          id: order.sub_id,
        });
        
        console.log(`Successfully canceled Creem subscription: ${order.sub_id}`);
      } catch (error) {
        console.error("Failed to cancel Creem subscription:", error);
        // 即使 API 调用失败，也继续更新本地状态
        // 避免用户无法在界面上看到取消状态
      }
    } else {
      // 如果还没有 sub_id（可能 webhook 还没处理），只标记本地状态
      console.log(`Order ${orderNo} marked for cancellation (no subscription ID yet)`);
    }

    // 更新订单状态为取消
    const canceledAt = getIsoTimestr();
    await updateOrderStatus(
      orderNo,
      "canceled",
      canceledAt,
      order.paid_email || order.user_email,
      JSON.stringify({ 
        canceled_at: canceledAt, 
        canceled_by_user: true,
        sub_id: order.sub_id 
      })
    );

    return NextResponse.json({ 
      success: true, 
      message: "Subscription canceled successfully. You will continue to have access until the end of your current billing period." 
    });

  } catch (error: any) {
    console.error("Failed to cancel subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription. Please try again later." },
      { status: 500 }
    );
  }
}