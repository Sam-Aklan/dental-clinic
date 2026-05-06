# Spec: Clinic Settings Page

**Route**: `/admin/settings/clinic`  
**Component**: `ClinicSettingsPage`  
**Auth**: ADMIN  
**File**: `frontend/src/features/admin/pages/ClinicSettingsPage.tsx`

---

## 1. Purpose

Allows administrators to maintain clinic-wide booking rules: timezone, slot duration, reminder timing, waitlist offer window, working hours per weekday, and holidays. These settings directly affect slot generation and patient booking availability.

---

## 2. Layout

Uses `AdminLayout`. The page is split into configuration cards with explicit save actions.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [AdminLayout sidebar/header]                                         │
│                                                                      │
│ Clinic Settings                                      [Unsaved changes]│
│ Configure booking rules, opening hours, and holiday closures.        │
│                                                                      │
│ ┌──────────────────────────────┐ ┌───────────────────────────────┐  │
│ │ General Settings             │ │ Booking Rules                  │  │
│ │ Timezone                     │ │ Slot duration                  │  │
│ │ Reminder hours               │ │ Offer window                   │  │
│ └──────────────────────────────┘ └───────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Working Hours                                                  │   │
│ │ Sun [closed]  Mon [09:00] [17:00] ... [Save working hours]     │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Holidays                                    [Add holiday]       │   │
│ │ Date | Name | Actions                                           │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: two general settings cards side by side; working hours and holidays full width.
- Mobile: cards stack; weekday rows are vertically grouped.
- Use shadcn `Card`, `Input`, `Select`, `Switch`, `Button`, `Dialog`, `Alert`, `Skeleton`, and `Table` primitives.

---

## 3. Settings Sections

### General Settings

Data source: `GET /clinic-config`.

| Field | Type | Validation | Notes |
|---|---|---|---|
| Timezone | select/search | valid IANA timezone | Defaults from backend |
| Slot duration | number/select | `5-180`, multiples of 5 | Affects generated slots |
| Reminder hours | number | `1-168` | How far before appointment reminders are sent |
| Offer window minutes | number | `5-1440` | How long waitlist offers stay valid |
| Minimum arrival buffer | number | `0-120` | Optional if backend exposes it |

Submit via `PATCH /clinic-config`.

### Working Hours

Data source: `GET /clinic-config/working-hours`.

Each weekday can be open or closed. Open days require a start and end time.

| Field | Validation |
|---|---|
| `dayOfWeek` | integer `0-6` |
| `isClosed` | boolean |
| `startTime` | required when open, `HH:mm` |
| `endTime` | required when open, `HH:mm`, after start |

Submit the full week via `PUT /clinic-config/working-hours`. Do not submit partial weekday patches unless backend adds a partial endpoint.

### Holidays

Data source: `GET /clinic-config/holidays`.

| Column | Notes |
|---|---|
| Date | Local clinic date |
| Name | Admin-provided holiday/closure label |
| Created | Optional if backend returns `createdAt` |
| Actions | Delete |

Create via `POST /clinic-config/holidays`. Delete via `DELETE /clinic-config/holidays/:id`.

---

## 4. Data Models

```typescript
interface ClinicConfigDTO {
  id: string;
  timeZone: string;
  slotDurationMinutes: number;
  reminderHoursBefore: number;
  waitlistOfferWindowMinutes: number;
  minArrivalBufferMinutes?: number;
  updatedAt: string;
}

interface UpdateClinicConfigDTO {
  timeZone: string;
  slotDurationMinutes: number;
  reminderHoursBefore: number;
  waitlistOfferWindowMinutes: number;
  minArrivalBufferMinutes?: number;
}

interface WorkingHourDTO {
  id?: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface HolidayDTO {
  id: string;
  date: string;
  name: string;
  createdAt?: string;
}

interface CreateHolidayDTO {
  date: string;
  name: string;
}
```

---

## 5. Forms and Validation

Use `react-hook-form` + `zod`.

```typescript
export const clinicConfigSchema = z.object({
  timeZone: z.string().min(1),
  slotDurationMinutes: z.number().int().min(5).max(180).refine((v) => v % 5 === 0),
  reminderHoursBefore: z.number().int().min(1).max(168),
  waitlistOfferWindowMinutes: z.number().int().min(5).max(1440),
  minArrivalBufferMinutes: z.number().int().min(0).max(120).optional(),
});

export const workingHoursSchema = z.object({
  days: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
  })).length(7),
}).superRefine((value, ctx) => {
  // Open days require start/end and end after start.
});
```

Validation messages must be translated, not hard-coded in schemas.

---

## 6. Unsaved Changes Behavior

| Scenario | Behavior |
|---|---|
| Form dirty | Show subtle `Unsaved changes` badge in page header |
| Navigate away with dirty form | Show confirmation dialog before route change if app routing supports blockers |
| Save succeeds | Reset form dirty state and toast success |
| Save fails | Keep form values and show inline error summary |
| Working hours changed | Invalidate slots, clinic config, and analytics queries |
| Holiday added/deleted | Invalidate holidays, slots, waitlist offers, and analytics queries |

---

## 7. Hooks and API Layer

