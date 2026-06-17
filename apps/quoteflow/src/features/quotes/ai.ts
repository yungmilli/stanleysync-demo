import OpenAI from "openai";

import { env } from "@/lib/env";
import { buildStructuredSummary } from "@/features/quotes/summary";
import type {
  ConversationMessage,
  IntakeAnalysis,
  QuestionDefinition,
  QuoteAnswers,
} from "@/features/quotes/types";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

function safeParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function generateGuidedPrompt(
  question: QuestionDefinition,
  answers: QuoteAnswers,
  transcript: ConversationMessage[],
) {
  if (!openai) {
    return question.prompt;
  }

  try {
    const completion = await openai.responses.create({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are an intake assistant for StanleySync. Ask exactly one concise next question. Keep it professional, plain, and specific to calibration or service work. Return JSON with a single key named question.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                nextField: question.key,
                defaultPrompt: question.prompt,
                inputType: question.input,
                answers,
                transcript,
              }),
            },
          ],
        },
      ],
    });

    const parsed = safeParseJson<{ question?: string }>(completion.output_text?.trim() ?? "");
    return parsed?.question?.trim() || question.prompt;
  } catch {
    return question.prompt;
  }
}

export async function analyzeQuoteIntake(
  answers: QuoteAnswers,
  transcript: ConversationMessage[],
): Promise<IntakeAnalysis> {
  const fallback = buildStructuredSummary(answers);

  if (!openai) {
    return fallback;
  }

  try {
    const completion = await openai.responses.create({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You analyze service-business quote intake for calibration, repair, and field work. Return strict JSON with keys summary, extractedFields, structuredData, suggestedPriority, suggestedTicketType. Keep the summary concise and operational. Suggested priority must be LOW, NORMAL, HIGH, or URGENT. Suggested ticket type must be CALIBRATION, REPAIR, FIELD_SERVICE, CUSTOM_SERVICE, or OTHER.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                answers,
                transcript,
                fallback,
              }),
            },
          ],
        },
      ],
    });

    const parsed = safeParseJson<IntakeAnalysis>(completion.output_text?.trim() ?? "");
    if (!parsed?.summary || !parsed.structuredData || !parsed.extractedFields) {
      return fallback;
    }

    return {
      ...fallback,
      ...parsed,
      suggestedPriority: parsed.suggestedPriority ?? fallback.suggestedPriority,
      suggestedTicketType: parsed.suggestedTicketType ?? fallback.suggestedTicketType,
    };
  } catch {
    return fallback;
  }
}
