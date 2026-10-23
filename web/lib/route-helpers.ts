import { NextResponse } from "next/server";
import {
  callBackend,
  normaliseBackendError,
  type BackendRequestOptions,
} from "./backend";

function unreachable(error: unknown): NextResponse {
  const isTimeout =
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError");
  return NextResponse.json(
    {
      error: isTimeout
        ? "The processing service did not respond in time."
        : "The processing service is unreachable. Start the API server and retry.",
      code: "service_unavailable",
    },
    { status: 503 },
  );
}

/** Proxies a JSON endpoint on the FastAPI backend. */
export async function proxyJson(
  path: string,
  options: BackendRequestOptions = {},
): Promise<NextResponse> {
  try {
    const { response, body } = await callBackend(path, options);

    if (!response.ok) {
      const normalised = normaliseBackendError(response.status, body);
      return NextResponse.json(
        { error: normalised.error, code: normalised.code },
        { status: normalised.status },
      );
    }

    if (response.status === 204 || body === null) {
      return new NextResponse(null, { status: response.status });
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    return unreachable(error);
  }
}

const PASS_THROUGH_HEADERS = [
  "content-type",
  "content-disposition",
  "cache-control",
];

/** Proxies a file download, preserving headers and streaming the body. */
export async function proxyDownload(
  path: string,
  options: BackendRequestOptions = {},
): Promise<NextResponse> {
  try {
    const { response, body } = await callBackend(path, options);

    if (!response.ok) {
      const normalised = normaliseBackendError(response.status, body);
      return NextResponse.json(
        { error: normalised.error, code: normalised.code },
        { status: normalised.status },
      );
    }

    const headers = new Headers();
    for (const name of PASS_THROUGH_HEADERS) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return unreachable(error);
  }
}

export function badRequest(error: string, code = "invalid_request") {
  return NextResponse.json({ error, code }, { status: 400 });
}

export function unauthorised(error = "Sign in to continue.", code = "unauthenticated") {
  return NextResponse.json({ error, code }, { status: 401 });
}
