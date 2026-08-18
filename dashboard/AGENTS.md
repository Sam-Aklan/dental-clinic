# Agent Rules

These rules must be followed by every AI agent, developer, or team member working on this project.

The goal is to keep this React dashboard clean, consistent, scalable, testable, responsive, and easy to maintain.

Do not ignore these rules when building UI, adding logic, using MCP servers, generating code, integrating APIs, writing tests, or refactoring files.

<!-- SPECKIT START -->

Current SpecKit plan: `specs/001-follow-up-scheduling-ui/plan.md`
<!-- SPECKIT END -->

---

## 1. Project Stack

This project is a React.js application powered by Vite.

Required stack decisions:

1. Use React with TypeScript.
2. Use Vite as the app runtime and build tool.
3. Use TanStack Router for all routing.
4. Use Zustand for global state management across the project.
5. Use TanStack Query for server state, API caching, mutations, and async data synchronization.
6. Use Axios for raw HTTP requests through one shared instance.
7. Use shadcn/ui as the base UI primitive system.
8. Use Tailwind CSS v4 and the design system defined in `src/index.css`.
9. Use React Hook Form and Zod for important forms.

Current project facts:

1. The design system lives in `src/index.css`.
2. shadcn primitives are already installed under `src/components/ui`.
3. The local shadcn skill lives in `.opencode/skills/shadcn/`.
4. The project uses the `@/*` path alias for `src/*`.
5. `public` stays at the project root and must not be moved inside `src`.

---

## 2. Local Skills

Use local skills to keep agent behavior focused. If the runtime supports skills, load the matching skill before doing the work. If the runtime does not expose that skill, still follow the linked skill instructions manually.

Available project skills:

| Skill | Location | Use When |
| --- | --- | --- |
| `react-architecture` | `.opencode/skills/react-architecture/SKILL.md` | Creating features, routes, layouts, providers, Zustand stores, project structure, or refactors |
| `frontend-design` | `.opencode/skills/frontend-design/SKILL.md` | Building UI, responsive layouts, RTL/Arabic screens, dashboard screens, or translating screenshots/Figma/MCP output |
| `shadcn` | `.opencode/skills/shadcn/SKILL.md` | Adding, checking, composing, fixing, or updating shadcn/ui components |
| `api-data` | `.opencode/skills/api-data/SKILL.md` | Adding API integrations, Axios actions, API paths, TanStack Query keys, queries, mutations, or query hooks |
| `forms-validation` | `.opencode/skills/forms-validation/SKILL.md` | Building forms, Zod schemas, validation, form submit flows, or form-related API mutations |
| `testing-quality` | `.opencode/skills/testing-quality/SKILL.md` | Adding tests, fixing tests, reviewing behavior, improving reliability, or running checks |

Skill usage rules:

1. For any UI work, use `frontend-design` and `shadcn` together.
2. For any route, layout, provider, or feature structure work, use `react-architecture`.
3. For any backend/API/data fetching work, use `api-data`.
4. For any form, use `forms-validation`; also use `api-data` if the form submits to the backend.
5. For any important helper, schema, transformation, action, query key, or bug fix, use `testing-quality`.
6. Do not use skills as permission to ignore this file. `AGENTS.md` remains the source of truth.

---

## 3. Core Architecture

Approved structure:

```txt
project-root/
  public/
  src/
    main.tsx
    App.tsx
    index.css
    routeTree.gen.ts
    routes/
    components/
      ui/
      shared/
    constants/
    types/
    lib/
    hooks/
    stores/
    test/
```

Rules:

1. `src/routes` is only for TanStack Router route definitions, route-level shells, route loaders, and route guards.
2. `src/components/ui` is for shadcn primitives installed by shadcn. Do not move these files into feature folders.
3. `src/components/shared` is for reusable project components that compose primitives.
4. `src/components/{feature-name}` is for feature-specific UI components.
5. `src/constants` is for static content, route paths, navigation items, labels, and static configuration.
6. `src/types` is for TypeScript types.
7. `src/lib` is for helpers, schemas, API actions, query keys/options, formatters, transformations, and pure logic.
8. `src/hooks` is for React hooks, TanStack Query hooks, mutation hooks, and reusable UI hooks.
9. `src/stores` is for Zustand stores and global state slices.
10. `src/test` is for tests related to helpers, schemas, actions, query keys, stores, hooks, calculations, and important behavior.
11. Do not create `components`, `constants`, `types`, `lib`, `hooks`, `stores`, or `test` inside `src/routes`.
12. Keep each feature organized across `routes`, `components`, `constants`, `types`, `lib`, `hooks`, `stores`, and `test` using the same feature name whenever possible.

