import { test as teardown } from "@playwright/test";
import { sweepE2eAuthUsers, sweepE2eContent } from "./cleanup";
import { seedTestUser } from "./test-user";

/**
 * The `cleanup` teardown project: after the suite finishes, remove every row
 * and throwaway account the run created, so the local database is left as the
 * run found it.
 *
 * This is the tidy-exit half of the #355 cleanup contract. It does not run
 * when the process is killed (`Ctrl-C`) or `--no-deps` is passed — the entry
 * sweep in `auth.setup.ts` covers those, reclaiming the rows on the next run.
 *
 * No age floor here: the specs are done, so nothing is in flight to race.
 */
teardown("sweep e2e data", async () => {
  const userId = await seedTestUser();
  await sweepE2eContent(userId);
  await sweepE2eAuthUsers();
});
