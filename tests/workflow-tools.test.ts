import { afterEach, describe, expect, test } from "bun:test";
import { fetchBentoJson } from "../src/bento-fetch";
import { workflowStatsQuery } from "../src/workflow-stats-query";

const previousFetch = globalThis.fetch;
const previousEnv = {
  BENTO_PUBLISHABLE_KEY: process.env.BENTO_PUBLISHABLE_KEY,
  BENTO_SECRET_KEY: process.env.BENTO_SECRET_KEY,
  BENTO_SITE_UUID: process.env.BENTO_SITE_UUID,
  BENTO_API_BASE_URL: process.env.BENTO_API_BASE_URL,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function setBentoEnv() {
  process.env.BENTO_PUBLISHABLE_KEY = "pk_test";
  process.env.BENTO_SECRET_KEY = "sk_test";
  process.env.BENTO_SITE_UUID = "site_123";
  process.env.BENTO_API_BASE_URL = "https://app.bentonow.com/api/v1";
}

afterEach(() => {
  globalThis.fetch = previousFetch;
  restoreEnv();
});

describe("get_workflow_stats window", () => {
  test("rejects a lone start_date with the validation error", () => {
    expect(workflowStatsQuery({ start_date: "2026-01-01" })).toEqual({
      ok: false,
      error: "Provide both start_date and end_date, or neither",
    });
  });
});

describe("fetchBentoJson workflow stats", () => {
  test("includes site_uuid, days=7, and the encoded workflow id", async () => {
    setBentoEnv();
    const requested: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requested.push(String(input));
      return new Response(JSON.stringify({ workflow_id: "flow_a/b" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const data = await fetchBentoJson(
      `/fetch/workflows/${encodeURIComponent("flow_a/b")}/stats`,
      { days: "7" },
    );

    expect(requested).toEqual([
      "https://app.bentonow.com/api/v1/fetch/workflows/flow_a%2Fb/stats?site_uuid=site_123&days=7",
    ]);
    expect(data).toEqual({ workflow_id: "flow_a/b" });
  });

  test("surfaces a 422 body as [422] - Invalid date range", async () => {
    setBentoEnv();
    globalThis.fetch = (async () => {
      return new Response("Invalid date range", {
        status: 422,
        statusText: "Unprocessable Entity",
      });
    }) as typeof fetch;

    await expect(
      fetchBentoJson("/fetch/workflows/flow_abc123/stats"),
    ).rejects.toThrow("[422] - Invalid date range");
  });
});
