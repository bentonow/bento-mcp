export type WorkflowStatsQuery =
  | { ok: true; query: Record<string, string>; label: string }
  | { ok: false; error: string };

export function workflowStatsQuery(input: {
  days?: number;
  start_date?: string;
  end_date?: string;
}): WorkflowStatsQuery {
  const startDate = input.start_date;
  const endDate = input.end_date;
  const hasStart = startDate !== undefined;
  const hasEnd = endDate !== undefined;

  if (hasStart !== hasEnd) {
    return {
      ok: false,
      error: "Provide both start_date and end_date, or neither",
    };
  }

  if (startDate !== undefined && endDate !== undefined) {
    return {
      ok: true,
      query: { start_date: startDate, end_date: endDate },
      label: `${startDate} to ${endDate}`,
    };
  }

  if (input.days !== undefined) {
    return {
      ok: true,
      query: { days: String(input.days) },
      label: `last ${input.days} days`,
    };
  }

  return { ok: true, query: {}, label: "last 30 days" };
}