---

## 4. TanStack Router Rules

All routing must use TanStack Router. Do not add React Router, Next.js App Router, or ad hoc route state.

Approved routing structure:

```txt
src/routes/
  __root.tsx
  index.tsx
  login.tsx
  sign-up.tsx
  _client-portal.tsx
  _client-portal.index.tsx
  _client-portal.agreements.tsx
  _client-portal.profile.tsx
  _admin.tsx
  _admin.dashboard.tsx
  _admin.clients.tsx
  _admin.agreements.tsx
```

Rules:

1. Use TanStack Router file-based routing when the project has route generation configured.
2. If file-based routing is not yet configured, set it up before adding application routes.
3. Keep route files clean. A route component should compose feature sections and route-level providers only.
4. Do not place heavy JSX, large static arrays, API implementations, schemas, or reusable UI in route files.
5. Use pathless layout routes such as `_admin` and `_client-portal` for shared shells and guards.
6. Use `beforeLoad` for auth and role guards when the guard is route-related.
7. Put reusable guard logic in `src/lib/{feature}/helpers` or `src/lib/auth/helpers`, not directly in every route file.
8. Route loaders may call raw query option builders or API functions, but reusable data logic must live in `src/lib`.
9. Use `Link`, `useNavigate`, route params, and search params from `@tanstack/react-router`.
10. Store route path constants in `src/constants/routes.ts` when paths are reused in menus, redirects, or tests.
11. Do not use Next.js conventions such as `src/app`, `page.tsx`, `layout.tsx`, route handlers, or server components.

Clean route example:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { DashboardSection } from "@/components/dashboard";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return <DashboardSection />;
}
```

---

## 5. App Entry and Providers

`src/main.tsx` should only mount React and root-level providers.

Approved provider structure:

```txt
src/components/providers/
  app-providers.tsx
  query-provider.tsx
  theme-provider.tsx
  index.ts
```

Rules:

1. Create one stable TanStack Query `QueryClient` in `query-provider.tsx` or a provider helper.
2. Mount `RouterProvider` at the root when TanStack Router is configured.
3. Keep global providers in `src/components/providers`, not in feature folders.
4. Do not create React Context for global state if Zustand is appropriate.
5. Use React Context only for third-party providers or truly contextual UI concerns.
6. Do not put application business logic in `main.tsx` or `App.tsx`.

---

## 6. Zustand State Management Rules

Zustand is the approved global state manager across the project.

Approved structure:

```txt
src/stores/
  auth-store.ts
  dashboard-store.ts
  client-portal-store.ts
  ui-store.ts
  index.ts
```

Rules:

1. Use Zustand for global client state shared across routes or distant components.
2. Use local React state for state used only inside one small component.
3. Use TanStack Query for server state. Do not duplicate fetched API data into Zustand unless there is a concrete UI need.
4. Keep stores focused by domain, such as auth, dashboard, client portal, UI, filters, or preferences.
5. Use selectors when reading store state to avoid unnecessary rerenders.
6. Use `persist` only for state that must survive refreshes, such as auth session metadata, theme, locale, or user preferences.
7. Do not persist sensitive secrets unless the user explicitly approves the storage strategy.
8. Keep store types in `src/types/{feature}.ts` when reusable.
9. Add tests for important store behavior, especially auth, permissions, role logic, and persisted state migrations.

Example:

```ts
import { create } from "zustand";

type UiStore = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

