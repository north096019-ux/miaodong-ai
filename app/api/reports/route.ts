import { env } from "cloudflare:workers";

export async function GET() {
  if (!env.DB) return Response.json({ reports: [] });
  const result = await env.DB.prepare("SELECT id, cat_name AS catName, media_type AS mediaType, file_name AS fileName, mode, summary, result_json AS resultJson, created_at AS createdAt FROM reports ORDER BY created_at DESC LIMIT 20").all();
  return Response.json({ reports: result.results.map((row: Record<string, unknown>) => ({ ...row, result: JSON.parse(String(row.resultJson || "{}")) })) });
}
