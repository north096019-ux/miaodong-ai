const env: { DB?: any } = {};

export async function POST(request: Request) {
  const body = (await request.json()) as { reportId?: string; helpful?: boolean; note?: string };
  if (!body.reportId || typeof body.helpful !== "boolean") return Response.json({ error: "反馈信息不完整" }, { status: 400 });
  if (env.DB) await env.DB.prepare("INSERT INTO feedback (id, report_id, helpful, note, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), body.reportId, body.helpful ? 1 : 0, body.note?.trim() || "", new Date().toISOString()).run();
  return Response.json({ ok: true });
}
