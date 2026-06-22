import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  ActivityType,
  NotificationEventType,
  NotificationStatus,
  Priority,
  QuoteStatus,
  ServiceMode,
  ServiceType,
  TicketType,
} from "@prisma/client";

import { analyzeQuoteIntake } from "@/features/quotes/ai";
import { getSuggestedConversionPath } from "@/features/quotes/questions";
import { quoteAnswersSchema } from "@/features/quotes/schema";
import type { ConversationMessage, QuoteAnswers } from "@/features/quotes/types";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  sendAdminNewQuoteEmail,
  sendCustomerQuoteConfirmationEmail,
} from "@/lib/mailer";

function nextRef(prefix: string) {
  const stamp = Date.now().toString().slice(-6);
  return `${prefix}-${stamp}`;
}

function cleanTranscript(messages: ConversationMessage[]) {
  return messages.filter((message, index, array) => {
    const previous = array[index - 1];
    return !(previous?.role === message.role && previous.content === message.content);
  });
}

function toServiceType(value: QuoteAnswers["serviceType"]) {
  switch (value) {
    case "CALIBRATION":
      return ServiceType.CALIBRATION;
    case "REPAIR":
      return ServiceType.REPAIR;
    case "CUSTOM_SERVICE":
      return ServiceType.CUSTOM_SERVICE;
    case "OTHER":
    default:
      return ServiceType.OTHER;
  }
}

function toServiceMode(value: QuoteAnswers["serviceMode"]) {
  switch (value) {
    case "IN_LAB":
      return ServiceMode.IN_LAB;
    case "ON_SITE":
      return ServiceMode.ON_SITE;
    case "SHIP_IN":
      return ServiceMode.SHIP_IN;
    default:
      return null;
  }
}

function toPriority(value: "LOW" | "NORMAL" | "HIGH" | "URGENT") {
  switch (value) {
    case "LOW":
      return Priority.LOW;
    case "HIGH":
      return Priority.HIGH;
    case "URGENT":
      return Priority.URGENT;
    case "NORMAL":
    default:
      return Priority.NORMAL;
  }
}

function toTicketType(
  value: "CALIBRATION" | "REPAIR" | "FIELD_SERVICE" | "CUSTOM_SERVICE" | "OTHER",
) {
  switch (value) {
    case "CALIBRATION":
      return TicketType.CALIBRATION;
    case "REPAIR":
      return TicketType.REPAIR;
    case "FIELD_SERVICE":
      return TicketType.FIELD_SERVICE;
    case "CUSTOM_SERVICE":
      return TicketType.CUSTOM_SERVICE;
    case "OTHER":
    default:
      return TicketType.OTHER;
  }
}

