"use client"; // อ่านข้อมูลจาก localStorage จึงต้องทำงานในเบราว์เซอร์

import { useEffect, useState } from "react";
import SummaryDashboard from "@/components/SummaryDashboard";
import { loadTransactions, type Transaction } from "@/lib/transactions";

// หน้าสรุป (/summary): อ่านรายการอย่างเดียว ไม่แก้ไขข้อมูล
export default function SummaryPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    setTransactions(loadTransactions());
  }, []);

  if (!transactions) return null;
  return <SummaryDashboard transactions={transactions} />;
}
