---
source: Vitest official docs
library: Vitest
package: vitest
topic: browser mode migration minimal setup
fetched: 2026-04-23T00:00:00Z
official_docs: https://vitest.dev/guide/browser/
---

# Vitest Browser Mode migration: minimal setup

Relevant official docs used:
- https://vitest.dev/guide/browser/
- https://vitest.dev/guide/browser/multiple-setups
- https://vitest.dev/config/browser/playwright
- https://vitest.dev/config/browser/instances
- https://vitest.dev/config/setupfiles
- https://vitest.dev/config/browser/commands
- https://vitest.dev/api/browser/context
- https://vitest.dev/api/browser/interactivity
- https://vitest.dev/api/browser/commands
- https://vitest.dev/guide/projects

## Minimal install for standard Playwright provider

Vitest recommends Playwright for Browser Mode if you want CI and parallel execution.

```bash
npm install -D vitest @vitest/browser-playwright
```

Docs note:
- Browser Mode always requires a provider.
- For CI, install either Playwright or WebdriverIO.
- With Playwright provider, configure `provider: playwright()`.

## Smallest working browser-mode config

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
```

Playwright-specific notes from docs:
- `instances` needs at least one browser.
- `playwright()` can take `launchOptions`, `connectOptions`, `contextOptions`, and `actionTimeout`.
- Vitest ignores Playwright `launch.headless`; use `test.browser.headless` instead.
- Vitest opens a single page per test file, not per individual test.

## Separate browser config/project alongside existing Node tests

### Option A: separate projects in one config

Documented pattern for Node + browser in one Vitest run:

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'tests/unit/**/*.{test,spec}.ts',
            'tests/**/*.unit.{test,spec}.ts',
          ],
        },
      },
      {
        test: {
          name: 'browser',
          include: [
            'tests/browser/**/*.{test,spec}.ts',
            'tests/**/*.browser.{test,spec}.ts',
          ],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
```

Useful docs notes:
- Use `--project browser` or `--project unit` to run only one side.
- Inline project configs can `extends: true` if you want to inherit root config/plugins.
- Project names must be unique.

### Option B: browser instances for multiple browser-only setups

If you only need multiple browser setups, docs recommend `browser.instances` over separate test projects for better caching because they share one Vite server.

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [
        { browser: 'chromium', name: 'chromium' },
        { browser: 'firefox', name: 'firefox' },
      ],
    },
  },
})
```

## Browser setup files

General `setupFiles` docs:
- Paths are relative to `root`.
- They run before each test file in the same process.
- Vitest ignores exports from setup files.

Browser docs show you can attach setup files either at project level or per browser instance:

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: 'chromium',
          name: 'chromium-setup',
          setupFiles: ['./tests/browser/setup.ts'],
        },
      ],
    },
  },
})
```

Docs also note that browser instances inherit root test options, so root setup files can be combined with instance-specific setup files.

## Browser test APIs and imports

### Core imports

```ts
import { expect, test } from 'vitest'
import { page, userEvent, commands, server, cdp, utils } from 'vitest/browser'
```

Most common documented browser imports:
- `page` — locator and browser-page utilities
- `userEvent` — real browser interactions backed by provider APIs
- `commands` / `server.commands` — server-side commands callable from browser tests
- `cdp` — Chromium + Playwright only
- `utils` — pretty DOM/debug helpers

### Common `page` usage

```ts
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'

test('renders', async () => {
  await expect.element(page.getByText('Hello World')).toBeInTheDocument()
})
```

Documented `page` capabilities include:
- `getByRole`, `getByText`, `getByLabelText`, `getByTestId`, etc.
- `viewport()`
- `screenshot()`
- `mark()`
- `elementLocator()`
- `frameLocator()` (Playwright provider only)

### Common `userEvent` usage

```ts
import { page, userEvent } from 'vitest/browser'

await userEvent.fill(page.getByLabelText(/username/i), 'Alice')
await userEvent.click(page.getByRole('button', { name: 'Save' }))
```

Docs recommend `userEvent` from `vitest/browser` over `@testing-library/user-event` because Vitest uses real provider-backed interaction instead of simulated events.

Documented methods include:
- `click`, `dblClick`, `tripleClick`
- `fill`, `type`, `keyboard`, `clear`
- `tab`, `hover`, `unhover`
- `selectOptions`, `upload`, `dragAndDrop`
- `copy`, `cut`, `paste`, `wheel`

### Commands import

Docs say custom commands configured via `test.browser.commands` can be imported from `vitest/browser`, and built-ins include file commands.

```ts
import { commands, server } from 'vitest/browser'

const text = await server.commands.readFile('./fixture.txt')
// or custom commands via commands.myCommand(...)
```

## Running browser tests alongside existing Node Vitest tests

Documented notes:
- Browser and Node tests can coexist using `test.projects` with separate `include` patterns.
- `--project` can target one or more projects.
- Since Vitest 3.2, `--browser` without a `browser` config fails; Vitest will not assume a Node config is meant for browser mode.
- Browser Mode uses port `63315` by default to avoid conflict with your dev server.
- If you only need multiple browser variants, prefer `browser.instances` for caching.

Practical migration shape consistent with the docs:
1. Keep existing Node tests in their current include pattern/project.
2. Add a browser project or browser-only config with its own include glob.
3. Move only browser-relevant entry tests first.
4. Reuse shared helpers/renderers from normal modules where possible.

## Reusing existing exported test modules instead of rewriting every test

Vitest docs do not provide a dedicated “shared exported test module” migration recipe, but the documented project model and Browser Mode behavior support this pattern:

- Put reusable assertions/test factories/shared helpers in normal modules.
- Import those shared modules from Node-specific test entry files and browser-specific test entry files.
- Keep the environment-specific entry file thin: it should only provide browser-specific setup/rendering/imports.

Why this matches the docs:
- Browser and Node tests are intended to be split by `include` patterns/projects.
- Browser Mode runs standard ESM modules in the browser, so shared modules can be imported directly.
- `setupFiles` run before each test file, which is a good place for browser-only setup instead of duplicating it in every migrated test.

Important Browser Mode limitation for reused modules:
- Browser Mode uses native ESM, so imported module namespaces are sealed.
- `vi.spyOn(importedModule, 'method')` on imported module objects will fail in browser mode.
- Docs recommend `vi.mock('./module.js', { spy: true })` if you need to spy on exports.
- Exported variables cannot be directly mocked; docs recommend exporting a function that changes the internal value.

That means shared test modules are easiest to reuse when they:
- receive collaborators via parameters, or
- rely on callable exports rather than mutable exported variables, or
- avoid Node-only mocking assumptions.

## Example migration layout

```txt
tests/
  shared/
    button.behavior.ts      # shared test factory/helpers
  unit/
    button.unit.test.ts     # imports shared behavior for Node/jsdom/happy-dom if desired
  browser/
    setup.ts
    button.browser.test.ts  # imports same shared behavior, mounts real browser DOM
```

## Short migration checklist

- Install `vitest` and `@vitest/browser-playwright`
- Add `browser.enabled: true`
- Add `provider: playwright()`
- Add at least one browser instance: `{ browser: 'chromium' }`
- Split Node vs browser files with `projects` or separate config
- Put browser-only setup in `setupFiles`
- Use `page`/`userEvent`/`commands` from `vitest/browser`
- Reuse shared test modules, but adjust mocking patterns for native ESM browser restrictions
