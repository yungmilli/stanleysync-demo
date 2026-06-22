import { NextResponse } from "next/server";

import { quoteAnswersSchema } from "@/features/quotes/schema";
import { persistQuoteRequest } from "@/features/quotes/submit";
import type { ConversationMessage, QuoteAnswers } from "@/features/quotes/types";

const FIELD_LABELS: Record<string, string> = {
  serviceType: "service type",
  contactName: "customer name",
  company: "company or individual name",
  email: "email address",
  issueDescription: "work description (at least 8 characters)",
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = formData.get("payload");

    if (typeof payload !== "string") {
      return NextResponse.json({ message: "Missing payload." }, { status: 400 });
    }

    const parsed = JSON.parse(payload) as {
      answers: QuoteAnswers;
      transcript: ConversationMessage[];
    };
    const validatedAnswers = quoteAnswersSchema.safeParse(parsed.answers);

    if (!validatedAnswers.success) {
      const missingFields = Array.from(new Set(validatedAnswers.error.issues.map((issue) => {
        const field = String(issue.path[0] ?? "quote details");
        return FIELD_LABELS[field] ?? field;
      })));

      return NextResponse.json(
        {
          message: `Please complete: ${missingFields.join(", ")}.`,
          missingFields,
        },
        { status: 422 },
      );
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    const result = await persistQuoteRequest({
      answers: parsed.answers,
      transcript: parsed.transcript,
      files,
    });

    return NextResponse.json({
      status: "ok",
      quoteNumber: result.quoteNumber,
      summary: result.summary,
      suggestedPriority: result.suggestedPriority,
      suggestedTicketType: result.suggestedTicketType,
    });
  } catch (error) {
    console.error("Quote submission error", error);
    return NextResponse.json(
      {
        message: "Your answers are complete, but the quote could not be saved. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
