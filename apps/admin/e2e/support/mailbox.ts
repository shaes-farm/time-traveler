/*
 * Supabase local routes auth emails to Mailpit (HTTP API on :54324). This
 * helper reads captured mail so a spec can complete an email round-trip
 * (e.g. password reset). Local-only — never used against a real inbox.
 *
 * MAILPIT_URL configures the e2e run directly (outside the turbo task graph),
 * so the turbo env-var declaration rule doesn't apply here.
 */
/* eslint-disable turbo/no-undeclared-env-vars */
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailpitSummary {
  ID: string;
  To: Array<{ Address: string }>;
}

/**
 * Poll Mailpit for the newest message addressed to `toAddress` and return the
 * first link in its body matching `linkPattern`. Throws if none arrives within
 * `timeoutMs`.
 */
export async function waitForEmailLink(
  toAddress: string,
  linkPattern: RegExp,
  { timeoutMs = 15_000 }: { timeoutMs?: number } = {},
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const target = toAddress.toLowerCase();

  while (Date.now() < deadline) {
    const list = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=50`);
    if (list.ok) {
      const { messages } = (await list.json()) as {
        messages: MailpitSummary[];
      };
      const match = messages.find((m) =>
        m.To.some((t) => t.Address.toLowerCase() === target),
      );
      if (match) {
        const full = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
        if (full.ok) {
          const body = (await full.json()) as { HTML?: string; Text?: string };
          const link = extractLink(
            `${body.HTML ?? ""}\n${body.Text ?? ""}`,
            linkPattern,
          );
          if (link) return link;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `No email to ${toAddress} matching ${linkPattern} within ${timeoutMs}ms`,
  );
}

function extractLink(body: string, pattern: RegExp): string | null {
  const hrefs = [...body.matchAll(/href="([^"]+)"/g)].map((m) =>
    decodeEntities(m[1] ?? ""),
  );
  const bare = [...body.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((m) => m[0]);
  return [...hrefs, ...bare].find((url) => pattern.test(url)) ?? null;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&#38;/g, "&");
}
