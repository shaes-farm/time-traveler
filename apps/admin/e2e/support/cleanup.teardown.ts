import { test as teardown } from "@playwright/test";
import { sweepE2eAuthUsers, sweepE2eContent } from "./cleanup";
import { seedTestUser } from "./test-user";

/**
 * The `cleanup` teardown project: after the suite finishes, remove every row
 * and every account the run touched — including the seeded editor — so the
 * local database keeps no e2e residue at all.
 *
 * This is the tidy-exit half of the #355 cleanup contract. It does not run
 * when the process is killed (`Ctrl-C`) or `--no-deps` is passed — the entry
 * sweep in `auth.setup.ts` covers those, reclaiming the rows on the next run.
 *
 * No age floor here: the specs are done, so nothing is in flight to race.
 *
 * `seedTestUser` resolves the owner id for the content sweep, re-creating the
 * account if a previous teardown already removed it — a cheap no-op call that
 * keeps this the same one-liner as everywhere else. Deleting the account last
 * cascades anything the slug-scoped sweep missed.
 */
teardown("sweep e2e data", async () => {
  const userId = await seedTestUser();
  await sweepE2eContent(userId);
  await sweepE2eAuthUsers({ includeTestUser: true });
});
