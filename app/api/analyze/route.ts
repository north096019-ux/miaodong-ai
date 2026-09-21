import { env } from "cloudflare:workers";

type Analysis = {
  intention: { label: string; confidence: number; evidence: string[] };
  emotion: { label: string; confidence: number; evidence: string[] };
  health: { level: "未见明显异常" | "建议持续观察" | "建议尽快就医"; observations: string[] };
  summary: string; recommendations: string[]; disclaimer: string;
};

const DISCLAIMER = "此结果仅用于行为与可见状态观察，不是疾病诊断，也不是猫语的准确翻译；如出现呼吸困难、持续疼痛、无法站立、抽搐或明显恶化，请立即联系兽医。";

function demoAnalysis(kind: string, context: string, features: string): Analysis {
  const active = /高|连续|快速|食|门|玩|叫/.test(`${context}${features}`);
  const image = kind.startsWith("image") || kind.startsWith("video");
  return {
    intention: { label: active ? "可能在寻求关注或表达需求" : "可能在观察环境或进行日常交流", confidence: active ? 67 : 58, evidence: active ? ["场景描述包含活动或需求线索", "声音节奏特征偏活跃"] : ["未发现强烈需求线索", "素材信息有限，需结合当时场景"] },
    emotion: { label: active ? "偏警觉／兴奋" : "相对平静", confidence: image ? 64 : 52, evidence: image ? ["依据可见姿态与用户提供的场景", "单帧或短片不能代表持续情绪"] : ["主要依据声音节奏与场景", "缺少耳朵、尾巴和身体姿态信息"] },
    health: { level: "建议持续观察", observations: image ? ["演示模式不会从像素作医学判断", "请留意眼鼻分泌物、跛行、呼吸与精神变化"] : ["仅凭叫声无法判断健康状态", "如叫声突然改变并伴随行为异常，建议咨询兽医"] },
    summary: "当前素材更像一次需要结合场景理解的日常表达。建议在相同时间、地点连续记录几次，建立这只猫自己的行为基线。",
    recommendations: ["记录发生时间、持续时长与前后事件", "观察耳朵、尾巴、瞳孔、进食与如厕是否同步变化", "若异常持续或加重，保留原始素材并联系兽医"],
    disclaimer: DISCLAIMER,
  };
}

async function liveAnalysis(preview: string, kind: string, context: string, features: string): Promise<Analysis> {
  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: `你是谨慎的猫咪行为观察助手。素材类型：${kind}。场景：${context || "未提供"}。浏览器提取的声音/媒体特征：${features || "无"}。只描述可观察证据与可能性，不诊断疾病，不把猫叫翻译成确定的人话。` }];
  if (preview.startsWith("data:image/")) content.push({ type: "input_image", image_url: preview, detail: "high" });
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_ANALYSIS_MODEL || "gpt-5.6-terra", store: false,
      instructions: "以中文输出。必须区分观察、推测和无法判断，健康部分只做可见异常提示。",
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "cat_observation", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: {
          intention: { type: "object", additionalProperties: false, properties: { label: { type: "string" }, confidence: { type: "number" }, evidence: { type: "array", items: { type: "string" } } }, required: ["label", "confidence", "evidence"] },
          emotion: { type: "object", additionalProperties: false, properties: { label: { type: "string" }, confidence: { type: "number" }, evidence: { type: "array", items: { type: "string" } } }, required: ["label", "confidence", "evidence"] },
          health: { type: "object", additionalProperties: false, properties: { level: { type: "string", enum: ["未见明显异常", "建议持续观察", "建议尽快就医"] }, observations: { type: "array", items: { type: "string" } } }, required: ["level", "observations"] },
          summary: { type: "string" }, recommendations: { type: "array", items: { type: "string" } }, disclaimer: { type: "string" }
        }, required: ["intention", "emotion", "health", "summary", "recommendations", "disclaimer"]
      } } }
    })
  });
  if (!response.ok) throw new Error(`模型服务暂时不可用（${response.status}）`);
  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = data.output_text || data.output?.flatMap(item => item.content || []).map(item => item.text || "").join("") || "";
  const parsed = JSON.parse(text) as Analysis;
  parsed.disclaimer = DISCLAIMER;
  return parsed;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "请选择图片、视频或音频" }, { status: 400 });
  if (file.size > 30 * 1024 * 1024) return Response.json({ error: "文件请控制在 30MB 以内" }, { status: 413 });
  const catId = String(form.get("catId") || ""); const catName = String(form.get("catName") || "未命名猫咪");
  const context = String(form.get("context") || ""); const features = String(form.get("features") || ""); const preview = String(form.get("preview") || "");
  const reportId = crypto.randomUUID(); const storageKey = `uploads/${reportId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  if (env.UPLOADS) await env.UPLOADS.put(storageKey, file.stream(), { httpMetadata: { contentType: file.type } });
  let mode = "demo"; let result: Analysis;
  if (env.OPENAI_API_KEY) {
    try { result = await liveAnalysis(preview, file.type, context, features); mode = "live"; }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "分析失败，请稍后重试" }, { status: 502 }); }
  } else result = demoAnalysis(file.type, context, features);
  const createdAt = new Date().toISOString();
  if (env.DB) await env.DB.prepare("INSERT INTO reports (id, cat_id, cat_name, media_type, file_name, storage_key, mode, summary, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(reportId, catId || null, catName, file.type, file.name, env.UPLOADS ? storageKey : null, mode, result.summary, JSON.stringify(result), createdAt).run();
  return Response.json({ reportId, mode, result, createdAt });
}