export async function persistQuoteRequest({
  answers,
  transcript,
  files,
}: {
  answers: QuoteAnswers;
  transcript: ConversationMessage[];
  files: File[];
}) {
  const validated = quoteAnswersSchema.parse({
    ...answers,
    unitCount: typeof answers.unitCount === "string" ? Number(answers.unitCount) : answers.unitCount,
  });
  const cleanMessages = cleanTranscript(transcript);
  const analysis = await analyzeQuoteIntake(validated, cleanMessages);
  const suggestedConversionPath = getSuggestedConversionPath(validated);
  const quoteNumber = nextRef("Q");
  const vehicleDescriptor = [
    validated.vehicleYear,
    validated.vehicleMake,
    validated.vehicleModel,
  ].filter(Boolean).join(" ");
  const normalizedEquipmentType =
    validated.equipmentType ||
    vehicleDescriptor ||
    validated.projectType ||
    validated.serviceCategory;
  const workspaceKey = validated.workspaceKey ||
    (validated.intakeMode === "CALIBRATION" || validated.serviceType === "CALIBRATION"
      ? "calibration-lab-demo"
      : validated.intakeMode === "AUTO"
        ? "auto-repair-demo"
      : "general-service-demo");
  const workspace = await db.businessWorkspace.findUnique({
    where: { workspaceKey },
    select: { id: true },
  });

  const customer = await db.customer.upsert({
    where: { email: validated.email },
    update: {
      workspaceId: workspace?.id,
      company: validated.company,
      mainContact: validated.contactName,
      phone: validated.phone,
      address: validated.locationAddress || undefined,
    },
    create: {
      customerRef: nextRef("CUS"),
      workspaceId: workspace?.id,
      company: validated.company,
      mainContact: validated.contactName,
      email: validated.email,
      phone: validated.phone,
      address: validated.locationAddress || undefined,
    },
  });

  const quote = await db.quoteRequest.create({
    data: {
      quoteNumber,
      workspaceId: workspace?.id,
      customerId: customer.id,
      serviceType: toServiceType(validated.serviceType),
      status: QuoteStatus.NEW,
      priority: toPriority(analysis.suggestedPriority),
      suggestedPriority: toPriority(analysis.suggestedPriority),
      suggestedTicketType: toTicketType(analysis.suggestedTicketType),
      requestedTurnaround: validated.targetCompletionDate
        ? `${validated.requestedTurnaround} - ${validated.targetCompletionDate}`
        : validated.requestedTurnaround,
      serviceMode: toServiceMode(validated.serviceMode),
      equipmentType: normalizedEquipmentType,
      manufacturer: validated.manufacturer,
      modelNumber: validated.modelNumber,
      serialNumber: validated.serialNumber,
      unitCount: validated.unitCount,
      rangeOrCapacity: validated.rangeOrCapacity,
      units: validated.units,
      documentationRequirements: validated.documentationRequirements,
      issueDescription: validated.issueDescription,
      aiSummary: analysis.summary,
      structuredSummary: {
        ...analysis.structuredData,
        suggestedPriority: analysis.suggestedPriority,
        suggestedConversionPath,
      },
      extractedFields: {
        ...analysis.extractedFields,
        ...validated,
        suggestedPriority: analysis.suggestedPriority,
        suggestedConversionPath,
      },
      transcript: cleanMessages,
    },
  });

  if (files.length > 0) {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "quote-attachments", quote.id);
    await mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      if (!file.size) continue;

      const ext = path.extname(file.name);
      const fileName = `${randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));

      await db.quoteAttachment.create({
        data: {
          quoteRequestId: quote.id,
          fileName: file.name,
          filePath: `/uploads/quote-attachments/${quote.id}/${fileName}`,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
    }
  }

  await db.activityLog.createMany({
    data: [
      {
        type: ActivityType.QUOTE_SUBMITTED,
        entityType: "QuoteRequest",
        entityId: quote.id,
        title: "Quote submitted",
        description: `${quoteNumber} was submitted by ${validated.contactName}.`,
        customerId: customer.id,
        quoteId: quote.id,
      },
      {
        type: ActivityType.AI_SUMMARY_GENERATED,
        entityType: "QuoteRequest",
        entityId: quote.id,
        title: "AI summary generated",
        description: `LLM/fallback summary prepared for ${quoteNumber}.`,
        customerId: customer.id,
        quoteId: quote.id,
        payload: analysis,
      },
    ],
  });

  await db.notificationEvent.createMany({
    data: [
      {
        workspaceId: workspace?.id,
        type: NotificationEventType.NEW_QUOTE_SUBMITTED,
        status: NotificationStatus.PENDING,
        recipient: env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New quote submitted: ${quoteNumber}`,
        provider: "placeholder",
        payload: {
          template: "business-owner-new-quote",
          quoteNumber,
          customerName: validated.contactName,
          company: validated.company,
          summary: analysis.summary,
        },
      },
      {
        workspaceId: workspace?.id,
        type: NotificationEventType.NEW_QUOTE_SUBMITTED,
        status: NotificationStatus.PENDING,
        recipient: validated.email,
        subject: `Quote request received: ${quoteNumber}`,
        provider: "placeholder",
        payload: {
          template: "customer-quote-confirmation",
          quoteNumber,
          contactName: validated.contactName,
          summary: analysis.summary,
        },
      },
    ],
  }).catch(() => undefined);

  await Promise.all([
    sendAdminNewQuoteEmail({
      quoteNumber,
      customerName: validated.contactName,
      company: validated.company,
      serviceType: validated.serviceType,
      summary: analysis.summary,
    }),
    sendCustomerQuoteConfirmationEmail({
      to: validated.email,
      quoteNumber,
      contactName: validated.contactName,
      summary: analysis.summary,
    }),
  ]);

  await db.activityLog.create({
    data: {
      type: ActivityType.EMAIL_SENT,
      entityType: "QuoteRequest",
      entityId: quote.id,
      title: "Notification email sent",
      description: `Admin and customer notifications were triggered for ${quoteNumber}.`,
      customerId: customer.id,
      quoteId: quote.id,
    },
  });

  return {
    quoteId: quote.id,
    quoteNumber,
    summary: analysis.summary,
    structured: analysis.structuredData,
    suggestedPriority: analysis.suggestedPriority,
    suggestedTicketType: analysis.suggestedTicketType,
  };
}
