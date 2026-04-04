# Step 3 Deviations

## Deferred remote URL template hydration to Step 6

The Step 3 store layer now parses `#template=<value>` during startup resolution,
and it fully resolves template ids that already exist locally or are registered in memory.
When the fragment contains an `http` or `https` URL,
the store preserves that URL as `pendingStartupTemplateUrl`,
but it does not fetch and import the remote template yet.

This keeps Step 3 focused on persistence,
hydration,
and store behavior,
while avoiding early implementation of the remote import flow that the plan assigns to Step 6.

### Downstream implications

Step 6 should consume `templateStore.pendingStartupTemplateUrl`
to perform remote template loading,
normalization,
and activation during app startup.
Until that step is implemented,
URL-template startup only fully resolves local template ids.