// AR: يدير هذا المتجر حالة واجهة عامة مشتركة بين الصفحات.
// EN: This store manages shared UI state used across routes.
export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
```

---

## 7. Components Rules

All UI components must live in `src/components`.

Approved structure:

```txt
src/components/
  ui/
    button.tsx
    card.tsx
    input.tsx
    table.tsx
  shared/
    container/
      Container.tsx
      index.ts
    section-header/
      SectionHeader.tsx
      index.ts
  dashboard/
    DashboardSection.tsx
    DashboardStats.tsx
    index.ts
```

Rules:

1. Before creating a component, check `src/components/ui` for a shadcn primitive and `src/components/shared` for an existing project wrapper.
2. If a component is used in more than one feature, place it in `src/components/shared`.
3. If a component is used by only one feature, keep it in `src/components/{feature-name}`.
4. Every feature component folder must include an `index.ts` file.
5. Do not duplicate primitives from `src/components/ui`.
6. Do not edit shadcn primitive files unless the task is specifically to fix or customize the primitive globally.
7. Feature components should focus on rendering, composition, and user interaction.
8. Move heavy logic to `src/lib/{feature}/helpers` and important state to `src/stores` or `src/hooks`.
9. Use named exports for components. Use default exports only where a tool requires them.
10. Do not crowd UI components with hooks or data logic. Keep `useState`, `useEffect`, `useMemo`, `useCallback`, `useForm`, and similar logic in a custom hook under `src/hooks/{feature}`, then import that hook into the component so the UI file stays focused on rendering.
11. UI components should contain only JSX, HTML tags, shadcn primitives, and other presentational components whenever possible.

---

## 8. Design System and Styling Rules

The design system is defined in `src/index.css`.

Rules:

1. Do not create another global CSS file for theme tokens.
2. Do not move shadcn CSS variables out of `src/index.css`.
3. Use semantic tokens such as `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `bg-primary`, and `text-primary-foreground`.
4. Avoid raw color classes such as `bg-blue-500` unless the design system explicitly requires a one-off visual.
5. Use Tailwind v4 conventions already present in `src/index.css`, including `@theme inline` and CSS variables.
6. Use `@/lib/utils` and `cn()` for conditional classes.
7. Use `gap-*` for spacing in flex/grid layouts. Avoid `space-x-*` and `space-y-*` for new UI.
8. Use `size-*` when width and height are equal.
9. Do not add manual dark-mode color overrides when semantic tokens already support the theme.
10. Preserve the existing shadcn `radix-vega` style configured in `components.json` unless the user requests a preset/theme change.

---

## 9. shadcn/ui Rules

This project uses shadcn/ui as the base UI system.

Rules:

1. Most shadcn primitives are already installed in `src/components/ui`; check this folder before adding anything.
2. Use the local shadcn skill at `.opencode/skills/shadcn/` for shadcn work.
3. Buttons, cards, dialogs, drawers, sheets, dropdowns, accordions, tabs, selects, inputs, badges, forms, tables, popovers, tooltips, skeletons, sidebars, empty states, and charts should use shadcn primitives whenever suitable.
4. Do not create custom primitives when a shadcn primitive exists.
5. Shared project components should compose shadcn primitives rather than replacing them.
6. Use `npx shadcn@latest docs <component>` or the project skill guidance when adding or debugging shadcn usage.
7. Do not run shadcn overwrite commands without user approval.
8. Review generated or installed component files for imports, accessibility, RTL, responsiveness, and design-system consistency.

---

## 10. Constants Rules

Static UI data must live in `src/constants`.

Static data includes:

- Route paths
- Navigation and sidebar items
- Section content
- CTA links
- Card data
- Feature lists
- Table column labels
- Asset paths
- Static configuration values

Rules:

1. Do not keep large static arrays inside components.
2. Do not repeat the same static data in multiple places.
3. Export constants from `src/constants/index.ts`.
4. Store shared route constants in `src/constants/routes.ts`.
5. Store feature constants in `src/constants/{feature-name}.ts`.

---

## 11. Types Rules

TypeScript types must live in `src/types`.

Rules:

