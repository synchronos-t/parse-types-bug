# Parse `containedIn` TypeScript bug repro

Minimal single-repo repro for a Parse TypeScript typing issue, with a tiny runtime demo.

## What this reproduces

### Type bug
Parse currently types `Query.containedIn()` incorrectly for array-valued fields.

This code is included in `repro/parse-containedin-type-bug.ts`:

```ts
import Parse from 'parse';

type ItemAttributes = {
  title: string;
  areaIds: string[];
};

type ItemBase = Parse.Object<ItemAttributes>;

const Item = Parse.Object.extend('Item');
const query = new Parse.Query(Item) as Parse.Query<ItemBase>;

query.containedIn('title', ['one', 'two']);

// @ts-expect-error Parse currently types this incorrectly for array-valued fields.
query.containedIn('areaIds', ['A1', 'A2']);
```

- `title` (scalar field) type-checks.
- `areaIds` (`string[]`) needs `@ts-expect-error` today.
- If Parse fixes typings later, this `@ts-expect-error` becomes unused and typecheck will fail, which is desired.

### Runtime behavior demo
The frontend runs:

```ts
query.containedIn('areaIds', ['A1', 'A2']);
```

against seeded rows:

- `{ title: 'matches-a1', areaIds: ['A1', 'B3'] }`
- `{ title: 'matches-a2', areaIds: ['A2'] }`
- `{ title: 'no-match', areaIds: ['B3', 'C4'] }`

Expected runtime result:
- ✅ `matches-a1`
- ✅ `matches-a2`
- ❌ `no-match`

## Stack

- Next.js + TypeScript frontend (`http://localhost:3000`)
- Programmatic Parse Server (`http://localhost:1337/parse`)
- `mongodb-memory-server` for fully local, in-memory MongoDB
- `concurrently` to run both processes from one command

## Parse dev config

Parse server starts with:

- `appId: dev`
- `masterKey: dev-master-key`
- `javascriptKey: dev-js-key`
- `serverURL: http://localhost:1337/parse`
- `allowClientClassCreation: true`

CORS is enabled for `http://localhost:3000`.

## Run locally / CodeSandbox Devbox

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` and use:

1. **Seed sample data**
2. **Run overlap query**
3. **Clear sample data**

Type-check the repro file:

```bash
npm run typecheck
```

Optional production build check:

```bash
npm run build
```

## Local patch workflow

This repo also includes a local `patch-package` patch for the Parse typings at `patches/parse+8.6.1-alpha.1.patch`.

The workflow is intentionally manual:

- `npm install` does not apply the patch automatically.
- The installed `parse` package stays in its upstream broken state first, so the repro still errors during type-checking.
- You can apply the local fix manually when you want to verify the patched behavior.

Apply the patch manually:

```bash
npx patch-package
```

Unapply the patch manually:

```bash
npx patch-package --reverse
```

How it works:

1. The patch file records the diff against `node_modules/parse/types/ParseQuery.d.ts`.
2. Running `npx patch-package` reapplies that diff into `node_modules`.
3. Running `npx patch-package --reverse` removes it again.

The patch updates Parse query typings so these methods use an array field's element type instead of the whole array type:

- `containedIn`
- `notContainedIn`
- `containedBy`
- `containsAll`

That is what fixes the `string[][]` inference problem for fields like `areaIds: string[]` while preserving pointer support.

## Project locations

- Type bug reproduction: `repro/parse-containedin-type-bug.ts`
- Parse server bootstrap: `server/parse-dev.ts`
- Runtime overlap demo UI: `src/app/page.tsx`
