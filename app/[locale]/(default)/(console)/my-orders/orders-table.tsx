"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import moment from "moment";
import SubscriptionActions from "./subscription-actions";

interface OrdersTableProps {
  orders: any[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const t = useTranslations();

  if (!orders || orders.length === 0) {
    return (
      <div className="flex w-full justify-center items-center py-8 text-muted-foreground">
        <p>{t("my_orders.no_orders")}</p>
      </div>
    );
  }

  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>{t("my_orders.table.order_no")}</TableHead>
          <TableHead>{t("my_orders.table.email")}</TableHead>
          <TableHead>{t("my_orders.table.product_name")}</TableHead>
          <TableHead>{t("my_orders.table.amount")}</TableHead>
          <TableHead>{t("my_orders.table.paid_at")}</TableHead>
          <TableHead>{t("my_orders.table.subscription_status")}</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order, idx) => (
          <TableRow key={idx} className="h-16">
            <TableCell className="font-mono text-sm">{order.order_no}</TableCell>
            <TableCell>{order.paid_email || order.user_email}</TableCell>
            <TableCell>{order.product_name}</TableCell>
            <TableCell>
              {`${order.currency.toUpperCase() === "CNY" ? "¥" : "$"} ${
                order.amount / 100
              }`}
            </TableCell>
            <TableCell>
              {moment(order.paid_at).format("YYYY-MM-DD HH:mm:ss")}
            </TableCell>
            <TableCell>
              {!order.interval || order.interval === "once" 
                ? "-" 
                : order.status === "canceled" 
                  ? t("my_orders.table.canceled")
                  : "Active"
              }
            </TableCell>
            <TableCell>
              <SubscriptionActions order={order} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}