1. Do not define large reusable types inside components.
2. Keep feature types in `src/types/{feature-name}.ts`.
3. Keep shared types in `src/types/common.ts` or `src/types/api.ts`.
4. Export public types from `src/types/index.ts`.
5. Use `import type` for TypeScript-only imports.
6. Keep API request and response types in feature type files or `src/types/api.ts` when shared.
7. Keep Zustand store types in feature type files when reused outside the store.

---

## 12. Lib Rules

All helpers, schemas, API actions, formatters, transformations, validations, route helpers, and feature logic must live in `src/lib`.

Approved structure:

```txt
src/lib/
  axios-instance.ts
  api-paths.ts
  index.ts
  auth/
    helpers/
      auth-guard.helper.ts
      index.ts
    schemas/
      login.schema.ts
      index.ts
    actions/
      auth.api.ts
      auth.keys.ts
      auth.queries.ts
      auth.mutations.ts
      index.ts
    index.ts
```

Rules:

1. Use `helpers/` for pure helper functions.
2. Use `schemas/` for Zod schemas and reusable validation.
3. Use `actions/` for raw API functions, query keys, query options, and mutation option builders.
4. Use `formatters/` only when formatting utilities are needed.
5. Every feature-specific lib folder must include an `index.ts` file.
6. Every non-empty inner folder must include an `index.ts` file.
7. Do not create empty helper, schema, formatter, or action files.
8. Do not write backend URLs directly inside components, hooks, stores, or route files.
9. Keep feature logic grouped by domain name, not vague technical names.
10. Avoid vague files such as `utils.ts`, `data.ts`, or `helpers.ts` when a clearer feature-specific name is available. The existing `src/lib/utils.ts` is allowed for shared low-level utilities such as `cn()`.

---

## 13. API Fetching Stack

All backend communication uses these layers:

```txt
src/lib/axios-instance.ts      -> shared Axios client
src/lib/api-paths.ts           -> centralized endpoint registry
src/lib/{feature}/actions      -> raw API functions, keys, queries, mutations
src/hooks/{feature}            -> React Query hooks and feature UI hooks
src/components/{feature}       -> UI consuming hooks/actions
```

Rules:

1. Use one shared Axios instance for the project.
2. Do not call `axios.create` inside components, routes, hooks, stores, or feature actions.
3. Use environment variables for backend base URLs. In Vite, prefer `import.meta.env.VITE_API_BASE_URL`.
4. Put every backend endpoint in `src/lib/api-paths.ts` before using it.
5. Raw API functions must call Axios and return `response.data` only.
6. API functions must not call React hooks, render UI, trigger toasts, or manage component state.
7. Query keys must include filters, IDs, pagination, sorting, and search values when they affect returned data.
8. Mutations must invalidate or update the correct query keys after success.
9. Keep toast messages in components or an explicitly agreed UI feedback layer, not in raw API functions.
10. Do not store server cache data in Zustand when TanStack Query already owns it.

Preferred action files:

```txt
src/lib/agreements/actions/
  agreement.api.ts
  agreement.keys.ts
  agreement.queries.ts
  agreement.mutations.ts
  index.ts
```

Preferred hook files:

```txt
src/hooks/agreements/
  use-agreements-query.ts
  use-create-agreement-mutation.ts
  use-agreement-filters.ts
  index.ts
```

---

## 14. Hooks Rules

All React hooks must live in `src/hooks`.

Rules:

1. Feature hooks must be grouped under `src/hooks/{feature}`.
2. Shared hooks must be grouped under `src/hooks/shared`.
3. Use kebab-case file names for hooks, such as `use-agreements-query.ts`.
4. Hooks must use named exports.
5. Hooks must not contain raw endpoint strings.
6. Hooks must not create Axios instances.
7. TanStack Query hooks must call raw API functions and query keys from `src/lib/{feature}/actions`.
8. Hooks may contain UI state such as filters, pagination, sorting, tabs, debounced search, modal state, and query/mutation coordination.
9. If state is global across routes, move it to Zustand in `src/stores`.

---

## 15. Form Rules

If a feature contains a form, follow these rules:

1. Use React Hook Form.
2. Use Zod for validation.
3. Store Zod schemas inside `src/lib/{feature}/schemas`.
4. Store form value types inside `src/types/{feature}.ts`.
5. Store submit API functions inside `src/lib/{feature}/actions`.
6. Use shadcn form and input primitives from `src/components/ui` whenever suitable.
7. Do not write validation logic directly inside JSX.
8. Add tests for important validation schemas.
9. Use Zustand only for multi-step or cross-route form state that genuinely must survive outside one component.

---

## 16. RTL and Arabic UI Rules

This project is Arabic-first and RTL-first unless a specific screen is explicitly designed otherwise.

Rules:

1. The root app must support RTL where Arabic UI is rendered.
2. Arabic pages and sections must use `dir="rtl"` where appropriate.
3. Prefer logical utilities such as `text-start`, `items-start`, `justify-start`, `start-*`, `end-*`, `ms-*`, `me-*`, `ps-*`, and `pe-*`.
4. Do not use `text-left` for Arabic headings, paragraphs, labels, or cards unless the design explicitly requires it.
5. Do not blindly use `flex-row-reverse`, `justify-end`, `items-end`, or `text-end` as RTL fixes.
6. For Arabic text blocks, visual alignment should normally be to the right in RTL.
7. For two-column sections, preserve the design reference: if text is on the right and image is on the left, implement that exact order.
8. Avoid fragile fixed absolute positioning.
9. Review generated MCP/Figma/Stitch code for reversed content, wrong alignment, and broken RTL before accepting it.

Correct Arabic card example:

```tsx
// AR: بطاقة عربية بمحاذاة منطقية تبدأ من يمين الشاشة في وضع RTL.
// EN: Arabic card using logical start alignment, which appears on the right in RTL.
export function AgreementCard() {
  return (
    <article dir="rtl" className="flex flex-col items-start text-start">
      <h3>عنوان الاتفاقية</h3>
      <p>وصف مختصر للاتفاقية وحالتها الحالية.</p>
    </article>
  );
}
```

---

## 17. Responsive and Mobile-First UI Rules

Every UI section, component, route, and page must be mobile-first.

Rules:

1. Start with the smallest mobile viewport.
2. Add larger breakpoint styles progressively with `sm:`, `md:`, `lg:`, `xl:`, and `2xl:` only when needed.
3. Do not build desktop first and squeeze it into mobile.
4. Use flexible layouts such as `flex`, `grid`, wrapping, responsive columns, and proper gaps.
5. Avoid hardcoded widths, heights, margins, and absolute positions that break on small screens.
6. Images, icons, cards, buttons, forms, navigation, tables, and text blocks must adapt naturally.
7. Tables must have a mobile strategy such as horizontal scroll, card conversion, or responsive columns.
8. Do not change the design style while making a section responsive.
9. Verify mobile, tablet, laptop, desktop, and RTL behavior before marking UI complete.

---

## 18. MCP, Figma, Stitch, and Generated UI Rules

Generated UI must still follow this architecture.

Before building generated or reference-based UI:

1. Ask whether the user wants to provide a screenshot, Figma link, Stitch link, or design reference when the design is unclear.
2. Identify reusable UI parts.
3. Check `src/components/ui` and `src/components/shared` before creating new UI.
4. Use shadcn primitives where suitable.
5. Match `src/index.css` design tokens, spacing, typography, layout, and color system.
6. Convert generated output into the approved folders.
7. Make the result mobile-first and responsive.
8. Verify RTL alignment and content order.
9. Do not accept generated output as final until structure, imports, accessibility, responsiveness, and design-system usage are fixed.

Generated code must be separated into:

- Routes inside `src/routes`
- UI components inside `src/components`
- Static data inside `src/constants`
- Types inside `src/types`
- Helpers, schemas, actions, and API logic inside `src/lib`
- Hooks inside `src/hooks`
- Zustand stores inside `src/stores`
- Tests inside `src/test`
- Assets inside `public`

---

## 19. Testing Rules

Testing is required for important behavior.

Tests belong in `src/test` and should follow the same feature grouping used by the source code.

Add tests for:

