import { NextResponse } from "next/server";

import { persistQuoteRequest } from "@/features/quotes/submit";
import type { ConversationMessage, QuoteAnswers } from "@/features/quotes/types";

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
        message:
          "The quote request could not be submitted. Please review the required fields and try again.",
      },
      { status: 400 },
    );
  }
}
