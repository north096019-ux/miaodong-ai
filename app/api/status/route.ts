const env = { OPENAI_API_KEY: process.env.OPENAI_API_KEY };

export async function GET() {
  return Response.json({ mode: env.OPENAI_API_KEY ? "live" : "demo" });
}
