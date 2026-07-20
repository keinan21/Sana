"use server";
import { z } from "zod";
import {
  Gemini,
  InMemoryRunner,
  LlmAgent,
  isFinalResponse,
  stringifyContent,
  // NOTE: the export name for the built-in Google Search tool can differ
  // depending on the installed @google/adk version (e.g. `GOOGLE_SEARCH`,
  // `GoogleSearchTool`, or `google_search`). Adjust this import if the
  // build fails.
  GOOGLE_SEARCH,
} from '@google/adk';


// ============================================================
// 1. INPUT SCHEMA — Learning Circuit form
// ============================================================
const ExperienceLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']);
export type ExperienceLevel = z.infer<typeof ExperienceLevelEnum>;

const LearningCircuitInputSchema = z.object({
  userGoal: z.string().min(1, "Learning goal cannot be empty"),
  expectations: z.string().min(1, "Expected outcome cannot be empty"),
  experienceLevel: ExperienceLevelEnum,
  weeklyHoursCommitment: z.number().positive("Weekly hours commitment must be greater than 0"),
});

export type LearningCircuitInput = z.infer<typeof LearningCircuitInputSchema>;

// ============================================================
// 2. OUTPUT SCHEMA — Learning Circuit & Moduls
// ============================================================
const ResourceSchema = z.object({
  platform: z.string().describe("Source platform name, e.g. YouTube, Article, Official Docs"),
  title: z.string().describe("Short title of the resource"),
  // Intentionally NOT enforced as .url() at parse time — broken/hallucinated
  // urls are repaired or dropped by the Link Verifier & Repair Loop in STEP 3,
  // instead of failing the whole parse.
  url: z.string().describe("REQUIRED: A valid, active HTTP/HTTPS URL providing educational material directly relevant to this quest."),
});

export type Resource = z.infer<typeof ResourceSchema>;

const TodoSchema = z.object({
  id: z.string().describe("Unique todo id, e.g. t1, t2, t3"),
  task: z.string().describe("In-depth material & concrete action the learner must complete"),
  isDone: z.boolean().default(false),
  resources: z.array(ResourceSchema).min(1).max(2).describe(
    "CRITICAL: Every todo MUST include 1-2 real, relevant educational resource URLs with valid links. Never empty."
  ),
});

const ModulSchema = z.object({
  id: z.string().describe("Unique modul id, e.g. m1, m2, m3"),
  title: z.string().describe("Title of the learning modul"),
  idealDaysToComplete: z
    .number()
    .describe(
      "Ideal number of days to complete this modul, calculated based on weeklyHoursCommitment & experienceLevel"
    ),
  done: z.boolean().default(false),
  todos: z.array(TodoSchema),
});

const LearningCircuitSchema = z.object({
  title: z.string().describe("Name of the learning circuit"),
  targetDescription: z.string().describe("Objective description based on the user's expectations & experience level"),
  totalEstimatedWeeks: z.number().describe("Total ideal number of weeks to complete this circuit"),
  createdAt: z.string().default(() => new Date().toISOString()),
  moduls: z.array(ModulSchema),
});

export type LearningCircuit = z.infer<typeof LearningCircuitSchema>;
type Modul = LearningCircuit["moduls"][number];
type Todo = Modul["todos"][number];

// ============================================================
// 2B. LITE OUTPUT SCHEMA — no resources required
// ============================================================
const LiteTodoSchema = z.object({
  id: z.string().describe("Unique todo id, e.g. t1, t2, t3"),
  task: z.string().describe("In-depth material & concrete action the learner must complete"),
  isDone: z.boolean().default(false),
  resources: z.array(ResourceSchema).max(2).default([]),
});

const LiteModulSchema = z.object({
  id: z.string().describe("Unique modul id, e.g. m1, m2, m3"),
  title: z.string().describe("Title of the learning modul"),
  idealDaysToComplete: z
    .number()
    .describe(
      "Ideal number of days to complete this modul, calculated based on weeklyHoursCommitment & experienceLevel"
    ),
  done: z.boolean().default(false),
  todos: z.array(LiteTodoSchema),
});

const LiteLearningCircuitSchema = z.object({
  title: z.string().describe("Name of the learning circuit"),
  targetDescription: z.string().describe("Objective description based on the user's expectations & experience level"),
  totalEstimatedWeeks: z.number().describe("Total ideal number of weeks to complete this circuit"),
  createdAt: z.string().default(() => new Date().toISOString()),
  moduls: z.array(LiteModulSchema),
});

