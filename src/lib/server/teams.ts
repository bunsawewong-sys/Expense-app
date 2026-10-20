// แจ้งเตือนเข้า Microsoft Teams (ทีม ExpenseTeam ช่อง Announcement) เป็น Adaptive Card
// ส่งผ่าน Teams Workflows: "Post to a channel when a webhook request is received" → ได้ URL มาใส่ TEAMS_WEBHOOK_URL
import { getCategory } from "@/lib/categories";
import { CURRENCIES, formatMoney, type CurrencyCode } from "@/lib/currencies";
import type { SessionUser } from "@/lib/server/auth";
import { formatDate, sumByCurrency, type TransactionInput } from "@/lib/transactions";
import { env } from "@/lib/server/env";
import { locationLabel, mapsUrl } from "@/lib/location";

const MAX_ROWS = 10; // การ์ดยาวเกินไปอ่านยาก แสดงสูงสุด 10 รายการ ที่เหลือบอกเป็นจำนวน

function buildCard(user: SessionUser, items: TransactionInput[]) {
  const now = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date());

  const rows = items.slice(0, MAX_ROWS).map((t) => {
    const category = getCategory(t.type, t.category);
    const isIncome = t.type === "income";
    return {
      type: "ColumnSet",
      spacing: "Medium",
      separator: true,
      columns: [
        { type: "Column", width: "auto", verticalContentAlignment: "Center", items: [{ type: "TextBlock", text: category.icon, size: "ExtraLarge" }] },
        {
          type: "Column",
          width: "stretch",
          items: [
            { type: "TextBlock", text: `${category.name.th} · ${isIncome ? "รายรับ" : "รายจ่าย"}`, weight: "Bolder", wrap: true },
            { type: "TextBlock", text: [formatDate(t.date, "th"), t.note].filter(Boolean).join(" · "), isSubtle: true, spacing: "None", wrap: true, size: "Small" },
            // 📍 ชื่อสถานที่ กดแล้วเปิด Google Maps (ไม่มีตำแหน่ง = ไม่แสดงบรรทัดนี้)
            ...(t.location && locationLabel(t.location)
              ? [{ type: "TextBlock", text: `📍 [${locationLabel(t.location).replace(/[[\]]/g, "")}](${mapsUrl(t.location)})`, spacing: "None", wrap: true, size: "Small" }]
              : []),
          ],
        },
        {
          type: "Column",
          width: "auto",
          verticalContentAlignment: "Center",
          items: [
            {
              type: "TextBlock",
              text: `${isIncome ? "+" : "−"}${formatMoney(t.amount, t.currency)}`,
              weight: "Bolder",
              size: "Medium",
              color: isIncome ? "Good" : "Attention",
            },
          ],
        },
      ],
    };
  });

  const totals = sumByCurrency(items.map((t, i) => ({ ...t, id: String(i) })));
  const more = items.length - MAX_ROWS;
  const appUrl = env("APP_URL");

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.5",
    msteams: { width: "Full" },
    body: [
      {
        type: "Container",
        style: "accent",
        bleed: true,
        items: [
          { type: "TextBlock", text: "💸 บันทึกรายการใหม่", size: "Large", weight: "Bolder", wrap: true },
          {
            type: "TextBlock",
            text: `${user.displayName} (@${user.username}) · ${items.length} รายการ · ${now}`,
            isSubtle: true,
            spacing: "None",
            wrap: true,
          },
        ],
      },
      ...rows,
      ...(more > 0 ? [{ type: "TextBlock", text: `…และอีก ${more} รายการ`, isSubtle: true, spacing: "Medium" }] : []),
      {
        type: "FactSet",
        spacing: "Large",
        separator: true,
        facts: totals.flatMap((total) => {
          const code = total.currency as CurrencyCode;
          const label = CURRENCIES.find((c) => c.code === code)?.code ?? code;
          return [
            ...(total.income > 0 ? [{ title: `รายรับ (${label})`, value: formatMoney(total.income, code) }] : []),
            ...(total.expense > 0 ? [{ title: `รายจ่าย (${label})`, value: formatMoney(total.expense, code) }] : []),
          ];
        }),
      },
    ],
    actions: appUrl ? [{ type: "Action.OpenUrl", title: "เปิดแอป", url: appUrl }] : [],
  };
}

// ส่งการ์ด 1 ใบต่อการบันทึก 1 ครั้ง (หลายสลิปพร้อมกัน = 1 ใบรวม)
// ส่งไม่ผ่านก็ไม่เป็นไร: รายการถูกบันทึกแล้ว แค่เขียน log ไว้
export async function notifyTransactions(user: SessionUser, items: TransactionInput[]) {
  const url = env("TEAMS_WEBHOOK_URL");
  if (!url || items.length === 0) return { sent: false as const, reason: "not_configured" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "message",
        attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", contentUrl: null, content: buildCard(user, items) }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("Teams webhook failed:", response.status, await response.text().catch(() => ""));
      return { sent: false as const, reason: `http_${response.status}` };
    }
    return { sent: true as const };
  } catch (err) {
    console.error("Teams webhook error:", err);
    return { sent: false as const, reason: "network" };
  }
}
