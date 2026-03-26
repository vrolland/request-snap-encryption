/**
 * POST /v2/secure-payments — same body as request-light.js `getDataForAPI()` per request.
 * Uses Client ID in the browser (set GATSBY_REQUEST_API_CLIENT_ID at build time).
 */

export type CreateSecurePaymentLightPayload = {
  requests: Array<{
    requestId: string;
    paymentData: Record<string, unknown>;
    encryptedData: unknown;
  }>;
};

export type CreateSecurePaymentLightResponse = {
  requestIds: string[];
  securePaymentUrl: string;
  token: string;
};

function getApiBase(): string {
  return (
    process.env.GATSBY_REQUEST_API_BASE_URL?.replace(/\/$/, '') ||
    'http://localhost:8082/v2'
  );
}

/**
 * Registers a secure payment on the Request API (v2 light flow).
 */
export async function createSecurePaymentLight(
  body: CreateSecurePaymentLightPayload,
): Promise<CreateSecurePaymentLightResponse> {
  const clientId = "cli_37igfhd5rolps3ajmdckaz32fl2s6yg3"; // process.env.VITE_API_CLIENT_ID;
  const apiKey = process.env.GATSBY_REQUEST_API_KEY;

  if (!clientId && !apiKey) {
    throw new Error(
      'Configure GATSBY_REQUEST_API_CLIENT_ID or GATSBY_REQUEST_API_KEY for the Request API.',
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  } else if (clientId) {
    headers['x-client-id'] = clientId;
  }

  const url = `${getApiBase()}/secure-payments`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const raw = await res.text();
    let detail = raw;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j?.message === 'string' && j.message.length > 0) {
        detail = j.message;
      }
    } catch {
      /* corps non-JSON : garder raw */
    }
    throw new Error(detail || `Request API error (${res.status})`);
  }

  return res.json() as Promise<CreateSecurePaymentLightResponse>;
}
