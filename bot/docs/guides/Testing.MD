## Testing

- `console.log` will be suppressed by default. Set FORCE_TEST_LOGS=1 to revert the behavior.
- You `console.info` if you want to log something inside the tests.

### Setup (Integration)

- If you can run the bot locally, you can run the tests.
- import `testBot` from `from src/tests/integration/common/utils.ts`

---

### Running tests

- **Integration**: `bun run test:integration`
- **Unit**: `bun run test:unit`

Under the hood, we run `bun test` with globs via `scripts/run_tests.ts`.

---

### Directory layout

```
src/tests
  - common
      - utils.ts
      - types.ts
  - integration/
      - menu/
          - start.test.ts
          - settings/
              - main.test.ts     # button layout tests
              - chains.test.ts   # chains functionality
  - unit/
      - plugins/
      - middlewares/
```

Add your tests to the relevant folder. Shared helpers go in the `common/` directory.

---

### Writing tests

Key rules:

- Import lifecycle from `node:test`. Import `expect` from `bun:test`.
- Recommended import shape:

```ts
import { before as beforeAll, after as afterAll, beforeEach, afterEach, describe, it } from "node:test";
```

- Use `chat.send("/command")`, then click buttons via `message.click("Button Text")`.
- Default response wait timeout is 15s; override via `{ timeoutMs }`.

Notes:

- Use `node:test` for hooks (`before`, `after`, `beforeEach`, `afterEach`, `describe`). Don’t import them from `bun:test`.
