import fs from 'node:fs';
import path from 'node:path';
import glob from 'fast-glob';

const files = await glob([
  'apps/*/coverage/lcov.info',
  'packages/*/coverage/lcov.info',
]);

for (const file of files) {
  const packageRoot = path.dirname(path.dirname(file));

  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /^SF:(.*)$/gm,
    (_, sourcePath) => {
      if (
        sourcePath.startsWith('apps/') ||
        sourcePath.startsWith('packages/')
      ) {
        return `SF:${sourcePath}`;
      }

      return `SF:${packageRoot}/${sourcePath}`;
    }
  );

  fs.writeFileSync(file, content);
}