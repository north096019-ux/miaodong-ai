const env: { DB?: any; UPLOADS?: any; GEMINI_API_KEY?: string; GEMINI_ANALYSIS_MODEL?: string } = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_ANALYSIS_MODEL: process.env.GEMINI_ANALYSIS_MODEL,
};

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

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function geminiLiveAnalysis(preview: string, file: File, context: string, features: string): Promise<Analysis> {
  const mimeType = file.type || "application/octet-stream";
  const parts: Array<Record<string, unknown>> = [{ text: `请用简体中文输出 JSON 格式的猫咪观察报告，字段为 intention、emotion、health、summary、recommendations、disclaimer。intention 和 emotion 包含 label、confidence、evidence；health 包含 level、observations。素材类型：${mimeType}。场景：${context || "未提供"}。浏览器提取的声音或媒体特征：${features || "无"}。如果提供了猫叫音频，可以分析可听到的声音特征和可能意图，但必须明确是不确定推测。只描述可见或可听证据，不诊断疾病，不把猫叫翻译成确定的人话；health 只提示可见异常。confidence 是模型主观匹配分数，不是医学概率。` }];
  if (mimeType.startsWith("audio/")) {
    parts.push({ inline_data: { mime_type: mimeType, data: bytesToBase64(new Uint8Array(await file.arrayBuffer())) } });
  } else if (preview.startsWith("data:image/")) {
    const match = preview.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
    if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
  }

  const model = env.GEMINI_ANALYSIS_MODEL || "gemini-3.8-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json" } }),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error("Gemini 免费额度或请求频率暂时用完，请稍后再试");
    if (response.status === 400 || response.status === 404) throw new Error("Gemini 模型或素材格式暂不支持，请检查模型设置或更换素材");
    if (response.status === 401 || response.status === 403) throw new Error("Gemini API 密钥无效或尚未开通，请检查 Vercel 环境变量");
    throw new Error(`Gemini 服务暂时不可用（${response.status}）`);
  }
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";
  if (!text) throw new Error("Gemini 没有返回可用分析结果，请更换素材后重试");
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
  if (env.GEMINI_API_KEY) {
    if ((file.type.startsWith("audio/") || file.type.startsWith("image/")) && file.size > 14 * 1024 * 1024) {
      return Response.json({ error: "Gemini 免费分析暂支持 14MB 以内的图片或音频，请压缩素材后重试" }, { status: 413 });
    }
    try { result = await geminiLiveAnalysis(preview, file, context, features); mode = "live"; }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "分析失败，请稍后重试" }, { status: 502 }); }
  } else result = demoAnalysis(file.type, context, features);
  const createdAt = new Date().toISOString();
  if (env.DB) await env.DB.prepare("INSERT INTO reports (id, cat_id, cat_name, media_type, file_name, storage_key, mode, summary, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(reportId, catId || null, catName, file.type, file.name, env.UPLOADS ? storageKey : null, mode, result.summary, JSON.stringify(result), createdAt).run();
  return Response.json({ reportId, mode, result, createdAt });
}
