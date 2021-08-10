import type { Options } from 'tsup'
export const tsup: Options = {
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  bundle: true,
  target: 'node16',
  entryPoints: ['src/index.ts'],
}