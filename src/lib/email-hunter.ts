import { GoogleGenerativeAI } from "@google/generative-ai";

export interface HunterResult {
  email: string;
  name?: string;
  role?: string;
  linkedin_url?: string;
  source: string;
  confidence: "high" | "medium" | "low" | "inferred";
}

export interface HunterResponse {
  results: HunterResult[];
  raw_query: string;
}

export type HunterStage =
  | "research"
  | "patterns"
  | "formatting"
  | "done"
  | "error";

export interface StageEvent {
  stage: HunterStage;
  message: string;
}

interface ResearchPerson {
  name: string;
  role?: string;
  company?: string;
  domain?: string;
  confirmed_email?: string;
  linkedin_url?: string;
  source: string;
}

const RESEARCH_PROMPT = `You are an expert corporate research assistant. Your SOLE job is to gather raw intelligence about companies and their leadership.

You will be given a query about a company or person. Your task is to find:
1. Company name and website domain
2. Names of founders, co-founders, CEO, CTO, CFO, COO, CPO, CMO, VP, Director-level executives, and other key decision-makers
3. Each person's role/title
4. Each person's LinkedIn profile URL (e.g. https://www.linkedin.com/in/johndoe) — this is the TOP PRIORITY to find
5. The company's LinkedIn page URL (e.g. https://www.linkedin.com/company/acme) — use as fallback if personal LinkedIn is not found
6. Any CONFIRMED email addresses found on official pages (do NOT guess or infer — only report emails explicitly listed)
7. The source URL where each piece of information was found

LinkedIn priority per person:
- First, find their personal LinkedIn profile URL (linkedin.com/in/username)
- If personal LinkedIn cannot be found, use the company LinkedIn page (linkedin.com/company/name)
- If neither can be found, set linkedin_url to "not found"

Search strategy:
- LinkedIn search: "{person name} {company} LinkedIn"
- Company "About" and "Team" pages (often link to LinkedIn profiles)
- Crunchbase, AngelList, PitchBook (show LinkedIn profiles)
- GitHub README files (sometimes have LinkedIn links)
- Twitter/X bios (often have LinkedIn links)
- Press releases, tech blogs, conference speaker pages

CRITICAL: Do NOT infer or guess email addresses. Only report emails that are explicitly written on a public page. Email inference will be handled by a separate system.

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "company": {"name": "...", "domain": "...", "linkedin_url": "https://www.linkedin.com/company/... or not found"},
  "people": [
    {
      "name": "Full Name",
      "role": "Title",
      "linkedin_url": "https://www.linkedin.com/in/username or company linkedin or not found",
      "confirmed_email": "only if explicitly found",
      "source": "URL or description"
    }
  ]
}`;

const PATTERN_PROMPT = `You are an expert at predicting corporate email patterns. Given a list of people and their company domain, generate the most likely email addresses for each person.

Rules:
1. Generate emails using these common patterns: firstname@domain, first.last@domain, firstlast@domain, flast@domain, f.lastname@domain, first_last@domain, first-last@domain
2. If a confirmed email exists for ANY person at the domain, analyze its pattern and prioritize that pattern for all other people at the same domain
3. Assign confidence:
   - "high": matches a confirmed pattern from the same domain
   - "medium": is a common/likely pattern for corporate emails
   - "low": less common but still possible pattern
4. Generate at most 5 email variations per person — pick the most likely ones
5. For each email, include the person's name, role, and linkedin_url
6. Source should describe the pattern logic (e.g. "firstname@domain pattern" or "Matches confirmed pattern john@acme.com")

Also include any confirmed emails that were explicitly found, with confidence "high".

IMPORTANT: Preserve the linkedin_url field from the input data for each person. Pass it through to every email result.

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "emails": [
    {
      "email": "address@domain.com",
      "name": "Person Name",
      "role": "Title",
      "linkedin_url": "https://www.linkedin.com/in/... or company url or not found",
      "source": "Pattern description or source URL",
      "confidence": "high|medium|low"
    }
  ]
}`;

const FORMAT_PROMPT = `You are a data cleaning assistant. You will receive a list of email results from an email hunting system. Your job is to:

1. Remove duplicate emails (case-insensitive)
2. Remove obviously invalid emails (malformed, test emails, example.com, etc.)
3. Sort by priority: personal/executive emails first (ordered by confidence: high > medium > low > inferred), then generic emails (support@, info@, etc.) at the bottom
4. For each email, ensure: clean name formatting (proper title case), clean role, concise source description
5. Add "inferred" confidence for any emails that were purely guessed from a naming pattern with zero confirmation
6. If an email has no associated person name, check if it is a generic email (support@, info@, contact@, etc.) and mark it accordingly
7. Preserve the linkedin_url field for each result. Clean it up if needed (ensure it starts with https://). If linkedin_url is "not found" or empty, set it to null.

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "results": [
    {
      "email": "address@domain.com",
      "name": "Person Name or null",
      "role": "Title or null",
      "linkedin_url": "https://www.linkedin.com/in/... or null",
      "source": "Clean source description",
      "confidence": "high|medium|low|inferred"
    }
  ]
}`;

function stripMarkdownFences(text: string): string {
  return text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
}

