"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Bot, CircleCheckBig, LoaderCircle, Paperclip, SendHorizontal, Sparkles } from "lucide-react";

import type {
  ConversationMessage,
  IntakeMode,
  IntakeAnalysis,
  QuestionDefinition,
  QuoteAnswers,
} from "@/features/quotes/types";
import { INTAKE_MODE_OPTIONS, SERVICE_MODE_OPTIONS, SERVICE_TYPE_OPTIONS } from "@/features/quotes/types";
import { getQuestionPlan, getSuggestedConversionPath } from "@/features/quotes/questions";
import { formatPhone, sentenceCase } from "@/lib/utils";

type IntakeResponse =
  | {
      status: "question";
      question: QuestionDefinition;
    }
  | {
      status: "complete";
      analysis: IntakeAnalysis;
    }
  | {
      status: "error";
      message: string;
    };

const INITIAL_PROMPT =
  "What kind of request should we help you quote?";

const INITIAL_QUESTION: QuestionDefinition = {
  key: "serviceType",
  prompt: INITIAL_PROMPT,
  input: "select",
  options: SERVICE_TYPE_OPTIONS,
  required: true,
};

type AnswerHistoryItem = {
  question: QuestionDefinition;
  answer: QuoteAnswers[QuestionDefinition["key"]];
  displayValue: string;
};

