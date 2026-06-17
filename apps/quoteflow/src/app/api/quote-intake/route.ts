import { NextResponse } from "next/server";

import { analyzeQuoteIntake, generateGuidedPrompt } from "@/features/quotes/ai";
import { getNextQuestion } from "@/features/quotes/questions";
import { quoteConversationSchema } from "@/features/quotes/schema";
import type { QuoteAnswers } from "@/features/quotes/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = quoteConversationSchema.parse(body);
    const answers = parsed.answers as QuoteAnswers;
    const nextQuestion = getNextQuestion(answers);

    if (!nextQuestion) {
      const analysis = await analyzeQuoteIntake(answers, parsed.transcript);
      return NextResponse.json({
        status: "complete",
        analysis,
      });
    }

    const prompt = await generateGuidedPrompt(nextQuestion, answers, parsed.transcript);

    return NextResponse.json({
      status: "question",
      question: {
        ...nextQuestion,
        prompt,
      },
    });
  } catch (error) {
    console.error("Quote intake error", error);
    return NextResponse.json(
      {
        status: "error",
        message: "We could not continue the intake right now. Please try again.",
      },
      { status: 400 },
    );
  }
}
