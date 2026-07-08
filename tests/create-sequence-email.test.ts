import { describe, expect, test } from "bun:test";
import {
  getSequenceId,
  isSequenceId,
  resolveSequenceId,
} from "../src/sequence-resolution";
import { normalizeAutomationList } from "../src/automation-output";

describe("resolveSequenceId", () => {
  test("returns provided sequenceId directly without listing", async () => {
    const requestedLists: number[] = [];
    const getSequences = async () => {
      requestedLists.push(1);
      return [];
    };

    const resolved = await resolveSequenceId({
      sequenceId: "  123  ",
      getSequences,
    });

    expect(resolved).toBe("123");
    expect(requestedLists).toEqual([]);
  });

  test("accepts any non-empty explicit sequenceId value", async () => {
    const resolved = await resolveSequenceId({
      sequenceId: "seq_123456789",
      getSequences: async () => [],
    });

    expect(resolved).toBe("seq_123456789");
  });

  test("uses the id returned by list sequences during name lookup", async () => {
    const requestedLists: number[] = [];
    const resolved = await resolveSequenceId({
      sequenceName: "welcome campaign",
      getSequences: async () => {
        requestedLists.push(1);
        return [
          {
            id: "123",
            attributes: {
              name: "Welcome Campaign",
            },
          },
        ];
      },
    });

    expect(resolved).toBe("123");
    expect(requestedLists).toEqual([1]);
  });

  test("falls back to attributes.id when top-level id is missing", async () => {
    const resolved = await resolveSequenceId({
      sequenceName: "broken sequence",
      getSequences: async () => [
        {
          id: "",
          attributes: { id: "456", name: "Broken Sequence" },
        },
      ],
    });

    expect(resolved).toBe("456");
  });

  test("returns null when no sequence matches", async () => {
    const resolved = await resolveSequenceId({
      sequenceName: "does not exist",
      getSequences: async () => [
        {
          id: "123",
          attributes: { name: "Other Sequence" },
        },
      ],
    });

    expect(resolved).toBeNull();
  });

  test("uses exact normalized name equality (no partial matches)", async () => {
    const resolved = await resolveSequenceId({
      sequenceName: "welcome flow",
      getSequences: async () => [
        {
          id: "sequence_near_match",
          attributes: { name: "welcome flow extra" },
        },
        {
          id: "sequence_exact_match",
          attributes: { name: "Welcome Flow" },
        },
      ],
    });

    expect(resolved).toBe("sequence_exact_match");
  });
});

describe("normalizeAutomationList", () => {
  test("surfaces sequenceId and templateId values for agents", () => {
    const normalized = normalizeAutomationList(
      [
        {
          id: "123",
          attributes: {
            name: "Welcome Sequence",
            email_templates: [
              {
                id: 1234,
                subject: "Welcome!",
              },
            ],
          },
        },
      ],
      "sequence",
    );

    expect(normalized).toEqual([
      {
        type: "sequence",
        id: "123",
        sequenceId: "123",
        name: "Welcome Sequence",
        emailTemplateCount: 1,
        emailTemplates: [
          {
            position: 1,
            templateId: 1234,
            subject: "Welcome!",
          },
        ],
      },
    ]);
  });
});

describe("isSequenceId", () => {
  test("accepts non-empty IDs", () => {
    expect(isSequenceId("123")).toBe(true);
  });

  test("rejects blank IDs", () => {
    expect(isSequenceId("   ")).toBe(false);
  });
});

describe("getSequenceId", () => {
  test("prefers the list response id", () => {
    expect(
      getSequenceId({
        id: "123",
        attributes: {
          prefix_id: "sequence_routeable",
        },
      }),
    ).toBe("123");
  });
});