export function QuoteAssistant({
  workspaceKey,
  initialMode = "GENERAL",
  initialServiceType,
  portalBrand,
}: {
  workspaceKey?: string;
  initialMode?: IntakeMode;
  initialServiceType?: QuoteAnswers["serviceType"];
  portalBrand?: {
    businessName: string;
    logoPlaceholder?: string | null;
    accent?: string | null;
  };
}) {
  const seededAnswers: QuoteAnswers = {
    intakeMode: initialMode,
    ...(initialServiceType ? { serviceType: initialServiceType } : {}),
    ...(workspaceKey ? { workspaceKey } : {}),
  };
  const [answers, setAnswers] = useState<QuoteAnswers>(seededAnswers);
  const [transcript, setTranscript] = useState<ConversationMessage[]>([
    { role: "assistant", content: portalBrand ? `Welcome to ${portalBrand.businessName}. ${INITIAL_PROMPT}` : INITIAL_PROMPT },
  ]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDefinition | null>(null);
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    quoteNumber: string;
    summary: string;
    suggestedPriority: string;
  } | null>(null);
  const didAutoStart = useRef(false);

  useEffect(() => {
    if (didAutoStart.current || !answers.serviceType) return;
    didAutoStart.current = true;
    void loadNextQuestion(answers, transcript);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressItems = useMemo(
    () => [
      ["Service type", answers.serviceType ? sentenceCase(answers.serviceType) : "Pending"],
      ["Contact", answers.contactName ? `${answers.contactName} - ${answers.company}` : "Pending"],
      [
        answers.intakeMode === "CALIBRATION" ? "Equipment" : "Work requested",
        answers.equipmentType ?? answers.serviceCategory ?? "Pending",
      ],
      ["Logistics", answers.serviceMode ? sentenceCase(answers.serviceMode) : "Pending"],
    ],
    [answers],
  );
  const questionPlan = useMemo(() => {
    const base = answers.serviceType ? getQuestionPlan(answers) : [INITIAL_QUESTION];
    return base;
  }, [answers]);
  const answeredCount = answerHistory.length;
  const totalSteps = Math.max(questionPlan.length + (answers.serviceType ? 0 : 1), answeredCount + (currentQuestion ? 1 : 0));
  const progressPercent = Math.min(100, Math.round((answeredCount / Math.max(totalSteps, 1)) * 100));

  async function loadNextQuestion(nextAnswers: QuoteAnswers, nextTranscript = transcript) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quote-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: nextAnswers,
          transcript: nextTranscript,
        }),
      });

      const data = (await response.json()) as IntakeResponse;

      if (data.status === "question") {
        setCurrentQuestion(data.question);
        setAnalysis(null);
      } else if (data.status === "complete") {
        setCurrentQuestion(null);
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.message);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Unable to continue the intake right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function normalizeAnswer(question: QuestionDefinition, value: string) {
    if (question.key === "phone") {
      return formatPhone(value);
    }

    if (question.input === "number") {
      return Number(value);
    }

    return value;
  }

  function answerQuestion(rawValue: string, displayValue?: string) {
    if (!currentQuestion) return;

    const normalizedValue = normalizeAnswer(currentQuestion, rawValue);
    const userMessage = displayValue ?? rawValue;
    const nextAnswers = {
      ...answers,
      [currentQuestion.key]: normalizedValue,
    } satisfies QuoteAnswers;
    const nextTranscript = cleanTranscript([...transcript]) satisfies ConversationMessage[];
    if (nextTranscript.at(-1)?.content !== currentQuestion.prompt) {
      nextTranscript.push({ role: "assistant", content: currentQuestion.prompt });
    }
    nextTranscript.push({ role: "user", content: userMessage });

    setAnswers(nextAnswers);
    setTranscript(cleanTranscript(nextTranscript));
    setAnswerHistory((items) => [
      ...items,
      { question: currentQuestion, answer: normalizedValue, displayValue: userMessage },
    ]);
    setInputValue("");

    startTransition(() => {
      void loadNextQuestion(nextAnswers, nextTranscript);
    });
  }

  function selectIntakeMode(mode: IntakeMode) {
    const serviceType =
      mode === "CALIBRATION"
        ? "CALIBRATION"
        : mode === "AUTO" || mode === "REPAIR_SHOP"
          ? "REPAIR"
          : mode === "FIELD" || mode === "WEBSITE" || mode === "CUSTOM" || mode === "GENERAL"
            ? "CUSTOM_SERVICE"
            : undefined;
    const nextAnswers: QuoteAnswers = {
      intakeMode: mode,
      ...(workspaceKey ? { workspaceKey } : {}),
      ...(serviceType ? { serviceType } : {}),
    };
    const message =
      mode === "CALIBRATION"
        ? "Calibration lab request"
        : mode === "AUTO"
          ? "Auto repair request"
          : mode === "FIELD"
            ? "Contractor or field service request"
            : mode === "REPAIR_SHOP"
              ? "Repair shop request"
              : mode === "WEBSITE"
                ? "Website or design request"
                : mode === "CUSTOM"
                  ? "Custom business request"
        : "General service request";
    const nextTranscript = [
      { role: "assistant", content: INITIAL_PROMPT },
      { role: "user", content: message },
    ] satisfies ConversationMessage[];

    setAnswers(nextAnswers);
    setTranscript(cleanTranscript(nextTranscript));
    setAnswerHistory([]);
    setInputValue("");
    startTransition(() => {
      void loadNextQuestion(nextAnswers, nextTranscript);
    });
  }

  function handleBack() {
    const previous = answerHistory.at(-1);
    if (!previous) {
      setAnalysis(null);
      setCurrentQuestion(INITIAL_QUESTION);
      return;
    }

    const nextAnswers = { ...answers };
    delete nextAnswers[previous.question.key];
    setAnswers(nextAnswers);
    setAnswerHistory((items) => items.slice(0, -1));
    setTranscript((items) => items.slice(0, Math.max(1, items.length - 2)));
    setCurrentQuestion(previous.question);
    setAnalysis(null);
    setInputValue(typeof previous.answer === "number" ? String(previous.answer) : String(previous.answer ?? ""));
  }

  async function handleSubmitQuote() {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify({ answers, transcript: cleanTranscript(transcript) }));

      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/quote-submissions", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        quoteNumber?: string;
        summary?: string;
        suggestedPriority?: string;
        message?: string;
      };

      if (!response.ok || !data.quoteNumber || !data.summary) {
        throw new Error(data.message ?? "Unable to submit quote request.");
      }

      setSuccess({
        quoteNumber: data.quoteNumber,
        summary: data.summary,
        suggestedPriority: data.suggestedPriority ?? "NORMAL",
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to submit quote request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_320px]">
      <section className="app-panel overflow-hidden rounded-[1.2rem]">
        <div className="flex items-center justify-between gap-4 border-b border-[#12212c]/10 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#12212c] p-2 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[0.98rem] font-semibold">Guided quote intake</h2>
              <p className="text-xs text-[#64707a]">
                Dynamic questions based on business workflow, site needs, and documentation requirements.
              </p>
            </div>
          </div>
          <div className="hidden rounded-full bg-[#fff4e6] px-2.5 py-0.5 text-[0.7rem] font-medium text-[#9e4f18] sm:inline-flex">
            Customer-facing
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col justify-between">
          <div className="space-y-2.5 px-4 py-4">
            {portalBrand ? (
              <div className="mb-3 flex items-center gap-3 rounded-[0.95rem] border border-[#12212c]/10 bg-white/65 px-3 py-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[0.78rem] text-sm font-semibold text-white"
                  style={{ backgroundColor: portalBrand.accent ?? "#c46a29" }}
                >
                  {portalBrand.logoPlaceholder ?? "SS"}
                </div>
                <div>
                  <p className="text-sm font-semibold">{portalBrand.businessName}</p>
                  <p className="text-xs text-[#64707a]">Public quote intake portal</p>
                </div>
              </div>
            ) : null}

            {!answers.serviceType && !portalBrand ? (
              <div className="mb-2 grid gap-2 sm:grid-cols-2">
                {INTAKE_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-[0.82rem] border px-3 py-2.5 text-left text-[0.84rem] font-medium transition ${
                      answers.intakeMode === option.value
                        ? "border-[#c46a29] bg-[#fff4e6] text-[#12212c]"
                        : "border-[#12212c]/10 bg-white/70 text-[#12212c] hover:border-[#c46a29]"
                    }`}
                    onClick={() => selectIntakeMode(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            {cleanTranscript(transcript).map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "assistant"
                    ? "max-w-[80%] rounded-[0.95rem] rounded-tl-sm bg-[#12212c] px-3 py-2.5 text-[0.9rem] leading-5 text-white"
                    : "ml-auto max-w-[80%] rounded-[0.95rem] rounded-tr-sm bg-[#f2e8da] px-3 py-2.5 text-[0.9rem] leading-5 text-[#12212c]"
                }
              >
                {message.content}
              </div>
            ))}

            {isLoading ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#12212c]/10 bg-white px-3 py-1.5 text-xs text-[#64707a]">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Building the next question
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#12212c]/10 px-4 py-3.5">
            {currentQuestion ? (
              <QuestionInput
                question={currentQuestion}
                inputValue={inputValue}
                onInputValueChange={setInputValue}
                onSubmit={answerQuestion}
                onBack={handleBack}
                canBack={answerHistory.length > 0}
                stepLabel={`Step ${Math.min(answeredCount + 1, totalSteps)} of ${totalSteps}`}
              />
            ) : analysis ? (
              <div className="space-y-3.5">
                <div className="rounded-[0.9rem] bg-[#11202b] px-3.5 py-3.5 text-white">
                  <div className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.12em] text-[#d6b48f]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Structured summary
                  </div>
                  <p className="mt-2 text-[0.9rem] leading-5 text-white/85">{analysis.summary}</p>
                </div>

                <div className="grid gap-2.5 md:grid-cols-2">
                  <CompactSummary label="Suggested priority" value={analysis.suggestedPriority} />
                  <CompactSummary
                    label="Suggested ticket type"
                    value={sentenceCase(analysis.suggestedTicketType)}
                  />
                  <CompactSummary
                    label="Equipment"
                    value={analysis.structuredData.equipment.type ?? "Not captured"}
                  />
                  <CompactSummary
                    label="Requested turnaround"
                    value={analysis.structuredData.service.requestedTurnaround ?? "Not captured"}
                  />
                  <CompactSummary
                    label="Suggested conversion"
                    value={getSuggestedConversionPath(answers)}
                  />
                </div>

                <ReviewSection answers={answers} />

                <label className="flex cursor-pointer items-center gap-3 rounded-[0.82rem] border border-dashed border-[#12212c]/16 bg-white/60 px-3 py-2.5 text-[0.84rem] text-[#64707a]">
                  <Paperclip className="h-4 w-4" />
                  <span>Add photos or supporting files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                  />
                </label>

                {files.length > 0 ? (
                  <div className="rounded-[0.82rem] border border-[#12212c]/10 bg-white/70 px-3 py-2.5 text-xs text-[#64707a]">
                    {files.map((file) => (
                      <div key={`${file.name}-${file.size}`}>{file.name}</div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#12212c]/10 px-4 py-2 text-[0.84rem] font-medium"
                    onClick={handleBack}
                  >
                    Back to edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-[#c46a29] px-4 py-2 text-[0.84rem] font-medium text-white transition hover:bg-[#9e4f18] disabled:opacity-60"
                    onClick={handleSubmitQuote}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit quote request"}
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-[#b4514b]">{error}</p> : null}
            {success ? (
              <div className="mt-4 rounded-[0.9rem] border border-[#2b7b62]/15 bg-[#e9f5ef] px-3.5 py-3 text-[0.9rem] text-[#235845]">
                <div className="flex items-center gap-2 font-semibold">
                  <CircleCheckBig className="h-4 w-4" />
                  Quote request received: {success.quoteNumber}
                </div>
                <p className="mt-2 leading-5">{success.summary}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em]">
                  Suggested priority: {success.suggestedPriority}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="space-y-3.5">
        <section className="app-panel rounded-[1rem] p-3.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">
            Intake progress
          </p>
          <div className="mt-3 space-y-2.5">
            <div className="rounded-full bg-[#12212c]/8 p-1">
              <div className="h-2 rounded-full bg-[#c46a29]" style={{ width: `${progressPercent}%` }} />
            </div>
            {progressItems.map(([label, value]) => (
              <div key={label} className="rounded-[0.8rem] border border-[#12212c]/8 bg-white/55 px-2.5 py-2">
                <p className="text-[0.68rem] uppercase tracking-[0.1em] text-[#64707a]">{label}</p>
                <p className="mt-1 text-[0.84rem] font-medium">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel rounded-[1rem] p-3.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">
            Answer history
          </p>
          <div className="mt-3 space-y-2.5">
            {answerHistory.length === 0 ? (
              <p className="text-[0.84rem] leading-5 text-[#64707a]">Answers will appear here as the assistant captures them.</p>
            ) : (
              answerHistory.slice(-6).map((item) => (
                <div key={`${item.question.key}-${item.displayValue}`} className="rounded-[0.8rem] border border-[#12212c]/8 bg-white/55 px-2.5 py-2">
                  <p className="text-[0.68rem] uppercase tracking-[0.1em] text-[#64707a]">{item.question.prompt}</p>
                  <p className="mt-1 text-[0.84rem] font-medium">{item.displayValue}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="app-panel rounded-[1rem] p-3.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">
            Captured data
          </p>
          <ul className="mt-3 space-y-1.5 text-[0.84rem] leading-5 text-[#64707a]">
            <li>Customer and company contact details</li>
            <li>Service category, job notes, and timeline</li>
            <li>Calibration identity fields only when CalOps applies</li>
            <li>Issue description and optional attachments</li>
          </ul>
        </section>

        <section className="app-panel rounded-[1rem] p-3.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">
            Service modes
          </p>
          <div className="mt-3 grid gap-2">
            {SERVICE_MODE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="rounded-[0.8rem] border border-[#12212c]/8 bg-white/55 px-2.5 py-2 text-[0.84rem]"
              >
                {option.label}
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function CompactSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.82rem] border border-[#12212c]/10 bg-white/60 px-3 py-2.5">
      <p className="text-[0.68rem] uppercase tracking-[0.1em] text-[#64707a]">{label}</p>
      <p className="mt-1 text-[0.84rem] font-medium">{value}</p>
    </div>
  );
}

function QuestionInput({
  question,
  inputValue,
  onInputValueChange,
  onSubmit,
  onBack,
  canBack,
  stepLabel,
}: {
  question: QuestionDefinition;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onSubmit: (value: string, displayValue?: string) => void;
  onBack: () => void;
  canBack: boolean;
  stepLabel: string;
}) {
  if (question.input === "select" && question.options) {
    return (
      <div className="space-y-3">
        <QuestionHeader question={question} stepLabel={stepLabel} />
        {question.helpText ? <p className="text-xs text-[#64707a]">{question.helpText}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="rounded-[0.82rem] border border-[#12212c]/10 bg-white/70 px-3 py-2.5 text-left text-[0.84rem] font-medium text-[#12212c] transition hover:border-[#c46a29] hover:bg-[#fff4e6]"
              onClick={() => onSubmit(option.value, option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <QuestionControls canBack={canBack} onBack={onBack} />
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!inputValue.trim()) return;
        onSubmit(inputValue);
      }}
    >
      <QuestionHeader question={question} stepLabel={stepLabel} />
      {question.helpText ? <p className="text-sm leading-6 text-[#64707a]">{question.helpText}</p> : null}
      {question.input === "textarea" ? (
        <textarea
          value={inputValue}
          onChange={(event) => onInputValueChange(event.target.value)}
          placeholder={question.placeholder}
          className="min-h-24 w-full rounded-[0.82rem] border border-[#12212c]/10 bg-white/70 px-3 py-2.5 text-[0.84rem] outline-none transition focus:border-[#c46a29]"
        />
      ) : (
        <input
          value={inputValue}
          type={
            question.input === "email" || question.input === "tel" || question.input === "number" || question.input === "date"
              ? question.input
              : "text"
          }
          onChange={(event) => onInputValueChange(event.target.value)}
          placeholder={question.placeholder}
          className="h-10 w-full rounded-[0.82rem] border border-[#12212c]/10 bg-white/70 px-3 text-[0.84rem] outline-none transition focus:border-[#c46a29]"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <QuestionControls canBack={canBack} onBack={onBack} />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-[#12212c] px-4 py-2 text-[0.84rem] font-medium text-white transition hover:bg-[#1b3343]"
        >
          Continue
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function QuestionHeader({ question, stepLabel }: { question: QuestionDefinition; stepLabel: string }) {
  return (
    <div className="rounded-[0.95rem] border border-[#12212c]/10 bg-white/65 p-3.5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#9e4f18]">{stepLabel}</p>
      <h3 className="mt-1 text-[1.05rem] font-semibold leading-6 text-[#12212c]">{question.prompt}</h3>
    </div>
  );
}

function QuestionControls({ canBack, onBack }: { canBack: boolean; onBack: () => void }) {
  return (
    <button
      type="button"
      disabled={!canBack}
      onClick={onBack}
      className="rounded-full border border-[#12212c]/10 px-4 py-2 text-[0.84rem] font-medium transition hover:border-[#12212c]/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Back
    </button>
  );
}

function ReviewSection({ answers }: { answers: QuoteAnswers }) {
  const rows = [
    ["Customer", `${answers.contactName ?? "Not captured"} - ${answers.company ?? "Not captured"}`],
    ["Contact", `${answers.email ?? "Not captured"} ${answers.phone ? `- ${answers.phone}` : ""}`.trim()],
    ["Service", `${answers.serviceCategory ?? answers.serviceType ?? "Not captured"}`],
    ["Item / project", answers.equipmentType ?? answers.projectType ?? [answers.vehicleYear, answers.vehicleMake, answers.vehicleModel].filter(Boolean).join(" ") ?? "Not captured"],
    ["Logistics", `${answers.locationAddress ?? "Location not captured"} - ${answers.requestedTurnaround ?? "Standard"}`],
    ["Notes", answers.issueDescription ?? "Not captured"],
  ];

  return (
    <div className="rounded-[0.95rem] border border-[#12212c]/10 bg-white/60 p-3.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">Review before submitting</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-[0.78rem] border border-[#12212c]/8 bg-white/60 p-2.5">
            <p className="text-[0.68rem] uppercase tracking-[0.1em] text-[#64707a]">{label}</p>
            <p className="mt-1 text-[0.84rem] font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function cleanTranscript(messages: ConversationMessage[]) {
  return messages.filter((message, index, array) => {
    const previous = array[index - 1];
    return !(previous?.role === message.role && previous.content === message.content);
  });
}