// ============================================================
// 3. VERIFICATION SCHEMAS
// ============================================================

// Schema for lazy verification type determination
const VerificationTypeSchema = z.object({
  type: z.enum(['reflection', 'essay', 'link']).describe(
    'The most appropriate verification type for these learning tasks'
  ),
  minReflectionLength: z.number().min(50).max(500).optional().default(100)
    .describe('Required for reflection type: minimum character count for the reflection'),
  essayPrompt: z.string().optional()
    .describe('Required for essay type: a specific question to answer or topic to analyze'),
  linkInstructions: z.string().optional()
    .describe('Required for link type: what kind of link to submit as proof of work'),
});

const VerificationResultSchema = z.object({
  isVerified: z.boolean().describe(
    'True ONLY if the practical proof genuinely correlates with the quest requirements.'
  ),
  feedback: z.string().describe(
    'A short, friendly, yet highly technical review. If rejected, explicitly state what tangible action or code element is missing. If approved, praise their engineering step.'
  ),
  confidenceScore: z.number().min(0).max(100).describe(
    'A percentage from 0 to 100 on how confident the AI is in the proof validity.'
  ),
});

// ============================================================
// HELPER — Bulletproof extraction of the final non-streaming text
// (used by the Research Agent, Curator Agent, and Link Finder Agent)
//
// NOTE: When `outputSchema` is set on an LlmAgent, the `isFinalResponse`
// flag doesn't always consistently mark the event that actually carries
// the text. So we don't rely on isFinalResponse alone: we also keep the
// last non-empty text found in ANY event as a fallback.
// Set env ADK_DEBUG=1 to dump every raw event to the console.
// ============================================================
async function runAgentAndGetFinalText(
  agent: LlmAgent,
  appName: string,
  userMessageText: string
): Promise<string> {
  const runner = new InMemoryRunner({ agent, appName });
  let finalText = '';
  let lastNonEmptyText = '';
  const debugEvents: unknown[] = [];

  for await (const event of runner.runEphemeral({
    userId: 'system',
    newMessage: { role: 'user', parts: [{ text: userMessageText }] },
  })) {
    if (process.env.ADK_DEBUG === '1') {
      debugEvents.push(event);
    }

    const errEvent = event as unknown as Record<string, unknown>;
    const errCode = errEvent.errorCode;
    const errMsg = errEvent.errorMessage;
    if (errCode || errMsg) {
      throw new Error(`Gemini API error [${errCode || 'UNKNOWN'}]: ${errMsg || 'No details'}`);
    }

    const extractedFromAnyEvent = safeStringifyContent(event);
    if (extractedFromAnyEvent.trim().length > 0) {
      lastNonEmptyText = extractedFromAnyEvent;
    }

    if (isFinalResponse(event) && event.content) {
      const text = safeStringifyContent(event);
      if (text.trim().length > 0) {
        finalText = text;
      }
    }
  }

  if (process.env.ADK_DEBUG === '1') {
    console.log(`--- RAW EVENTS DEBUG (${appName}) ---`);
    console.log(JSON.stringify(debugEvents, null, 2));
    console.log('--- END RAW EVENTS DEBUG ---');
  }

  return finalText || lastNonEmptyText;
}

function safeStringifyContent(event: unknown): string {
  try {
    const text = stringifyContent(event as any);
    return typeof text === 'string' ? text : '';
  } catch {
    return '';
  }
}

function sanitizeJsonBlock(rawText: string): string {
  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```[a-zA-Z]*\n?/, '');
    cleanJson = cleanJson.replace(/\n?```$/, '');
  }
  return cleanJson.trim();
}

// ============================================================
// STEP 1 — RESEARCH AGENT (Google Search Tool Integration)
// "Caveman"-style instruction: short, imperative sentences, no fluff,
// to keep token usage low.
// ============================================================
async function runResearchAgent(input: LearningCircuitInput, gemini: Gemini): Promise<string> {
  const researchAgent = new LlmAgent({
    name: 'research_agent',
    model: gemini,
    instruction:
      'You research agent. Search internet with Google Search. ' +
      'Find: best practices. Find: roadmap. Find: official docs. Find: common beginner mistakes. ' +
      'CRITICAL: Only include URLs verified LIVE today. Prefer resources published within the last 2 years. ' +
      'For YouTube: direct video URLs only, from active channels. No channel/playlist pages. ' +
      'Prefer established platforms (official docs, MDN, freeCodeCamp, Coursera, GitHub repos with recent activity). ' +
      'Found a good link? Record url EXACTLY as-is. ' +
      'Write summary as bullet points, dense, no fluff. ' +
      'NO JSON. NO fake links.',
    tools: [GOOGLE_SEARCH],
  });

  const researchQuery =
    `Goal: "${input.userGoal}". Level: ${input.experienceLevel}. ` +
    `Expectation: "${input.expectations}". ` +
    `Research best practices, 2026 roadmap, official docs, beginner pitfalls. Record source urls if found.`;

  const researchText = await runAgentAndGetFinalText(researchAgent, 'research_agent_app', researchQuery);

  if (!researchText) {
    throw new Error('Research agent did not produce any search result text.');
  }

  return researchText;
}

