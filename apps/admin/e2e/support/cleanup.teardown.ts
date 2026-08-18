import { test as teardown } from "@playwright/test";
import {
  sweepE2eAuthUsers,
  sweepE2eContent,
  sweepE2eVocabulary,
} from "./cleanup";
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
 * keeps this the same one-liner as everywhere else.
 *
 * Accounts before vocabulary, not after. The in-use fixture
 * (`relationship-vocabulary-crud.spec.ts`) creates its `character_relationships`
 * row under the *admin* account, which the editor-scoped content sweep above
 * never reaches. `character_relationships.user_id` is `ON DELETE CASCADE` off
 * `auth.users` (`00002_relationships_junctions.sql`), so deleting both seeded
 * accounts — which this sweep does — takes any such row with it. Vocabulary
 * FKs are `ON DELETE RESTRICT`, so sweeping it first, while a stranded relationship
 * from a killed run still points at an `e2e_` type, would fail with `23503` and
 * leave teardown unable to clean the very state it exists to recover.
 */
teardown("sweep e2e data", async () => {
  const userId = await seedTestUser();
  await sweepE2eContent(userId);
  await sweepE2eAuthUsers({ includeTestUser: true });
  // Vocabulary is global reference data with no owner, so it is swept by key
  // prefix rather than by user.
  await sweepE2eVocabulary();
});