const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash"
];

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  useSearch = false,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of GEMINI_MODELS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tools = useSearch ? [{ googleSearch: {} } as any] : [];

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        tools,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini API timeout after 60s (${modelName})`)),
          60_000,
        ),
      );

      console.log(`[Gemini] Calling ${modelName}...`);
      const result = await Promise.race([
        model.generateContent(userPrompt),
        timeoutPromise,
      ]);
      const text = result?.response.text() || "";

      if (!text) {
        console.error(`[Gemini] ${modelName} returned empty text`);
        continue;
      }

      console.log(
        `[Gemini] ${modelName} response received (${text.length} chars)`,
      );
      return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("503") || msg.includes("timeout") || msg.includes("quota");

      console.error(`[Gemini] ${modelName} failed: ${msg}`);

      if (isRetryable && modelName !== GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
        console.log(
          `[Gemini] ${modelName} is retryable, trying next model...`,
        );
        continue;
      }

      throw new Error(`Gemini error (${modelName}): ${msg}`);
    }
  }

  throw new Error("All Gemini models exhausted");
}

function cleanLinkedinUrl(url: unknown): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed === "not found" || trimmed === "null")
    return undefined;
  if (!trimmed.startsWith("http")) return `https://${trimmed}`;
  return trimmed;
}

function extractResearchPeople(data: Record<string, unknown>): {
  people: ResearchPerson[];
  companyDomain: string;
  companyLinkedin: string;
} {
  const company = data.company as Record<string, unknown> | undefined;
  const domain = (company?.domain as string) || "";
  const companyLinkedin = cleanLinkedinUrl(company?.linkedin_url) || "";
  const rawPeople = data.people as Record<string, unknown>[] | undefined;

  const people: ResearchPerson[] = (rawPeople || []).map((p) => ({
    name: String(p.name || ""),
    role: p.role ? String(p.role) : undefined,
    company: company?.name ? String(company.name) : undefined,
    domain: domain || undefined,
    confirmed_email: p.confirmed_email ? String(p.confirmed_email) : undefined,
    linkedin_url:
      cleanLinkedinUrl(p.linkedin_url) || companyLinkedin || undefined,
    source: String(p.source || "unknown"),
  }));

  return { people, companyDomain: domain, companyLinkedin };
}

function mapToHunterResult(r: Record<string, unknown>): HunterResult {
  return {
    email: String(r.email || ""),
    name: r.name ? String(r.name) : undefined,
    role: r.role ? String(r.role) : undefined,
    linkedin_url: cleanLinkedinUrl(r.linkedin_url),
    source: String(r.source || "unknown"),
    confidence: ["high", "medium", "low", "inferred"].includes(
      r.confidence as string,
    )
      ? (r.confidence as HunterResult["confidence"])
      : "medium",
  };
}

export class EmailHunter {
  private geminiApiKey: string;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    this.geminiApiKey = geminiKey;
  }

  async find(
    query: string,
    onStage?: (event: StageEvent) => void,
  ): Promise<HunterResponse> {
    let people: ResearchPerson[] = [];
    let companyDomain = "";
    let patternData: Record<string, unknown> = {};

    try {
      onStage?.({
        stage: "research",
        message: "Researching company and leadership with Gemini 2.5 Flash...",
      });
      console.log(`[Hunter] Starting research for: ${query}`);
      
      const researchOutput = await callGemini(this.geminiApiKey, RESEARCH_PROMPT, query, true);
      const researchData = JSON.parse(stripMarkdownFences(researchOutput));
      
      const extracted = extractResearchPeople(researchData);
      people = extracted.people;
      companyDomain = extracted.companyDomain;
      console.log(
        `[Hunter] Research complete: ${people.length} people found, domain: ${companyDomain}`,
      );

      if (people.length === 0) {
        onStage?.({ stage: "done", message: "No people found for this query" });
        return { results: [], raw_query: query };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Hunter] Research stage failed:`, msg);
      onStage?.({ stage: "error", message: `Research failed: ${msg}` });
      return { results: [], raw_query: query };
    }

    try {
      onStage?.({
        stage: "patterns",
        message: `Generating email patterns for ${people.length} people with Gemini 2.5 Flash...`,
      });

      const patternInput = `Here is the research data for the company "${companyDomain}":\n\n${JSON.stringify(people, null, 2)}\n\nGenerate the most likely email addresses for each person. Remember to use the company domain: ${companyDomain}. If any confirmed emails exist, deduce the company email pattern and apply it to all people. IMPORTANT: Preserve the linkedin_url for each person in every email result.`;

      const patternOutput = await callGemini(
        this.geminiApiKey,
        PATTERN_PROMPT,
        patternInput,
      );

      patternData = JSON.parse(stripMarkdownFences(patternOutput));
      console.log(`[Hunter] Pattern generation complete`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Hunter] Pattern stage failed:`, msg);
      onStage?.({
        stage: "error",
        message: `Pattern generation failed: ${msg}`,
      });
      return { results: [], raw_query: query };
    }

    try {
      onStage?.({
        stage: "formatting",
        message: "Deduplicating and formatting results with Gemini 2.5 Flash...",
      });

      const formatInput = `Clean up and format these email candidates. Company domain: ${companyDomain}\n\n${JSON.stringify(patternData.emails || patternData, null, 2)}\n\nReturn only the final cleaned, deduplicated, sorted results. IMPORTANT: Preserve the linkedin_url field for each result.`;

      const formatOutput = await callGemini(
        this.geminiApiKey,
        FORMAT_PROMPT,
        formatInput,
      );

      const formatted = JSON.parse(stripMarkdownFences(formatOutput));
      const results = (
        Array.isArray(formatted.results) ? formatted.results : []
      ).map(mapToHunterResult);

      console.log(`[Hunter] Formatting complete: ${results.length} results`);
      onStage?.({
        stage: "done",
        message: `Found ${results.length} email candidates`,
      });

      return { results, raw_query: query };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Hunter] Formatting stage failed:`, msg);

      const rawEmails = Array.isArray(patternData.emails)
        ? patternData.emails
        : [];
      const fallback = rawEmails.map(mapToHunterResult);

      onStage?.({
        stage: "done",
        message: `Formatting failed (${msg}). Returning ${fallback.length} unformatted results.`,
      });

      return { results: fallback, raw_query: query };
    }
  }
}
