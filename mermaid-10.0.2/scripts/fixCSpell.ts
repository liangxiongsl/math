/**
 * Sorts all the `words` in the cSpell.json file.
 *
 * Run from the same folder as the `cSpell.json` file
 * (i.e. the root of the Mermaid project).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import prettier from 'prettier';

const filepath = './cSpell.json';
const cSpell: { words: string[] } = JSON.parse(readFileSync(filepath, 'utf8'));

cSpell.words = [...new Set(cSpell.words.map((word) => word.toLowerCase()))];
cSpell.words.sort((a, b) => a.localeCompare(b));

const prettierConfig = prettier.resolveConfig.sync(filepath) ?? {};
writeFileSync(
  filepath,
  prettier.format(JSON.stringify(cSpell), {
    ...prettierConfig,
    filepath,
  })
);
