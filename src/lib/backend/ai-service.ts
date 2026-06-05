import { config } from "./config";

export interface ResumeSectionImprovement {
  sectionName: string;
  originalContent: string;
  improvementNeeds: string;
  optimizedContent: string;
}

export interface AnalysisResponse {
  matchScore: number;
  breakdown: {
    experienceFit: number;
    skillAlignment: number;
    leadershipScore: number;
  };
  benchmarking: Array<{
    label: string;
    value: number;
    subtext: string;
    status: "normal" | "warning" | "danger";
  }>;
  criticalChanges: Array<{
    title: string;
    description: string;
    type: "high" | "medium" | "low";
  }>;
  keywords: Array<{
    keyword: string;
    count: number;
    status: "Optimized" | "Need more" | "Missing";
  }>;
  optimizedStatements: Array<{
    original: string;
    optimized: string;
    tag: string;
    badge: string;
  }>;
  resumeSections: ResumeSectionImprovement[];
}

/**
 * Calls a specific LLM Provider completions endpoint.
 */
async function callLlmProvider(
  provider: "frenix" | "cerebras",
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const isFrenix = provider === "frenix";
  const apiKey = isFrenix ? config.frenixApiKey : config.cerebrasApiKey;
  const endpoint = isFrenix ? config.frenixEndpoint : config.cerebrasEndpoint;
  const model = isFrenix ? config.frenixModel : config.cerebrasModel;
  const maxTokens = isFrenix ? config.frenixMaxTokens : config.cerebrasMaxTokens;

  if (!apiKey) {
    throw new Error(`API key for provider '${provider}' is not configured in environment.`);
  }

  console.log(`[AI Service] Contacting ${provider} (Endpoint: ${endpoint}, Model: ${model}, Max Tokens: ${maxTokens})`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.2, // Lower temperature to ensure structured format compliance
      top_p: 0.95,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Provider ${provider} returned ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Invalid response structure from ${provider}`);
  }

  return content;
}

/**
 * Orchestrates resume analysis with failover protection.
 * Tries the primary (default) provider first, then falls back to secondary on failure.
 */
export async function analyzeResume(resumeText: string, jobRole: string): Promise<AnalysisResponse> {
  const systemPrompt = `You are an expert AI Resume Analyzer for Shuroq AI.
Your job is to analyze a candidate's resume text and evaluate its compatibility with a target job role.
You MUST respond with a single RAW JSON object adhering strictly to the schema below. Do not output any markdown wrappers, code blocks (such as \`\`\`json), or conversational padding.

JSON Schema to return:
{
  "matchScore": number (overall matching score percentage 0 to 100),
  "breakdown": {
    "experienceFit": number (0 to 100),
    "skillAlignment": number (0 to 100),
    "leadershipScore": number (0 to 100)
  },
  "benchmarking": [
    {
      "label": "Visual Design Mastery" | "Design System Leadership" | "B2B SaaS Context" | "Accessibility (WCAG)" | string (at least 4 matching categories appropriate for this job role),
      "value": number (score 0 to 100),
      "subtext": string (short benchmark summary, e.g. "Top 5% of Applicants", "Average for Senior Role", "Below Role Benchmark"),
      "status": "normal" | "warning" | "danger" (use warning or danger for scores needing focus/improvements)
    }
  ],
  "criticalChanges": [
    {
      "title": string (short actionable header),
      "description": string (specific resume writing recommendation to bridge the gap),
      "type": "high" | "medium" | "low" (impact level)
    }
  ],
  "keywords": [
    {
      "keyword": string (relevant skill, tool, or domain terminology),
      "count": number (occurrences found in resume),
      "status": "Optimized" | "Need more" | "Missing" (Optimized if count >= 2, Need more if count === 1, Missing if count === 0)
    }
  ],
  "optimizedStatements": [
    {
      "original": string (a weak or metrics-lacking bullet point from the resume),
      "optimized": string (an AI-rewritten high-impact senior bullet point with concrete metrics/results),
      "tag": string (e.g. "AI Optimized (Senior Role)"),
      "badge": string (percentage impact, e.g. "+45% Impact" or "+30% Scope")
    }
  ],
  "resumeSections": [
    {
      "sectionName": string (e.g., "Professional Summary", "Experience - [Job Title] at [Company]", "Projects - [Project Name]", "Skills & Technologies", "Education"),
      "originalContent": string (the exact bullet points or text details extracted from the candidate's resume for this section),
      "improvementNeeds": string (clear, actionable explanation of how this section needs to be improved or re-focused to target the job role),
      "optimizedContent": string (the complete, rewritten, high-impact version of this section tailored to the target job role)
    }
  ]
}

For the "resumeSections" field:
1. Divide the candidate's resume into logical sections: Summary, each individual Work Experience entry, main Projects, Skills list, and Education.
2. If the resume does not contain a clear "Professional Summary" section, you MUST create one. In this case, set "originalContent" to "" (empty string) and explain in "improvementNeeds" that a professional summary is missing but recommended, and provide a fully written optimized summary tailored for the target role in "optimizedContent".
3. Evaluate each section rigorously against the requirements of the Target Job Role: "${jobRole}". Ensure the optimized version uses professional terminology, metrics, and achievements.

Evaluate carefully, using realistic values and high-quality positioning advice based on the seniority expectations.`;

  const userPrompt = `Target Job Role: ${jobRole}
Candidate Resume Text:
---
${resumeText}
---`;

  const primary = config.defaultProvider;
  const secondary = primary === "frenix" ? "cerebras" : "frenix";

  try {
    const rawOutput = await callLlmProvider(primary, systemPrompt, userPrompt);
    return cleanAndParseJson(rawOutput);
  } catch (error) {
    console.error(`[AI Service] Primary provider '${primary}' failed. Error:`, error);
    console.warn(`[AI Service] Initiating fallback to secondary provider '${secondary}'...`);

    try {
      const rawOutput = await callLlmProvider(secondary, systemPrompt, userPrompt);
      return cleanAndParseJson(rawOutput);
    } catch (fallbackError) {
      console.error(`[AI Service] Fallback provider '${secondary}' also failed. Error:`, fallbackError);
      throw new Error(`Failed to analyze resume. All LLM providers returned errors. Details: ${(fallbackError as Error).message}`);
    }
  }
}

/**
 * Cleans potential markdown wrappers from LLM output and parses it.
 */
function cleanAndParseJson(raw: string): AnalysisResponse {
  let cleaned = raw.trim();

  // Strip JSON markdown wrapper if model added it
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as AnalysisResponse;
  } catch {
    console.error("[AI Service] Failed to parse JSON. Raw content was:\n", raw);
    throw new Error("AI provider returned invalid JSON structure.");
  }
}
