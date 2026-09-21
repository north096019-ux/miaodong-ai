import { env } from "cloudflare:workers";

export async function GET() {
  return Response.json({ mode: env.OPENAI_API_KEY ? "live" : "demo" });
}
