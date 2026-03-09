# Testing Guide

## Setup

Shield uses **Jest 30** with **React Testing Library** for testing. The configuration is in `jest.config.js`:

- **Preset:** `ts-jest` (TypeScript support)
- **Environment:** `jsdom` (browser-like DOM)
- **Path aliases:** `~/` maps to `app/` (matches tsconfig)
- **Setup:** `jest-setup.ts` imports `@testing-library/jest-dom` matchers
- **Coverage:** Collected from `app/**/*.{ts,tsx}`

## Running Tests

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode (re-runs on file changes)
npm test -- --coverage      # Generate coverage report
npm test -- path/to/file    # Run a specific test file
```

## File Conventions

Co-locate test files with their source:

```
app/
├── hooks/
│   ├── use-custom-input.tsx
│   └── use-custom-input.test.tsx
├── lib/
│   ├── onboarding-personas.ts
│   └── onboarding-personas.test.ts
```

## Patterns

### Unit Testing Business Logic

For pure functions and utilities, test inputs/outputs directly:

```ts
// app/lib/my-utility.test.ts
import { myFunction } from "./my-utility";

describe("myFunction", () => {
  test("handles the basic case", () => {
    expect(myFunction("input")).toBe("expected output");
  });

  test("handles edge case", () => {
    expect(myFunction("")).toBeNull();
  });
});
```

Use **factory functions** to create test data:

```ts
function makeUser(
  scope: TScope = "SITE",
  capabilities: TCapability[] = []
): User {
  return {
    idpId: "test-idp",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    scope,
    capabilities,
  };
}

describe("inferPersona", () => {
  test("returns system-admin for SYSTEM scope", () => {
    expect(inferPersona(makeUser("SYSTEM"))).toBe("system-admin");
  });

  test("returns inspector for PERFORM_INSPECTIONS capability", () => {
    expect(
      inferPersona(makeUser("SITE", [CAPABILITIES.PERFORM_INSPECTIONS]))
    ).toBe("inspector");
  });
});
```

### Testing React Hooks

Use `renderHook` and `act` from React Testing Library:

```tsx
// app/hooks/use-my-hook.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useMyHook } from "./use-my-hook";

describe("useMyHook", () => {
  test("initializes with default value", () => {
    const { result } = renderHook(() => useMyHook("initial"));
    expect(result.current.value).toBe("initial");
  });

  test("updates value on action", () => {
    const { result } = renderHook(() => useMyHook("initial"));

    act(() => {
      result.current.setValue("updated");
    });

    expect(result.current.value).toBe("updated");
  });

  test("calls callback on apply", () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useMyHook("initial", { onValueChange: callback })
    );

    act(() => {
      result.current.setValue("new");
      result.current.applyValue();
    });

    expect(callback).toHaveBeenCalledWith("new");
  });

  test("handles prop changes via rerender", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useMyHook(value),
      { initialProps: { value: "first" } }
    );

    rerender({ value: "second" });
    expect(result.current.value).toBe("second");
  });
});
```

### Mocking

Use `jest.fn()` for callbacks:

```ts
const onSubmit = jest.fn();
// ... trigger submission ...
expect(onSubmit).toHaveBeenCalledWith({ name: "Test" });
expect(onSubmit).toHaveBeenCalledTimes(1);
```

## What to Test

Focus testing effort on:

1. **Business logic and utilities** — Data transformation, permission checks, persona inference, URL building
2. **Custom hooks** — State transitions, callback behavior, edge cases
3. **Zod schemas** — Validate that schemas accept good data and reject bad data
4. **Complex form logic** — Dynamic schema builders, cross-field validation

Less value in testing:
- Simple UI components that are thin wrappers around Radix UI
- Route loaders/actions (these are integration-level; test the underlying logic instead)
- Components that are primarily layout/styling

## Key Files

| File | Purpose |
|---|---|
| `jest.config.js` | Jest configuration |
| `jest-setup.ts` | Test environment setup (`@testing-library/jest-dom`) |
| `app/**/*.test.ts(x)` | Test files (co-located with source) |
