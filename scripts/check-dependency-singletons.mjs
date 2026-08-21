/**
 * Fail the build if a package that holds module-global state resolves to more
 * than one version in pnpm-lock.yaml.
 *
 * Why this exists (issue #430):
 *
 * Radix primitives pin *exact* versions of their shared internals, so bumping
 * one primitive without its siblings installs two copies of a package that is
 * only correct as a singleton. That already shipped a user-facing bug: #426
 * bumped @radix-ui/react-popover 1.1.15 -> 1.1.23 while @radix-ui/react-dialog
 * stayed at 1.1.15, leaving @radix-ui/react-dismissable-layer resolved at both
 * 1.1.11 and 1.1.19. Each copy owns its own module-global
 * `originalBodyPointerEvents` and layer registry, so the Sheet set
 * `pointer-events: none` on <body> and re-enabled it only for layers in *its*
 * copy. The Popover registered in the other one and stayed unclickable with a
 * mouse (keyboard still worked, which is why it went unnoticed).
 *
 * This is NOT a blanket duplicate check. Most duplicated Radix internals are
 * harmless — react-slot, react-primitive, react-context and react-presence are
 * pure or create their context per primitive subtree, and several of them
 * legitimately resolve to three or four versions today. Only packages that own
 * state at module scope break when duplicated, so this guard is an explicit
 * allowlist. Add an entry only with a comment naming the module-global that
 * makes the package a singleton.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SINGLETONS = [
  // var originalBodyPointerEvents + a shared layer registry — the #430 bug.
  '@radix-ui/react-dismissable-layer',
  // var count = 0; var guards = null — refcounts the focus guard elements.
  '@radix-ui/react-focus-guards',
  // var focusScopesStack = createFocusScopesStack() — one stack for all scopes.
  '@radix-ui/react-focus-scope',
  // var lockCount = 0 plus WeakMaps tracking which nodes it hid.
  'aria-hidden',
  // Module-level `cache` WeakMap keyed by sidecar medium.
  'use-sidecar',
  // Scroll-lock refcounting shared across every locking component.
  'react-remove-scroll',
  'react-remove-scroll-bar',
];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockfilePath = path.join(repoRoot, 'pnpm-lock.yaml');
const lockfile = fs.readFileSync(lockfilePath, 'utf8');

/**
 * Collect every `name@version` key from the lockfile's `packages:` block. In
 * lockfileVersion 9 those keys are bare (`'@radix-ui/react-dialog@1.1.23':`),
 * one per distinct resolved version — `snapshots:` repeats them with peer
 * hashes appended, so parsing `packages:` alone gives exactly the set we want
 * without needing a YAML dependency.
 */
function readResolvedVersions(contents) {
  const versionsByName = new Map();
  let inPackages = false;

  for (const line of contents.split('\n')) {
    if (!inPackages) {
      if (line === 'packages:') inPackages = true;
      continue;
    }

    // A non-indented, non-empty line ends the block.
    if (line.trim() !== '' && !line.startsWith(' ')) break;

    const match = /^ {2}'?((?:@[^/]+\/)?[^'@\s][^'@]*)@([^']+)'?:$/.exec(line);
    if (!match) continue;

    const [, name, version] = match;
    const versions = versionsByName.get(name) ?? new Set();
    versions.add(version);
    versionsByName.set(name, versions);
  }

  return versionsByName;
}

const versionsByName = readResolvedVersions(lockfile);
const problems = [];

for (const name of SINGLETONS) {
  const versions = versionsByName.get(name);

  if (!versions) {
    // A dead entry silently stops guarding anything, which is worse than a
    // noisy failure — the package was renamed, dropped, or never spelled right.
    problems.push(
      `${name}\n    not found in pnpm-lock.yaml — remove it from SINGLETONS or fix the name`
    );
    continue;
  }

  if (versions.size > 1) {
    const list = [...versions]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .join(', ');
    problems.push(
      `${name}\n    resolves to ${versions.size} versions: ${list}\n    run \`pnpm why -r ${name}\` to find the dependents that disagree`
    );
  }
}

if (problems.length > 0) {
  console.error('Dependency singleton check failed:\n');
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    'These packages keep state at module scope, so two copies in one bundle\n' +
      'means two unrelated registries. Align the versions of the dependents\n' +
      'that pull them in (see the header of scripts/check-dependency-singletons.mjs).'
  );
  process.exitCode = 1;
} else {
  console.log(
    `Dependency singleton check passed — all ${SINGLETONS.length} packages resolve to one version.`
  );
}
