# 喵懂 AI MVP

这是一个中文手机端猫咪观察网页工具。它支持上传图片、视频和音频，保存猫咪档案、观察记录与反馈，并把结果明确区分为“演示模式”或“AI 分析”。

## 运行模式

没有 API 凭据时，界面会显示“演示模式”。演示结果只用来走通上传、报告、档案和记录流程，不代表模型判断。

要启用真实图像分析：

1. 复制 `.env.example` 为 `.env`。
2. 设置 `OPENAI_API_KEY`。
3. 可选地设置 `OPENAI_ANALYSIS_MODEL`，默认是 `gpt-5.6-terra`。
4. 重启开发服务器。

密钥只应放在服务端环境，不要填进浏览器或提交到 Git。视频会在浏览器提取一帧作为视觉参考，音频会在浏览器提取时长、强度和峰值等特征；这些是辅助线索，不等同于“猫语翻译”。

## 产品边界

- 健康区域只提示可见异常与观察建议，不做疾病诊断。
- 声音区域是意图推测，不宣称能准确把叫声翻译成人话。
- 如果出现呼吸困难、持续疼痛、无法站立、抽搐或明显恶化，应直接联系兽医。

## 已验证流程

- 本地构建成功，首页、`/api/status`、`/api/cats`、`/api/analyze`、`/api/reports`、`/api/feedback` 均可运行。
- 已用小型图片素材跑通演示分析、保存报告和反馈。
- 已在手机尺寸预览中检查观察、猫咪档案、添加档案弹窗和观察记录页。

## 可参考的开源项目

开源项目适合借鉴模型和数据处理方式，不能直接当成可诊断产品：

- `OscarYL/DeepCat`：猫脸部关键点、分割、姿态与身体语言研究原型；更适合拆出视觉特征层，不适合直接作为医学结论。
- `JoeDelK/DOMESTIC-CATS-SOUND-CLASSIFICATION-USING-DEEP-LEARNING`：基于 mel-spectrogram 的猫叫分类研究，README 提到 10 类声音与 ResNet50 实验；适合替换当前浏览器音频特征的后端模型。
- `manheima/MeowDetector`：Coral Dev Board Micro + TensorFlow Lite 的实时猫叫检测；适合做边缘端“是否叫了”的检测，不是完整意图识别。
- `Jerome-Graves/meowtion`：猫项圈的习惯、活动、进食和呼噜监测，代码为 MIT，但硬件部分另有 CERN-OHL-S v2；适合参考个体基线、趋势异常和隐私设计。
- `molka-mallek/animind`：多动物图像/视频/音频分析平台，包含猫叫分类和健康异常筛查模块；它是完整的 Python + FastAPI + React 多服务项目，迁入当前 Worker 站点成本较高，且需逐项核对模型与数据许可证。

本 MVP 目前没有直接复制这些仓库的代码或模型，原因是它们的运行栈、许可证、模型权重和健康声明都不一致。下一步若要升级真实猫叫模型，优先评估 `DOMESTIC-CATS-SOUND-CLASSIFICATION-USING-DEEP-LEARNING` 的数据与训练代码，并重新验证数据集、权重和商业使用许可。
