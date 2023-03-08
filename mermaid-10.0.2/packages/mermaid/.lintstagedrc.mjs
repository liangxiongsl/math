import baseConfig from '../../.lintstagedrc.mjs';
export default {
  ...baseConfig,
  'src/docs/**': ['pnpm --filter mermaid run docs:build --git'],
  'src/docs.mts': ['pnpm --filter mermaid run docs:build --git'],
  'src/(defaultConfig|config|mermaidAPI).ts': ['pnpm --filter mermaid run docs:build --git'],
};