- API functions and expected error handling
- Query key builders
- Zod schemas
- Pure helpers and formatters
- Data transformations
- Financial, date, permission, and role logic
- Important Zustand store behavior
- Non-trivial hook helpers
- Bug fixes with reproducible behavior

Rules:

1. Test files must use `.test.ts` or `.test.tsx`.
2. Do not create empty test files.
3. Do not test TanStack Query internals. Test our wrappers, keys, options, and business behavior.
4. Use Vitest for unit tests and lightweight e2e-style coverage in this repository.
5. If the project does not yet have a test runner, recommend or add one only after checking `package.json` and project setup.
6. Run the available test command after adding or changing tests when possible.

---

## 20. Public Assets Rules

The `public` folder must stay at the project root.

Rules:

1. Organize assets by feature or section, such as `public/dashboard`, `public/auth`, `public/agreements`, or `public/client-portal`.
2. Do not place all assets randomly in the root of `public`.
3. Use clear file names.
4. If asset paths are reused, store them in the related constants file.
5. Do not use external image URLs in production UI unless the external source is a deliberate product requirement.

---

## 21. Feature Building Workflow

For every new feature, page, section, component, UI, API action, store, or generated implementation, follow this workflow.

1. Identify the feature name and route path.
2. Decide whether a TanStack Router route, pathless layout, guard, loader, or search params are needed.
3. Check `src/components/ui` and `src/components/shared` before creating components.
4. Create or update route files in `src/routes` only.
5. Create feature components in `src/components/{feature-name}`.
6. Move static content to `src/constants/{feature-name}.ts`.
7. Move reusable types to `src/types/{feature-name}.ts`.
8. Add helpers, schemas, API actions, query keys, and query options under `src/lib/{feature-name}` only when needed.
9. Add React Query hooks or UI hooks under `src/hooks/{feature-name}` only when needed.
10. Add Zustand stores under `src/stores` only for global state.
11. Add API paths to `src/lib/api-paths.ts` before API functions.
12. Add tests for important behavior.
13. Organize assets under `public/{feature-name}`.
14. Add clean exports through `index.ts` files.
15. Verify mobile, tablet, desktop, RTL, accessibility, and design-system consistency.
16. Run lint, build, type-check, and tests when possible.
17. Update `package.json` version after completing a feature or fix.

---

## 22. Import Rules

Use path aliases whenever possible.

Preferred:

```ts
import { DashboardSection } from "@/components/dashboard";
import { dashboardNavigation } from "@/constants";
import { getDashboardStats } from "@/lib/dashboard";
import { useDashboardStatsQuery } from "@/hooks/dashboard";
import { useUiStore } from "@/stores";
import type { DashboardStats } from "@/types";
```

Rules:

1. Export public feature APIs through index files.
2. Avoid deep relative imports when an index export exists.
3. Use `import type` for TypeScript-only imports.
4. Keep imports clean and remove unused imports.
5. Import shadcn primitives from `@/components/ui/{component}`.

---

## 23. Naming Rules

Component files:

```txt
LoginSection.tsx
LoginForm.tsx
DashboardSection.tsx
DashboardStats.tsx
AgreementCard.tsx
AgreementsTable.tsx
ClientProfileSection.tsx
```

Route files:

```txt
__root.tsx
index.tsx
login.tsx
_admin.tsx
_admin.dashboard.tsx
_client-portal.agreements.tsx
```

Store files:

```txt
auth-store.ts
ui-store.ts
dashboard-store.ts
agreement-filters-store.ts
```

Lib files:

```txt
auth.api.ts
auth.keys.ts
auth.queries.ts
auth.mutations.ts
login.schema.ts
agreement-status.helper.ts
dashboard-calculations.helper.ts
```

Rules:

1. Use clear feature-based names.
2. Do not use vague filenames such as `new.tsx`, `component.tsx`, `helpers.ts`, or `data.ts` when a clearer name is available.
3. Use kebab-case for hook files.
4. Use PascalCase for component files.
5. Keep names consistent across routes, components, constants, types, lib, hooks, stores, tests, and assets.

---

## 24. Code Quality Rules

