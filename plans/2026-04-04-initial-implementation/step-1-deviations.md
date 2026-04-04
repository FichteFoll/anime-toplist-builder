# Step 1 Deviations

## Added `skipLibCheck` to keep `vue-tsc` green

The plan calls for a runnable scaffold with `radix-vue` included.
With the current dependency resolution,
`vue-tsc` fails inside third-party declaration files from `radix-vue`
and its transitive dependencies,
including `@vueuse/core` and virtualization-related types.

To keep Step 1 deliverable and verifiable,
`tsconfig.json` enables `skipLibCheck`.
Application source files are still typechecked normally.

### Downstream implications

Later steps should leave `skipLibCheck` in place
unless the `radix-vue` dependency set is intentionally realigned
to a combination that passes `vue-tsc` without library-check suppression.
If that alignment work is done later,
remove this workaround and re-run `pnpm typecheck`.
