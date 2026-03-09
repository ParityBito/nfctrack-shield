# Form Handling Patterns

Shield uses React Hook Form with Zod for form validation, with two submission strategies depending on context.

## Core Stack

| Library | Purpose |
|---|---|
| `react-hook-form` | Form state, validation, dirty tracking |
| `zod` | Schema definition and validation |
| `@hookform/resolvers/zod` | Connects Zod schemas to React Hook Form |
| `remix-hook-form` | Bridge for React Router server actions (limited use) |

## Submission Patterns

### Pattern 1: Client-Side via `useModalFetcher` (Primary)

Most forms submit through `useModalFetcher`, which posts JSON to the `/api/proxy/*` route. This is the preferred approach.

```tsx
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";

const schema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.email(),
});

type TForm = z.infer<typeof schema>;

function EditUserForm({ user, onSubmitted }: Props) {
  const form = useForm<TForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,  // Called on success — typically closes the modal
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
      path: "/api/proxy/users",
      id: user.id,  // If provided, sends PATCH; otherwise POST
    });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Controller
          control={form.control}
          name="firstName"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>First Name</FieldLabel>
              <Input {...field} />
              {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
        {/* more fields... */}
        <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
```

#### `useModalFetcher` API

```tsx
const {
  submitJson,           // POST with JSON body
  createOrUpdateJson,   // POST (create) or PATCH (update if id provided)
  isSubmitting,
  isLoading,
  load,                 // GET request
  data,                 // Response data
  fetcher,              // Underlying React Router fetcher
} = useModalFetcher({
  onSubmitted,          // Success callback
});
```

Options passed to `createOrUpdateJson` / `submitJson`:

```tsx
submit(data, {
  path: "/api/proxy/assets",      // API proxy path
  id: "asset-123",                // Triggers PATCH instead of POST
  accessIntent: "elevated",       // Sets X-Access-Intent header
  clientId: "client-456",         // Sets X-Client-Id header
});
```

### Pattern 2: Server Action via `remix-hook-form` (Limited Use)

Used for forms that need server-side validation or require React Router action handling (e.g., the inspection form):

```tsx
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { Form } from "react-router";

// Component
const form = useRemixForm({
  resolver: zodResolver(inspectionSchema),
  values: { /* ... */ },
});

return (
  <RemixFormProvider {...form}>
    <Form method="post">
      {/* fields */}
    </Form>
  </RemixFormProvider>
);

// Route action
export const action = async ({ request }: Route.ActionArgs) => {
  const { data } = await getValidatedFormDataOrThrow(
    request,
    zodResolver(inspectionSchema)
  );
  // process data...
};
```

The `getValidatedFormDataOrThrow` utility (`app/lib/forms.ts`) validates form data server-side and throws a 400 Response with errors if validation fails.

## Zod Schema Patterns

Schemas live in `app/lib/schema.ts`. Common patterns:

### Basic CRUD schemas

```ts
// Create schema defines the full shape
export const createClientSchema = z.object({
  externalId: z.string().nonempty(),
  name: z.string().nonempty(),
  status: z.enum(ClientStatuses),
  // ...
});

// Update schema is partial, with id added
export const updateClientSchema = createClientSchema
  .omit({ externalId: true })
  .extend({ id: z.string() })
  .partial();
```

### Dynamic schema builders

For forms where the shape depends on runtime data (e.g., asset questions):

```ts
export const buildInspectionSchema = (questions: AssetQuestion[]) => {
  return createInspectionSchema.extend({
    responses: z.object({
      createMany: z.object({
        data: z
          .array(createAssetQuestionResponseSchema)
          .superRefine(buildQuestionResponseValidator(questions)),
      }),
    }),
  });
};
```

### Cross-field validation

```ts
const schema = z.object({ /* ... */ }).superRefine((data, ctx) => {
  if (data.valueType === "SELECT" && !data.selectOptions?.length) {
    ctx.addIssue({
      code: "custom",
      message: "Select options are required for SELECT type",
      path: ["selectOptions"],
    });
  }
});
```

### Prisma-style relationship schemas

```ts
export const requireConnectSchema = z.object({
  connect: z.object({ id: z.string() }),
});

export const optionalConnectSchema = z.object({
  connect: z.object({ id: z.string() }).optional(),
});
```

## Modal Form Layout

Forms inside modals follow this structure:

```tsx
<FormProvider {...form}>
  <form
    className="flex min-h-0 flex-1 flex-col"
    onSubmit={form.handleSubmit(handleSubmit)}
  >
    <ResponsiveModalBody className="space-y-4">
      {/* Form fields */}
    </ResponsiveModalBody>
    <ResponsiveModalFooter>
      <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </ResponsiveModalFooter>
  </form>
</FormProvider>
```

The submit button is disabled when:
- A submission is in progress
- The form hasn't been modified (for edit forms)

## Unsaved Changes Detection

### In modals

Forms report dirty state to their parent modal via a callback:

```tsx
// Form component
useEffect(() => {
  onDirtyChange?.(form.formState.isDirty);
}, [form.formState.isDirty, onDirtyChange]);
```

The modal shows a confirmation dialog before closing if the form has unsaved changes.

### In full pages

Use React Router's `useBlocker` + `useBeforeUnload`:

```tsx
import { useBeforeUnload, useBlocker } from "react-router";

const blocker = useBlocker(isDirty);

useBeforeUnload((e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = true;
  }
});

useEffect(() => {
  if (blocker.state === "blocked") {
    const confirmed = confirm("You have unsaved changes. Are you sure you want to leave?");
    if (confirmed) blocker.proceed();
  }
}, [blocker]);
```

## Complex Forms with Context

For forms with sub-panels, nested sections, or shared state between distant parts of the form tree, use a dedicated context:

```tsx
// Define context for the form
interface FormContext {
  action: "create" | "update";
  data: Record<string, unknown>;
  setData: Updater<Record<string, unknown>>;
  sidepanelId: string | null;
  openSidepanel: (id: string) => void;
  closeSidepanel: () => void;
}

// Wrap the form
<FormContextProvider action={isNew ? "create" : "update"}>
  <ComplexFormContent {...props} />
</FormContextProvider>
```

Example: `app/components/assets/asset-question-details-form/` uses this pattern for managing side panels and shared form state.

## Field Components

Use the shared field primitives from `app/components/ui/field`:

| Component | Purpose |
|---|---|
| `Field` | Wrapper for a form field |
| `FieldLabel` | Label element |
| `FieldError` | Validation error message |
| `FieldGroup` | Group related fields |
| `FieldSet` | Fieldset with legend |
| `FieldLegend` | Legend for fieldset |

## Key Files

| File | Purpose |
|---|---|
| `app/lib/schema.ts` | All Zod schema definitions |
| `app/lib/forms.ts` | `getValidatedFormDataOrThrow` utility |
| `app/hooks/use-modal-fetcher.tsx` | Primary form submission hook |
| `app/components/ui/form.tsx` | Form component wrapper |
| `app/components/ui/field/` | Shared field primitives |
| `app/routes/api/proxy.ts` | API proxy for client-side form submissions |
