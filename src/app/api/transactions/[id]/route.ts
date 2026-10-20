import { requireUser, type SessionUser } from "@/lib/server/auth";
import { TRANSACTION_SELECT, db, toTransaction, type TransactionRow } from "@/lib/server/db";
import { handle, readJson } from "@/lib/server/handle";
import { parseTransaction } from "@/lib/server/validate";

const UUID = /^[0-9a-f-]{36}$/i;

// เจ้าของรายการ หรือ admin เท่านั้นที่แก้/ลบได้ (คนอื่นจะได้ 404 เหมือนไม่มีรายการนี้)
async function findOwned(id: string, user: SessionUser) {
  if (!UUID.test(id)) return null;
  const { data } = await db().from("transactions").select("id, user_id").eq("id", id).maybeSingle();
  if (!data || (user.role !== "admin" && data.user_id !== user.id)) return null;
  return data;
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/transactions/[id]">) {
  return handle(async () => {
    const user = await requireUser();
    if (user instanceof Response) return user;
    const { id } = await ctx.params;
    if (!(await findOwned(id, user))) return Response.json({ error: "not_found" }, { status: 404 });

    const input = parseTransaction((await readJson(request)).item);
    if (!input) return Response.json({ error: "invalid" }, { status: 400 });

    // แก้ได้เฉพาะข้อมูลรายการ เจ้าของเดิมคงเดิม
    const { data, error } = await db().from("transactions").update(input).eq("id", id).select(TRANSACTION_SELECT).single();
    if (error) throw error;
    return Response.json({ transaction: toTransaction(data as unknown as TransactionRow) });
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/transactions/[id]">) {
  return handle(async () => {
    const user = await requireUser();
    if (user instanceof Response) return user;
    const { id } = await ctx.params;
    if (!(await findOwned(id, user))) return Response.json({ error: "not_found" }, { status: 404 });

    const { error } = await db().from("transactions").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  });
}
