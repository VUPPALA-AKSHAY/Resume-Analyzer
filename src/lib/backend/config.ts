export interface AppConfig {
  frenixApiKey: string;
  cerebrasApiKey: string;
  defaultProvider: "frenix" | "cerebras";
  frenixModel: string;
  cerebrasModel: string;
  frenixMaxTokens: number;
  cerebrasMaxTokens: number;
  frenixEndpoint: string;
  cerebrasEndpoint: string;
}

export const config: AppConfig = {
  frenixApiKey: process.env.FRENIX_API_KEY || "",
  cerebrasApiKey: process.env.CEREBRAS_API_KEY || "",
  defaultProvider: (process.env.AI_PROVIDER === "cerebras" ? "cerebras" : "frenix"),
  frenixModel: process.env.FRENIX_MODEL || "glm-5",
  cerebrasModel: process.env.CEREBRAS_MODEL || "zai-glm-4.7",
  frenixMaxTokens: 45000,
  cerebrasMaxTokens: 16384, // Cerebras fallback uses less tokens, e.g. 16384
  frenixEndpoint: "https://api.frenix.sh/v1/chat/completions",
  cerebrasEndpoint: "https://api.cerebras.ai/v1/chat/completions",
};
