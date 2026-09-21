declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    UPLOADS?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_ANALYSIS_MODEL?: string;
  }
}