// ============================================================
// STEP 2 — CURATOR AGENT (LlmAgent with outputSchema)
// Also caveman-style: short rule bullets, no long sentences.
// ============================================================
async function runCuratorAgent(
  input: LearningCircuitInput,
  researchText: string,
  gemini: Gemini
): Promise<LearningCircuit> {
  const curatorAgent = new LlmAgent({
    name: 'circuit_curator_agent',
    model: gemini,
    instruction:
      'You curator. Turn research into JSON matching schema.\n' +
      `Level: ${input.experienceLevel}. Hours/week: ${input.weeklyHoursCommitment}. Expectation: "${input.expectations}".\n` +
      'Rules:\n' +
      '1. idealDaysToComplete: low level or low hours = more days. Calculate rationally.\n' +
      '2. CRITICAL: resources MUST have 1-2 real entries per todo. Never empty. Use real URLs from research data.\n' +
      '3. Only use URLs that look like genuine, established-platform URLs. Reject placeholder URLs, example.com, or obviously hallucinated paths.\n' +
      '4. For YouTube: only use youtube.com/watch?v=... format. No channel pages, no playlist URLs.\n' +
      '5. Use research info only. NO making things up.\n\n' +
      `RESEARCH:\n${researchText}`,
    outputSchema: LearningCircuitSchema,
  });

  const curationQuery = `Build a Learning Circuit for: "${input.userGoal}".`;

  const finalText = await runAgentAndGetFinalText(curatorAgent, 'circuit_curator_app', curationQuery);

  if (!finalText) {
    throw new Error('Curator agent did not produce a final text response.');
  }

  const cleanJson = sanitizeJsonBlock(finalText);
  const parsedJson: unknown = JSON.parse(cleanJson);

  const validated = LearningCircuitSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(`JSON output does not match schema: ${validated.error.message}`);
  }

  return validated.data;
}

// ============================================================
// STEP 2B — LITE CURATOR AGENT (no research, no resources)
// ============================================================
async function runLiteCuratorAgent(
  input: LearningCircuitInput,
  gemini: Gemini
): Promise<LearningCircuit> {
  const curatorAgent = new LlmAgent({
    name: 'lite_curator_agent',
    model: gemini,
    instruction:
      'You curator. Output JSON matching schema.\n' +
      `Level: ${input.experienceLevel}. Hours/week: ${input.weeklyHoursCommitment}. Expectation: "${input.expectations}".\n` +
      'Rules:\n' +
      '1. idealDaysToComplete: low level or low hours = more days. Calculate rationally.\n' +
      '2. Do NOT include any resources/links. Leave resources array empty.\n' +
      '3. Use your own knowledge. NO making things up.\n',
    outputSchema: LiteLearningCircuitSchema,
  });

  const curationQuery = `Build a Learning Circuit for: "${input.userGoal}".`;

  const finalText = await runAgentAndGetFinalText(curatorAgent, 'lite_curator_app', curationQuery);

  if (!finalText) {
    throw new Error('Lite curator agent did not produce a final text response.');
  }

  const cleanJson = sanitizeJsonBlock(finalText);
  const parsedJson: unknown = JSON.parse(cleanJson);

  const validated = LiteLearningCircuitSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(`JSON output does not match schema: ${validated.error.message}`);
  }

  return validated.data as unknown as LearningCircuit;
}

