const env: { DB?: any } = {};

export async function GET() {
  if (!env.DB) return Response.json({ cats: [] });
  const result = await env.DB.prepare("SELECT id, name, breed, age, notes, created_at AS createdAt FROM cats ORDER BY created_at DESC").all();
  return Response.json({ cats: result.results });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; breed?: string; age?: string; notes?: string };
  if (!body.name?.trim()) return Response.json({ error: "请填写猫咪名字" }, { status: 400 });
  const cat = { id: crypto.randomUUID(), name: body.name.trim(), breed: body.breed?.trim() || "未知", age: body.age?.trim() || "未填写", notes: body.notes?.trim() || "", createdAt: new Date().toISOString() };
  if (env.DB) await env.DB.prepare("INSERT INTO cats (id, name, breed, age, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(cat.id, cat.name, cat.breed, cat.age, cat.notes, cat.createdAt).run();
  return Response.json({ cat });
}
