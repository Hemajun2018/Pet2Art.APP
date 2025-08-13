import { getOrdersByPaidEmail, getOrdersByUserUuid } from "@/models/order";
import { getUserEmail, getUserUuid } from "@/services/user";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import OrdersTable from "./orders-table";
import { Separator } from "@/components/ui/separator";

export default async function () {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const user_email = await getUserEmail();

  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-orders`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  let orders = await getOrdersByUserUuid(user_uuid);
  if (!orders || orders.length === 0) {
    orders = await getOrdersByPaidEmail(user_email);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("my_orders.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("my_orders.description")}</p>
      </div>
      <Separator />
      <OrdersTable orders={orders || []} />
    </div>
  );
}