```typescript
// features/admin/api/admin-api.ts
export async function getClinicConfig(): Promise<ClinicConfigDTO>;
export async function updateClinicConfig(payload: UpdateClinicConfigDTO): Promise<ClinicConfigDTO>;
export async function getWorkingHours(): Promise<WorkingHourDTO[]>;
export async function replaceWorkingHours(payload: WorkingHourDTO[]): Promise<WorkingHourDTO[]>;
export async function getHolidays(): Promise<HolidayDTO[]>;
export async function createHoliday(payload: CreateHolidayDTO): Promise<HolidayDTO>;
export async function deleteHoliday(id: string): Promise<void>;
```

```typescript
export function useClinicConfig() {
  return useQuery({
    queryKey: ['clinic-config'],
    queryFn: getClinicConfig,
    staleTime: 60_000,
  });
}

export function useUpdateClinicConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClinicConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinic-config'] }),
  });
}
```

---

## 8. Loading and Error States

| State | UI |
|---|---|
| Initial load | Skeleton cards and weekday rows |
| Config query fails | Alert in general settings card with Retry |
| Working hours query fails | Alert in working hours card with Retry |
| Holidays query fails | Alert in holidays card with Retry |
| Mutating | Disable only the section being saved/deleted |
| Validation error | Inline field errors and section error summary |
| `409` conflict | Show backend message and refetch affected section |

---

## 9. Routing

```tsx
{
  path: '/admin/settings/clinic',
  element: (
    <ProtectedRoute roles={['ADMIN']}>
      <AdminLayout>
        <ClinicSettingsPage />
      </AdminLayout>
    </ProtectedRoute>
  ),
}
```

---

## 10. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "clinicSettings": {
    "title": "Clinic Settings",
    "subtitle": "Configure booking rules, opening hours, and holiday closures.",
    "generalSettings": "General Settings",
    "bookingRules": "Booking Rules",
    "timezone": "Timezone",
    "slotDuration": "Slot duration",
    "reminderHours": "Reminder hours",
    "offerWindow": "Offer window",
    "arrivalBuffer": "Arrival buffer",
    "workingHours": "Working Hours",
    "holidays": "Holidays",
    "addHoliday": "Add holiday",
    "holidayName": "Holiday name",
    "closed": "Closed",
    "open": "Open",
    "startTime": "Start time",
    "endTime": "End time",
    "saveSettings": "Save settings",
    "saveWorkingHours": "Save working hours",
    "unsavedChanges": "Unsaved changes",
    "deleteHoliday": "Delete holiday",
    "saved": "Settings saved."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "clinicSettings": {
    "title": "إعدادات العيادة",
    "subtitle": "اضبط قواعد الحجز وساعات العمل والإغلاقات.",
    "generalSettings": "الإعدادات العامة",
    "bookingRules": "قواعد الحجز",
    "timezone": "المنطقة الزمنية",
    "slotDuration": "مدة الموعد",
    "reminderHours": "ساعات التذكير",
    "offerWindow": "مدة عرض قائمة الانتظار",
    "arrivalBuffer": "هامش الوصول",
    "workingHours": "ساعات العمل",
    "holidays": "العطلات",
    "addHoliday": "إضافة عطلة",
    "holidayName": "اسم العطلة",
    "closed": "مغلق",
    "open": "مفتوح",
    "startTime": "وقت البداية",
    "endTime": "وقت النهاية",
    "saveSettings": "حفظ الإعدادات",
    "saveWorkingHours": "حفظ ساعات العمل",
    "unsavedChanges": "تغييرات غير محفوظة",
    "deleteHoliday": "حذف العطلة",
    "saved": "تم حفظ الإعدادات."
  }
}
```

---

## 11. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/clinic-config` | Load general clinic config |
| PATCH | `/clinic-config` | Update general clinic config |
| GET | `/clinic-config/working-hours` | Load weekly working hours |
| PUT | `/clinic-config/working-hours` | Replace weekly working hours |
| GET | `/clinic-config/holidays` | Load holiday closures |
| POST | `/clinic-config/holidays` | Create holiday closure |
| DELETE | `/clinic-config/holidays/:id` | Delete holiday closure |

If backend exposes public holiday routes as `/holidays`, keep frontend API functions named around clinic config but point them to the actual configured endpoints.

---

## 12. Accessibility

- Each settings card has a unique heading.
- Weekday open/closed switches include the weekday in the accessible label.
- Time inputs expose validation errors with `aria-describedby`.
- Delete holiday requires a confirmation dialog with focus trapped while open.
- Save buttons announce pending/success states through accessible status text.

---

## 13. Acceptance Criteria

- [ ] Admin can load `/admin/settings/clinic`; non-admin roles redirect to `/403`.
- [ ] General config loads from backend and validates before save.
- [ ] Working hours load as seven weekday rows and submit as a full-week replacement.
- [ ] Closed days do not require start/end times; open days require valid ranges.
- [ ] Admin can add and delete holidays with confirmation for deletion.
- [ ] Successful mutations invalidate clinic config, slot, and analytics queries.
- [ ] Dirty forms show unsaved changes and do not lose values after failed submit.
- [ ] Mobile layout remains usable without horizontal scrolling.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds once clinic config endpoints exist.
