import esbuild from 'esbuild';
import { readFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');

// Read package.json to get dependencies
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const dependencies = Object.keys(pkg.dependencies || {});

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'index.js',
  format: 'esm',
  sourcemap: true,
  // Mark all dependencies as external to avoid bundling issues
  external: [...dependencies],
  banner: {
    js: '#!/usr/bin/env node'
  },
  packages: 'external'
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(config);
  console.log('Build complete!');
}