// ============================================================
// STEP 3 — LINK VERIFIER & REPAIR LOOP
// Not pure LLM: every url inside "resources" is checked with a real HTTP
// request. If it's dead, a small agent (link_finder_agent) tries to find
// a replacement via Google Search, then it's re-verified. If it still
// fails, the resource is DROPPED (better no link than a dead link).
// ============================================================
const LINK_CHECK_TIMEOUT_MS = 6000;
const MAX_LINK_REPAIR_ATTEMPTS = 1;

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function isUrlAlive(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);

  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });

    // Some servers don't support HEAD (405) or block bot HEAD requests.
    // Fall back to GET before declaring the link truly dead.
    if (!response.ok) {
      response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function findReplacementLink(
  todoTask: string,
  resourceTitle: string,
  platform: string,
  gemini: Gemini
): Promise<string | null> {
  const linkFinderAgent = new LlmAgent({
    name: 'link_finder_agent',
    model: gemini,
    instruction:
      'You link finder. Find 1 valid, live url with Google Search. ' +
      'Official/trusted source. Prefer content published within the last 2 years. ' +
      'For YouTube: verify the video still exists and is publicly accessible. ' +
      'Prefer established tutorial sites, official docs, and reputable educational platforms. ' +
      'Reply ONLY the raw url. No markdown. No explanation. ' +
      'Not found? Reply: NOT_FOUND.',
    tools: [GOOGLE_SEARCH],
  });

  const query =
    `Find a valid ${platform} link for: "${resourceTitle}". Context: "${todoTask}". Reply ONLY one url.`;

  const rawAnswer = await runAgentAndGetFinalText(linkFinderAgent, 'link_finder_app', query);
  const candidate = sanitizeJsonBlock(rawAnswer).split(/\s+/)[0] ?? '';

  if (!candidate || candidate.includes('NOT_FOUND')) {
    return null;
  }

  return isValidHttpUrl(candidate) ? candidate : null;
}

async function verifyAndRepairResources(circuit: LearningCircuit, gemini: Gemini): Promise<LearningCircuit> {
  for (const modul of circuit.moduls as Modul[]) {
    for (const todo of modul.todos as Todo[]) {
      const survivingResources: Resource[] = [];

      for (const resource of todo.resources) {
        let finalUrl: string | null = null;

        if (isValidHttpUrl(resource.url) && (await isUrlAlive(resource.url))) {
          finalUrl = resource.url;
        } else {
          for (let attempt = 0; attempt < MAX_LINK_REPAIR_ATTEMPTS && !finalUrl; attempt++) {
            const replacement = await findReplacementLink(todo.task, resource.title, resource.platform, gemini);
            if (replacement && (await isUrlAlive(replacement))) {
              finalUrl = replacement;
            }
          }
        }

        if (finalUrl) {
          survivingResources.push({ ...resource, url: finalUrl });
        } else {
          // Dead link + no agent replacement found => inject a search fallback
          const searchQuery = encodeURIComponent(`${todo.task} ${resource.title} tutorial`);
          survivingResources.push({ ...resource, url: `https://www.google.com/search?q=${searchQuery}` });
        }
      }

      todo.resources = survivingResources;
    }
  }

  return circuit;
}

// ============================================================
// SERVER ACTION — Sequential Pipeline (Generate & Review Pattern)
// STEP 1 research -> STEP 2 curation -> STEP 3 link verification & repair.
// The final output JSON shape STAYS THE SAME as before (LearningCircuitSchema);
// only the "resources" content is now verified.
// ============================================================
export async function generateLearningCampaign(
  input: LearningCircuitInput,
  apiKey: string,
  model: string = 'gemini-3.5-flash',
  isLiteMode: boolean = false
): Promise<{ success: boolean; data?: LearningCircuit; error?: string }> {
  const parsedInput = LearningCircuitInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: `Invalid input: ${parsedInput.error.message}` };
  }

  const validInput = parsedInput.data;

  try {
    const gemini = new Gemini({ model, apiKey });

    if (isLiteMode) {
      // LITE PATH: skip research & link verification, use Lite schema
      const circuit = await runLiteCuratorAgent(validInput, gemini);
      return { success: true, data: circuit };
    }

    // FULL PATH: research -> curation -> link verification
    // STEP 1: Internet research via Google Search tool
    const researchText = await runResearchAgent(validInput, gemini);

    // STEP 2: Curate research results into a Learning Circuit JSON
    const circuit = await runCuratorAgent(validInput, researchText, gemini);

    // STEP 3: Verify & repair dead links before sending to the client
    const verifiedCircuit = await verifyAndRepairResources(circuit, gemini);

    return { success: true, data: verifiedCircuit };
  } catch (error) {
    console.error("--- ADK PIPELINE ERROR REPORT ---");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("----------------------------------");

    return {
      success: false,
      error: `Failed to process Learning Circuit: ${error instanceof Error ? error.message : 'Invalid format'}`,
    };
  }
}

