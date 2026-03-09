# UI Component Library

Shield's UI is built on [Radix UI](https://www.radix-ui.com/) primitives, styled with [Tailwind CSS v4](https://tailwindcss.com/), and organized in `app/components/ui/`.

## Base Components

All base components are in `app/components/ui/`. Import them with `~/components/ui/<name>`.

### Layout & Containers

| Component | File | Description |
|---|---|---|
| Card | `card.tsx` | Content container with border and padding |
| Collapsible | `collapsible.tsx` | Expandable/collapsible content section |
| ScrollArea | `scroll-area.tsx` | Custom scrollable container |
| Separator | `separator.tsx` | Horizontal or vertical divider |
| Sidebar | `sidebar.tsx` | Collapsible navigation sidebar |
| Tabs | `tabs.tsx` | Tabbed content interface |

### Forms & Inputs

| Component | File | Description |
|---|---|---|
| Button | `button.tsx` | Primary button with variants (default, destructive, outline, ghost, link) |
| ButtonGroup | `button-group.tsx` | Groups related buttons |
| Checkbox | `checkbox.tsx` | Single checkbox input |
| Input | `input.tsx` | Text input field |
| InputGroup | `input-group.tsx` | Input with adjacent addons (icons, buttons) |
| Label | `label.tsx` | Form label |
| RadioGroup | `radio-group.tsx` | Mutually exclusive radio options |
| Select | `select.tsx` | Dropdown select input |
| Switch | `switch.tsx` | Toggle switch |
| Textarea | `textarea.tsx` | Multi-line text input |
| Toggle | `toggle.tsx` | Single toggle button |
| ToggleGroup | `toggle-group.tsx` | Group of toggleable buttons |
| Calendar | `calendar.tsx` | Date picker calendar |
| FieldSet | `field.tsx` | Form field grouping with label and error |
| Form | `form.tsx` | React Hook Form integration wrapper |

### Overlays & Modals

| Component | File | Description |
|---|---|---|
| AlertDialog | `alert-dialog.tsx` | Confirmation dialog (requires user action) |
| Dialog | `dialog.tsx` | Modal overlay with trigger and content |
| Drawer | `drawer.tsx` | Slide-out panel (mobile-friendly) |
| Sheet | `sheet.tsx` | Side panel variant of dialog |
| Popover | `popover.tsx` | Floating positioned content |
| HoverCard | `hover-card.tsx` | Card that appears on hover |
| Tooltip | `tooltip.tsx` | Floating text hint on hover |

### Navigation

| Component | File | Description |
|---|---|---|
| Breadcrumb | `breadcrumb.tsx` | Path showing current location |
| DropdownMenu | `dropdown-menu.tsx` | Context menu with items |
| NavigationMenu | `navigation-menu.tsx` | Accessible nav with submenus |
| Command | `command.tsx` | Searchable command palette (uses cmdk) |

### Feedback & Status

| Component | File | Description |
|---|---|---|
| Alert | `alert.tsx` | Inline alert message with variants |
| Badge | `badge.tsx` | Compact label for categorization |
| Empty | `empty.tsx` | Placeholder for empty states |
| Progress | `progress.tsx` | Progress bar indicator |
| Skeleton | `skeleton.tsx` | Loading placeholder animation |
| Sonner | `sonner.tsx` | Toast notification system |
| Table | `table.tsx` | Styled HTML table |

## Usage Patterns

### Importing Components

```tsx
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
```

### Styling with `cn()`

All components accept a `className` prop. Use the `cn()` utility from `~/lib/utils` for conditional classes:

```tsx
import { cn } from "~/lib/utils";

<Button className={cn("w-full", isCompact && "w-auto")}>
  Submit
</Button>
```

### Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Icons

Icons come from [Lucide React](https://lucide.dev/):

```tsx
import { Plus, Trash2, Settings } from "lucide-react";

<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>
```

## Feature Components

Beyond the base UI, feature-specific components live in subdirectories of `app/components/`:

| Directory | Purpose |
|---|---|
| `admin/` | Admin panel (user management, settings) |
| `assets/` | Asset management (detail forms, configuration, questions) |
| `clients/` | Client and site management |
| `dashboard/` | Dashboard charts and widgets (ECharts) |
| `inspections/` | Inspection workflow UI |
| `members/` | Member management and role assignment |
| `products/` | Product catalog (selectors, forms) |
| `tags/` | Tag management and registration |

## Adding a New Component

1. Create the file in `app/components/ui/` using kebab-case naming
2. Build on Radix UI primitives when the component is interactive
3. Use `class-variance-authority` (CVA) for variant styling
4. Accept a `className` prop and merge with `cn()`
5. Export named components (not default exports)

```tsx
// app/components/ui/my-component.tsx
import { cn } from "~/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const myComponentVariants = cva("base-classes", {
  variants: {
    size: {
      sm: "text-sm p-2",
      md: "text-base p-4",
      lg: "text-lg p-6",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

export function MyComponent({ className, size, ...props }: MyComponentProps) {
  return (
    <div className={cn(myComponentVariants({ size }), className)} {...props} />
  );
}
```
