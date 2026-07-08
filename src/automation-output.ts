import { getSequenceId } from "./sequence-resolution.js";

type AutomationEntry = {
  id?: unknown;
  prefix_id?: unknown;
  name?: unknown;
  attributes?: Record<string, unknown>;
  email_templates?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function scalarValue(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return undefined;
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null);
}

function compactObject(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key] = value;
    }
  }

  return output;
}

function normalizeEmailTemplate(template: unknown, position: number) {
  const object = asRecord(template) ?? {};
  const attributes = asRecord(object.attributes) ?? {};

  return compactObject({
    position,
    templateId: scalarValue(firstDefined(attributes.id, object.id)),
    subject: scalarValue(firstDefined(object.subject, attributes.subject)),
    name: scalarValue(firstDefined(object.name, attributes.name)),
    inboxSnippet: scalarValue(
      firstDefined(
        object.inbox_snippet,
        object.inboxSnippet,
        attributes.inbox_snippet,
        attributes.inboxSnippet,
      ),
    ),
    delayInterval: scalarValue(
      firstDefined(
        object.delay_interval,
        object.delayInterval,
        attributes.delay_interval,
        attributes.delayInterval,
      ),
    ),
    delayIntervalCount: scalarValue(
      firstDefined(
        object.delay_interval_count,
        object.delayIntervalCount,
        attributes.delay_interval_count,
        attributes.delayIntervalCount,
      ),
    ),
  });
}

function normalizeAutomationEntry(
  entry: unknown,
  sourceType: "sequence" | "workflow",
) {
  const object = asRecord(entry) as AutomationEntry | null;
  if (!object) {
    return null;
  }

  const attributes = asRecord(object.attributes) ?? {};
  const displayId = firstDefined(object.id, attributes.id);
  const sequenceId = getSequenceId({
    id: scalarValue(displayId) as string | undefined,
    prefix_id: scalarValue(firstDefined(object.prefix_id, attributes.prefix_id)) as
      | string
      | undefined,
    attributes: {
      id: scalarValue(attributes.id) as string | undefined,
      prefix_id: scalarValue(attributes.prefix_id) as string | undefined,
      name: scalarValue(attributes.name) as string | undefined,
    },
  });
  const emailTemplates = (
    Array.isArray(object.email_templates)
      ? object.email_templates
      : Array.isArray(attributes.email_templates)
        ? attributes.email_templates
        : []
  ).map((template, index) => normalizeEmailTemplate(template, index + 1));

  return compactObject({
    type: sourceType,
    id: scalarValue(displayId),
    sequenceId,
    prefixId: scalarValue(firstDefined(object.prefix_id, attributes.prefix_id)),
    name: scalarValue(firstDefined(object.name, attributes.name)),
    emailTemplateCount: emailTemplates.length,
    emailTemplates,
  });
}

export function normalizeAutomationList(
  entries: unknown,
  sourceType: "sequence" | "workflow",
) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => normalizeAutomationEntry(entry, sourceType))
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}