// ============================================================
// QUEST GENERATION SCHEMAS (for in-campaign AI generation)
// ============================================================

const GeneratedQuestSchema = z.object({
  title: z.string().describe("Title of the quest"),
  description: z.string().optional().describe("Brief description of what this quest covers"),
  idealDaysToComplete: z.number().describe("Estimated days to complete this quest"),
  tasks: z.array(z.string()).min(1).describe("Concrete actionable tasks for this quest"),
});

const GeneratedQuestsSchema = z.object({
  quests: z.array(GeneratedQuestSchema).min(1).max(5),
});

// ============================================================
// GENERATE QUESTS — AI generates quests for an existing campaign
// ============================================================
export async function generateQuests(
  campaignTitle: string,
  campaignDescription: string,
  userPrompt: string,
  apiKey: string,
  model: string = 'gemini-3.5-flash',
  count: number = 3
): Promise<{ success: boolean; data?: Modul[]; error?: string }> {
  const gemini = new Gemini({ model, apiKey });

  const agent = new LlmAgent({
    name: 'quest_generator_agent',
    model: gemini,
    instruction:
      'You are a learning curriculum designer. ' +
      `Generate exactly ${count} quests that fit within the given campaign. ` +
      'Each quest must be a logical milestone with concrete, actionable tasks. ' +
      'Tasks should be specific and measurable. ' +
      'Output JSON matching the schema with an array of quests.',
    outputSchema: GeneratedQuestsSchema,
  });

  const query =
    `Campaign: "${campaignTitle}"\n` +
    `Description: "${campaignDescription}"\n` +
    `User request: "${userPrompt}"\n` +
    `Generate ${count} quests.`;

  try {
    const finalText = await runAgentAndGetFinalText(agent, 'quest_generator_app', query);

    if (!finalText) {
      return { success: false, error: 'Agent did not produce a response.' };
    }

    const cleanJson = sanitizeJsonBlock(finalText);
    const parsed: unknown = JSON.parse(cleanJson);
    const validated = GeneratedQuestsSchema.safeParse(parsed);

    if (!validated.success) {
      return { success: false, error: `Invalid response format: ${validated.error.message}` };
    }

    const moduls: Modul[] = validated.data.quests.map((q) => ({
      id: crypto.randomUUID(),
      title: q.title,
      description: q.description,
      idealDaysToComplete: q.idealDaysToComplete,
      done: false,
      todos: q.tasks.map((task) => ({
        id: crypto.randomUUID(),
        task,
        isDone: false,
        resources: [],
      })),
    }));

    return { success: true, data: moduls };
  } catch (error) {
    console.error('generateQuests error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate quests',
    };
  }
}

// ============================================================
// TASK RESOURCE GENERATION — AI suggests learning resources
// ============================================================
const TaskResourceSchema = z.object({
  platform: z.string().describe("Source platform name, e.g. YouTube, Article, Official Docs, Blog"),
  title: z.string().describe("Short descriptive title of the resource"),
  url: z.string().describe("A valid HTTP/HTTPS URL to the resource"),
});

const TaskResourcesSchema = z.object({
  resources: z.array(TaskResourceSchema).min(1).max(3),
});

export async function generateTaskResources(
  taskText: string,
  campaignTitle: string,
  campaignDescription: string,
  apiKey: string,
  model: string = 'gemini-3.5-flash'
): Promise<{ success: boolean; data?: { platform: string; title: string; url: string }[]; error?: string }> {
  const gemini = new Gemini({ model, apiKey });

  const agent = new LlmAgent({
    name: 'task_resource_agent',
    model: gemini,
    instruction:
      'You are a learning resource curator. ' +
      'Given a learning task and the campaign context, suggest 1-3 real, helpful educational resources. ' +
      'CRITICAL: Only recommend resources that are LIVE and publicly accessible today. ' +
      'Prefer content published within the last 2 years from established authors and platforms. ' +
      'For YouTube: direct video URLs only (youtube.com/watch?v=...). No channel/playlist pages. ' +
      'Avoid AI-generated or spammy blog posts. Prefer official docs, established tutorial sites, and reputable courses. ' +
      'Include the platform name (e.g. YouTube, Article, Official Docs, Blog, Course), a short title, and a valid URL. ' +
      'Output JSON matching the given schema.',
    outputSchema: TaskResourcesSchema,
  });

  const query =
    `Campaign: "${campaignTitle}"\n` +
    `Campaign Description: "${campaignDescription}"\n` +
    `Task: "${taskText}"\n` +
    `Suggest 1-3 educational resources for this task.`;

  try {
    const finalText = await runAgentAndGetFinalText(agent, 'task_resource_app', query);

    if (!finalText) {
      return { success: false, error: 'Agent did not produce a response.' };
    }

    const cleanJson = sanitizeJsonBlock(finalText);
    const parsed: unknown = JSON.parse(cleanJson);
    const validated = TaskResourcesSchema.safeParse(parsed);

    if (!validated.success) {
      return { success: false, error: `Invalid response format: ${validated.error.message}` };
    }

    return { success: true, data: validated.data.resources };
  } catch (error) {
    console.error('generateTaskResources error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate resources',
    };
  }
}

