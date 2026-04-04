# Step 1 Deviations

## Historical note on `skipLibCheck`

Step 1 originally enabled `skipLibCheck`
to work around third-party `radix-vue` declaration issues.

That workaround was later removed
as part of the migration to `reka-ui`,
which restored clean `vue-tsc` runs without library-check suppression.