1. Use TypeScript.
2. Use functional React components.
3. Use named exports for components, hooks, stores, helpers, schemas, and actions.
4. Keep files small and focused.
5. Do not mix UI, constants, types, logic, schemas, actions, stores, and tests in one file.
6. Do not duplicate code.
7. Do not create unnecessary abstractions.
8. Do not create unused files.
9. Do not leave unused imports.
10. Do not break the existing design system.
11. Do not change business content unless requested.
12. Do not move assets without updating their paths.
13. Do not place reusable components inside `src/routes`.
14. Do not hardcode API paths in UI components, hooks, stores, or routes.
15. Do not skip tests for important functions, schemas, actions, query keys, stores, and calculations.
16. Run lint, build, and test checks after meaningful changes when possible.

---

## 25. Code Comments Rules

Add comments only when they help explain intent, structure, or non-obvious behavior.

Rules:

1. Write helpful comments in both Arabic and English in the same comment when adding meaningful UI, logic, actions, schemas, stores, or functions.
2. UI comments should briefly explain the interface or design intent.
3. Logic comments should explain what the function does and why it exists.
4. API comments should explain endpoint behavior.
5. Store comments should explain global state ownership and persistence decisions.
6. Avoid noisy comments that restate obvious syntax.

Example:

```ts
// AR: يحفظ هذا المتجر تفضيلات الواجهة التي يحتاجها أكثر من مسار.
// EN: This store keeps UI preferences that are shared across multiple routes.
export const useUiStore = create<UiStore>()(/* ... */);
```

---

## 26. Versioning Rules

Update the project version in `package.json` after completing any feature, fix, or rules update.

This project follows semantic-style versioning:

```txt
major.minor.patch
```

Rules:

1. New feature: increase the minor version.
2. Bug fix, documentation/rules update, or maintenance change: increase the patch version.
3. Do not change the major version unless the user explicitly requests it.
4. If the current version has two numbers, normalize it to three numbers before updating.
5. Mention the version change in the final response.

---

## 27. Short Prompt for Future Agent Tasks

Use this prompt when asking an agent to build a new route, feature, component, UI, store, API action, test, or generated design implementation.

```md
Before writing code, read and follow `AGENTS.md` from the project root.

This is a React + Vite project.

Use the approved architecture:

- Routes in `src/routes` using TanStack Router
- shadcn primitives in `src/components/ui`
- Reusable project components in `src/components/shared`
- Feature UI in `src/components/{feature-name}`
- Static data in `src/constants/{feature-name}.ts`
- Types in `src/types/{feature-name}.ts`
- Helpers, schemas, API functions, query keys, query options, and mutation options in `src/lib/{feature-name}`
- React hooks and TanStack Query hooks in `src/hooks/{feature-name}`
- Zustand stores in `src/stores`
- Tests in `src/test/{feature-name}`
- Assets in `public/{feature-name}`

Use TanStack Router for routing and Zustand for global state.

Use TanStack Query for server state and Axios through `src/lib/axios-instance.ts` for raw HTTP requests.

Before creating UI, check existing shadcn primitives in `src/components/ui` and use the shadcn skill in `.opencode/skills/shadcn/` when needed.

Use the design system in `src/index.css`. Do not create a separate theme file or bypass semantic tokens.

Use a mobile-first approach and preserve Arabic RTL alignment where applicable.

Do not mix UI, constants, types, logic, schemas, stores, actions, hooks, and tests in one file.

For important helpers, schemas, transformations, stores, query keys, and API actions, add tests.

Run lint, type-check/build, and tests when possible.

Update `package.json` version after completing a feature, fix, or rules update.
```

---

## 28. Golden Rule

Route files stay clean and should only compose sections, route shells, loaders, guards, and feature-level components.

Correct:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { DashboardSection } from "@/components/dashboard";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return <DashboardSection />;
}
```

Wrong:

```tsx
export const Route = createFileRoute("/_admin/dashboard")({
  component: function DashboardRoute() {
    return (
      <main>
        {/* Huge dashboard JSX here */}
        {/* API URLs here */}
        {/* Validation schemas here */}
        {/* Zustand store definitions here */}
        {/* Complex calculations here */}
      </main>
    );
  },
});
```