// ============================================================
// PROOF OF WORK VERIFICATION — Strict Technical Code Reviewer
// ============================================================
const LINK_PROOF_TYPE_LABELS: Record<string, string> = {
  github_repo: 'GitHub Repository URL',
  live_app: 'Live App / Production Link',
  technical_snippet: 'Technical Snippet (Console Logs / Code Blocks)',
  blog_post: 'Blog Post / Article URL',
  social_post: 'Social Media Post URL',
};

function buildLinkVerificationPrompt(
  modulTitle: string,
  campaignDescription: string,
  modulTasks: string[],
  proofTypeLabel: string,
  proofContent: string
): string {
  return (
    'You are a Senior Technical Auditor and Pragmatic Mentor.\n' +
    '\n' +
    'You are evaluating proof of work for a learning quest.\n' +
    '\n' +
    `QUEST TITLE: "${modulTitle}"\n` +
    `CAMPAIGN DESCRIPTION: "${campaignDescription}"\n` +
    'PRACTICAL TASKS:\n' +
    `${modulTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` +
    '\n' +
    `PROOF TYPE: ${proofTypeLabel}\n` +
    'PROOF CONTENT:\n' +
    `${proofContent}\n` +
    '\n' +
    'INSTRUCTIONS:\n' +
    '- You are a pragmatic, strict reviewer. Do NOT accept vague theoretical summaries.\n' +
    '- Inspect the submission. If it is a GitHub link, evaluate if the user description of their code structure sounds sane and matches the quest goals.\n' +
    '- If it is a log/snippet, verify that it represents execution, not just text copying.\n' +
    '- If it is a blog post or social post, evaluate if the content demonstrates the learning.\n' +
    '- Be strict but encouraging.\n' +
    '- Output the evaluation as structured JSON with isVerified, feedback, and confidenceScore.'
  );
}

export async function verifyLinkProgress(
  modulTitle: string,
  proofType: string,
  proofContent: string,
  campaignDescription: string,
  modulTasks: string[],
  apiKey: string,
  model: string = 'gemini-3.5-flash'
): Promise<{
  success: boolean;
  isVerified?: boolean;
  feedback?: string;
  confidenceScore?: number;
  error?: string;
}> {
  const gemini = new Gemini({ model, apiKey });

  const prompt = buildLinkVerificationPrompt(
    modulTitle,
    campaignDescription,
    modulTasks,
    LINK_PROOF_TYPE_LABELS[proofType] || proofType,
    proofContent
  );

  const agent = new LlmAgent({
    name: 'link_verification_agent',
    model: gemini,
    instruction: prompt,
    outputSchema: VerificationResultSchema,
  });

  try {
    const finalText = await runAgentAndGetFinalText(
      agent,
      'link_verification_app',
      'Evaluate the proof of work now.'
    );

    if (!finalText) {
      return { success: false, error: 'Agent did not produce a response.' };
    }

    const cleanJson = sanitizeJsonBlock(finalText);
    const parsed: unknown = JSON.parse(cleanJson);
    const validated = VerificationResultSchema.safeParse(parsed);

    if (validated.success) {
      return {
        success: true,
        isVerified: validated.data.isVerified,
        feedback: validated.data.feedback,
        confidenceScore: validated.data.confidenceScore,
      };
    }

    return {
      success: false,
      error: `Invalid response format: ${validated.error.message}`,
    };
  } catch (error) {
    console.error('Error during link verification:', error);
    return { success: false, error: 'Failed to verify proof of work.' };
  }
}

