const MAILHOG_BASE_URL = 'http://localhost:8025/api/v2';

export async function clearMailhog(): Promise<void> {
  await fetch(`${MAILHOG_BASE_URL}/messages`, { method: 'DELETE' }).catch(() => undefined);
}

export async function waitForEmails(count: number, timeoutMs: number): Promise<unknown[]> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetch(`${MAILHOG_BASE_URL}/messages`);
    if (response.ok) {
      const payload = (await response.json()) as { items?: unknown[] };
      const items = payload.items ?? [];
      if (items.length >= count) {
        return items;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${count} MailHog messages`);
}
