const env = { GEMINI_API_KEY: process.env.GEMINI_API_KEY };

export async function GET() {
  return Response.json({ mode: env.GEMINI_API_KEY ? "live" : "demo" });
}