// ============================================================
// ESSAY VERIFICATION — Written Analysis Quality Auditor
// ============================================================
function buildEssayPrompt(
  modulTitle: string,
  campaignDescription: string,
  modulTasks: string[],
  essayPrompt: string,
  essayText: string
): string {
  return (
    'You are a supportive yet rigorous Learning Mentor.\n' +
    '\n' +
    'A learner has submitted a written essay/analysis for a quest. Evaluate it.\n' +
    '\n' +
    `QUEST TITLE: "${modulTitle}"\n` +
    `CAMPAIGN DESCRIPTION: "${campaignDescription}"\n` +
    'QUEST TASKS:\n' +
    `${modulTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` +
    '\n' +
    `ESSAY PROMPT: "${essayPrompt}"\n` +
    'LEARNER\'S ESSAY:\n' +
    `${essayText}\n` +
    '\n' +
    'INSTRUCTIONS:\n' +
    '- Evaluate if the essay thoughtfully addresses the prompt and demonstrates understanding of the quest concepts.\n' +
    '- If the essay shows genuine comprehension, effort, and alignment with the learning goals, mark isVerified=true.\n' +
    '- If the essay is superficial, off-topic, or shows lack of understanding, mark isVerified=false and explain why.\n' +
    '- ALWAYS include genuine encouragement and appreciation for their effort, regardless of outcome.\n' +
    '- Be constructive: if rejected, suggest specific ways to improve the analysis.\n' +
    '- Output the evaluation as structured JSON with isVerified, feedback, and confidenceScore.'
  );
}

export async function verifyEssay(
  modulTitle: string,
  essayText: string,
  essayPrompt: string,
  campaignDescription: string,
  modulTasks: string[],
  apiKey: string,
  model: string = 'gemini-3.5-flash'
): Promise<{
  success: boolean;
  isVerified?: boolean;
  feedback?: string;
  confidenceScore?: number;
  error?: string;
}> {
  const gemini = new Gemini({ model, apiKey });

  const prompt = buildEssayPrompt(
    modulTitle,
    campaignDescription,
    modulTasks,
    essayPrompt,
    essayText
  );

  const agent = new LlmAgent({
    name: 'essay_verification_agent',
    model: gemini,
    instruction: prompt,
    outputSchema: VerificationResultSchema,
  });

  try {
    const finalText = await runAgentAndGetFinalText(
      agent,
      'essay_verification_app',
      'Evaluate the essay now.'
    );

    if (!finalText) {
      return { success: false, error: 'Agent did not produce a response.' };
    }

    const cleanJson = sanitizeJsonBlock(finalText);
    const parsed: unknown = JSON.parse(cleanJson);
    const validated = VerificationResultSchema.safeParse(parsed);

    if (validated.success) {
      return {
        success: true,
        isVerified: validated.data.isVerified,
        feedback: validated.data.feedback,
        confidenceScore: validated.data.confidenceScore,
      };
    }

    return {
      success: false,
      error: `Invalid response format: ${validated.error.message}`,
    };
  } catch (error) {
    console.error('Error during essay verification:', error);
    return { success: false, error: 'Failed to verify essay.' };
  }
}

// ============================================================
// REFLECTION VERIFICATION — Engagement & Understanding Evaluator
// ============================================================
function buildReflectionPrompt(
  modulTitle: string,
  campaignDescription: string,
  modulTasks: string[],
  reflectionText: string
): string {
  return (
    'You are a supportive yet thoughtful Learning Mentor.\n' +
    '\n' +
    'A learner has submitted a personal reflection on their learning journey. Evaluate it.\n' +
    '\n' +
    `QUEST TITLE: "${modulTitle}"\n` +
    `CAMPAIGN DESCRIPTION: "${campaignDescription}"\n` +
    'QUEST TASKS:\n' +
    `${modulTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` +
    '\n' +
    'LEARNER\'S REFLECTION:\n' +
    `${reflectionText}\n` +
    '\n' +
    'INSTRUCTIONS:\n' +
    '- Evaluate if the reflection demonstrates genuine engagement, learning, and understanding of the quest concepts.\n' +
    '- If the reflection shows sincere effort, personal insight, and alignment with the learning goals, mark isVerified=true.\n' +
    '- If the reflection is superficial, generic, or shows no real engagement with the material, mark isVerified=false and explain why.\n' +
    '- ALWAYS include genuine encouragement and appreciation for their effort, regardless of outcome.\n' +
    '- Be constructive: if rejected, suggest how to deepen their reflection.\n' +
    '- Output the evaluation as structured JSON with isVerified, feedback, and confidenceScore.'
  );
}

