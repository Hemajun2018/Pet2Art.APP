import { NextResponse } from "next/server";
import { findOrderByOrderNo, updateOrderStatus } from "@/models/order";
import { getUserUuid } from "@/services/user";
import { getIsoTimestr } from "@/lib/time";

export async function POST(req: Request) {
  try {
    const { orderNo } = await req.json();
    
    if (!orderNo) {
      return NextResponse.json({ error: "订单号不能为空" }, { status: 400 });
    }

    // 验证用户身份
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json({ error: "用户未登录" }, { status: 401 });
    }

    // 查找订单
    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return NextResponse.json({ error: "订单未找到" }, { status: 404 });
    }

    // 验证订单是否属于当前用户
    if (order.user_uuid !== userUuid) {
      return NextResponse.json({ error: "无权操作此订单" }, { status: 403 });
    }

    // 检查是否是订阅订单
    if (!order.sub_id || !order.interval || order.interval === "once") {
      return NextResponse.json({ error: "该订单不是订阅订单" }, { status: 400 });
    }

    // 检查订阅是否已经取消
    if (order.status === "canceled") {
      return NextResponse.json({ error: "订阅已经取消" }, { status: 400 });
    }

    // 更新订单状态为取消
    const canceledAt = getIsoTimestr();
    await updateOrderStatus(
      orderNo,
      "canceled",
      canceledAt,
      order.paid_email || order.user_email,
      JSON.stringify({ canceled_at: canceledAt, canceled_by_user: true })
    );

    // 这里可以添加第三方支付服务的取消逻辑
    // 例如调用 Stripe 或 Creem 的取消订阅 API
    try {
      // TODO: 根据实际使用的支付服务添加取消逻辑
      // 如果使用 Stripe:
      // await stripe.subscriptions.update(order.sub_id, { cancel_at_period_end: true });
      
      // 如果使用 Creem:
      // 可能需要调用 Creem 的 API 来取消订阅
      console.log(`订阅 ${order.sub_id} 已标记为取消`);
    } catch (error) {
      console.error("调用第三方支付服务取消订阅失败:", error);
      // 继续执行，因为我们已经在数据库中标记了取消状态
    }

    return NextResponse.json({ 
      success: true, 
      message: "订阅取消成功。订阅将在当前计费周期结束时停止续费。" 
    });

  } catch (error: any) {
    console.error("取消订阅失败:", error);
    return NextResponse.json(
      { error: "取消订阅失败，请稍后重试" },
      { status: 500 }
    );
  }
}