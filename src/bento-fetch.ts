export function getApiBaseUrl(): string {
  const rawBaseUrl =
    process.env.BENTO_API_BASE_URL || "https://app.bentonow.com/api/v1";

  try {
    const parsed = new URL(rawBaseUrl);
    const isLocalHost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const isBentoHost =
      parsed.hostname.endsWith(".bentonow.com") || parsed.hostname === "bentonow.com";
    const hasAllowedProtocol =
      parsed.protocol === "https:" || (isLocalHost && parsed.protocol === "http:");

    if (!hasAllowedProtocol || (!isLocalHost && !isBentoHost)) {
      throw new Error("Invalid BENTO_API_BASE_URL host");
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      "Invalid BENTO_API_BASE_URL. Use https://*.bentonow.com (or http://localhost for local development).",
    );
  }
}

export async function fetchBentoJson(
  path: string,
  query: Record<string, string> = {},
): Promise<unknown> {
  const publishableKey = process.env.BENTO_PUBLISHABLE_KEY;
  const secretKey = process.env.BENTO_SECRET_KEY;
  const siteUuid = process.env.BENTO_SITE_UUID;

  if (!publishableKey || !secretKey || !siteUuid) {
    throw new Error(
      "Missing required environment variables: BENTO_PUBLISHABLE_KEY, BENTO_SECRET_KEY, BENTO_SITE_UUID",
    );
  }

  const params = new URLSearchParams({ site_uuid: siteUuid, ...query });
  const authHeader = Buffer.from(`${publishableKey}:${secretKey}`).toString(
    "base64",
  );
  const response = await fetch(`${getApiBaseUrl()}${path}?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[${response.status}] - ${text || response.statusText}`);
  }

  return response.json();
}