export async function verifyReflection(
  modulTitle: string,
  reflectionText: string,
  campaignDescription: string,
  modulTasks: string[],
  apiKey: string,
  model: string = 'gemini-3.5-flash'
): Promise<{
  success: boolean;
  isVerified?: boolean;
  feedback?: string;
  confidenceScore?: number;
  error?: string;
}> {
  const gemini = new Gemini({ model, apiKey });

  const prompt = buildReflectionPrompt(
    modulTitle,
    campaignDescription,
    modulTasks,
    reflectionText
  );

  const agent = new LlmAgent({
    name: 'reflection_verification_agent',
    model: gemini,
    instruction: prompt,
    outputSchema: VerificationResultSchema,
  });

  try {
    const finalText = await runAgentAndGetFinalText(
      agent,
      'reflection_verification_app',
      'Evaluate the reflection now.'
    );

    if (!finalText) {
      return { success: false, error: 'Agent did not produce a response.' };
    }

    const cleanJson = sanitizeJsonBlock(finalText);
    const parsed: unknown = JSON.parse(cleanJson);
    const validated = VerificationResultSchema.safeParse(parsed);

    if (validated.success) {
      return {
        success: true,
        isVerified: validated.data.isVerified,
        feedback: validated.data.feedback,
        confidenceScore: validated.data.confidenceScore,
      };
    }

    return {
      success: false,
      error: `Invalid response format: ${validated.error.message}`,
    };
  } catch (error) {
    console.error('Error during reflection verification:', error);
    return { success: false, error: 'Failed to verify reflection.' };
  }
}

// ============================================================
// LAZY VERIFICATION TYPE DETERMINATION
// Called when user clicks "Verify Quest" - determines the
// appropriate verification type and generates prompts based
// on the actual learning tasks in the modul.
// ============================================================
function buildVerificationTypePrompt(
  modulTitle: string,
  tasks: string[],
): string {
  return (
    'You are a learning experience designer.\n' +
    '\n' +
    'Given a quest title and its learning tasks, determine the best verification type and generate the appropriate prompt.\n' +
    '\n' +
    `QUEST TITLE: "${modulTitle}"\n` +
    'LEARNING TASKS:\n' +
    `${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` +
    '\n' +
    'INSTRUCTIONS:\n' +
    'Choose the verification type based on the tasks:\n' +
    '- "reflection": for conceptual tasks where the learner reflects on what they learned. Set minReflectionLength (default 100).\n' +
    '- "essay": for analysis, explanation, or demonstration of understanding. Set essayPrompt with the specific question to answer.\n' +
    '- "link": for hands-on tasks where a tangible output is produced (code, deployment, publication). Set linkInstructions describing exactly what link to submit.\n' +
    'IMPORTANT: Tasks involving visual/creative output (pixel art, drawings, design files, images, videos) cannot be verified via link. Use "essay" instead for such tasks.\n' +
    'Pick the most appropriate type and fill in the required field for that type.\n' +
    'Output the evaluation as structured JSON with type and the appropriate fields.'
  );
}

export async function determineVerificationType(
  modulTitle: string,
  tasks: string[],
  apiKey: string,
  model: string = 'gemini-3.5-flash'
): Promise<{
  success: boolean;
  data?: {
    type: 'reflection' | 'essay' | 'link';
    minReflectionLength?: number;
    essayPrompt?: string;
    linkInstructions?: string;
  };
  error?: string;
}> {
  const gemini = new Gemini({ model, apiKey });

  const prompt = buildVerificationTypePrompt(modulTitle, tasks);

  const agent = new LlmAgent({
    name: 'verification_type_agent',
    model: gemini,
    instruction: prompt,
    outputSchema: VerificationTypeSchema,
  });

  try {
    const finalText = await runAgentAndGetFinalText(
      agent,
      'verification_type_app',
      'Determine the verification type now.'
    );

    if (!finalText) {
      return { success: false, error: 'Agent did not produce a response.' };
    }

    const cleanJson = sanitizeJsonBlock(finalText);
    const parsed: unknown = JSON.parse(cleanJson);
    const validated = VerificationTypeSchema.safeParse(parsed);

    if (validated.success) {
      return {
        success: true,
        data: validated.data,
      };
    }

    return {
      success: false,
      error: `Invalid response format: ${validated.error.message}`,
    };
  } catch (error) {
    console.error('Error during verification type determination:', error);
    return { success: false, error: 'Failed to determine verification type.' };
  }
}