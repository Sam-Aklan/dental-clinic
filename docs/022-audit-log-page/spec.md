# Spec: Audit Log Page

**Route**: `/admin/audit`  
**Component**: `AuditLogPage`  
**Auth**: ADMIN  
**File**: `frontend/src/features/admin/pages/AuditLogPage.tsx`

---

## 1. Purpose

Provides administrators with a read-only, filterable view of staff and admin actions recorded by the backend. The page supports investigation of appointment changes, user management actions, clinic settings changes, and other privileged operations.

---

## 2. Layout

Uses `AdminLayout`. The page is a filterable data table with expandable payload details.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [AdminLayout sidebar/header]                                         │
│                                                                      │
│ Audit Log                                            [Refresh]        │
│ Review privileged actions and system changes.                        │
│                                                                      │
│ [Date range] [Actor] [Action] [Target type] [Target ID] [Reset]       │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Time | Actor | Action | Target | Summary | Details             │   │
│ │ 10:04 Admin  APPOINTMENT_CANCEL APPOINTMENT abc123 [View]      │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: full `DataTable` with expandable details row or `Sheet` for payload.
- Mobile: stacked audit cards with `View details` action.
- Use `DataTable`, `DateRangePicker`, shadcn `Sheet`, `Dialog`, `Badge`, `Input`, `Select`, `Skeleton`, and `Alert` primitives.

---

## 3. Filters and URL State

| Param | Purpose |
|---|---|
| `from` | Audit timestamp start date |
| `to` | Audit timestamp end date |
| `actorId` | Actor user ID |
| `actorName` | Actor text search if backend supports it |
| `action` | Comma-separated action keys |
| `targetType` | Target entity type |
| `targetId` | Exact target ID |
| `page` | Current table page |
| `sortBy` | `createdAt`, `actor`, `action`, `targetType` |
| `sortDir` | `asc` or `desc` |

Default date range is the last 7 days in clinic timezone. Filters and pagination sync to query params.

---

## 4. Table Columns

Data source: `GET /audit`.

| Column | Sortable | Filterable | Notes |
|---|---|---|---|
| Time | Yes | Date range | Clinic timezone, localized |
| Actor | Yes | Actor filter/search | Name + role, fallback to actor ID |
| Action | Yes | Multi-select | Machine key plus localized label |
| Target | Yes | Type + ID | Entity type badge and short ID |
| Summary | No | No | Human-readable payload summary |
| Details | No | No | Opens payload viewer |

Pagination: 50 rows per page. Audit rows are immutable; no edit/delete actions.

---

## 5. Payload Details

The details view shows structured payload safely.

| Field | Behavior |
|---|---|
| Actor | Full actor name, role, ID |
| Action | Raw action key and localized label |
| Target | Entity type and target ID |
| Timestamp | ISO value and localized display |
| Payload | Pretty-printed JSON with sensitive keys redacted |

Redact likely sensitive payload keys client-side before rendering if backend does not already redact them: `password`, `token`, `refreshToken`, `accessToken`, `authorization`, `secret`.

---

## 6. Data Models

```typescript
type AuditTargetType =
  | 'USER'
  | 'DOCTOR'
  | 'APPOINTMENT'
  | 'WAITLIST'
  | 'CLINIC_CONFIG'
  | 'HOLIDAY'
  | 'SCHEDULE_OVERRIDE'
  | 'AUTH'
  | 'OTHER';

interface AuditActorDTO {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
}

interface AuditLogDTO {
  id: string;
  actorId: string | null;
  actor: AuditActorDTO | null;
  action: string;
  targetType: AuditTargetType | string;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogFilters {
  from?: string;
  to?: string;
  actorId?: string;
  actorName?: string;
  action?: string[];
  targetType?: string[];
  targetId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
```

---

## 7. Action Labels

The backend may return raw action keys. The UI should map known keys and fall back to the raw key.

Examples:

| Raw key | Label |
|---|---|
| `APPOINTMENT_CREATED` | Appointment created |
| `APPOINTMENT_RESCHEDULED` | Appointment rescheduled |
| `APPOINTMENT_CANCELED` | Appointment canceled |
| `APPOINTMENT_STATUS_UPDATED` | Appointment status updated |
| `USER_CREATED` | User created |
| `USER_UPDATED` | User updated |
| `USER_DISABLED` | User disabled |
| `CLINIC_CONFIG_UPDATED` | Clinic settings updated |
| `WORKING_HOURS_UPDATED` | Working hours updated |
| `HOLIDAY_CREATED` | Holiday created |
| `HOLIDAY_DELETED` | Holiday deleted |
| `DOCTOR_UPDATED` | Doctor updated |
| `SCHEDULE_OVERRIDE_CREATED` | Schedule override created |
| `SCHEDULE_OVERRIDE_DELETED` | Schedule override deleted |

---

## 8. Hooks and API Layer

```typescript
// features/admin/api/admin-api.ts
export async function getAuditLogs(filters: AuditLogFilters): Promise<PaginatedResponse<AuditLogDTO>>;
```

```typescript
export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => getAuditLogs(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
```

Audit logs do not need real-time updates. Provide a manual refresh button.

---

## 9. Loading and Error States

| State | UI |
|---|---|
| Initial load | Table skeleton rows |
| Filter change | Keep previous data and show subtle loading indicator |
| Empty range | Empty state with `Reset filters` |
| Audit endpoint fails | Table-level alert with Retry |
| Payload too large | Show collapsed JSON preview with expand control |
| Malformed payload | Render fallback text and raw string safely |
| `403` | Redirect to `/403` via `ProtectedRoute` |

---

## 10. Routing

```tsx
{
  path: '/admin/audit',
  element: (
    <ProtectedRoute roles={['ADMIN']}>
      <AdminLayout>
        <AuditLogPage />
      </AdminLayout>
    </ProtectedRoute>
  ),
}
```

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "auditLog": {
    "title": "Audit Log",
    "subtitle": "Review privileged actions and system changes.",
    "dateRange": "Date range",
    "actor": "Actor",
    "action": "Action",
    "targetType": "Target type",
    "targetId": "Target ID",
    "time": "Time",
    "target": "Target",
    "summary": "Summary",
    "details": "Details",
    "viewDetails": "View details",
    "payload": "Payload",
    "refresh": "Refresh",
    "resetFilters": "Reset filters",
    "noLogs": "No audit logs found for the selected filters.",
    "redacted": "Redacted",
    "actions": {
      "APPOINTMENT_CREATED": "Appointment created",
      "APPOINTMENT_RESCHEDULED": "Appointment rescheduled",
      "APPOINTMENT_CANCELED": "Appointment canceled",
      "USER_CREATED": "User created",
      "USER_UPDATED": "User updated",
      "USER_DISABLED": "User disabled",
      "CLINIC_CONFIG_UPDATED": "Clinic settings updated"
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "auditLog": {
    "title": "سجل التدقيق",
    "subtitle": "راجع الإجراءات المميزة وتغييرات النظام.",
    "dateRange": "نطاق التاريخ",
    "actor": "المستخدم المنفذ",
    "action": "الإجراء",
    "targetType": "نوع الهدف",
    "targetId": "معرف الهدف",
    "time": "الوقت",
    "target": "الهدف",
    "summary": "الملخص",
    "details": "التفاصيل",
    "viewDetails": "عرض التفاصيل",
    "payload": "البيانات",
    "refresh": "تحديث",
    "resetFilters": "إعادة ضبط الفلاتر",
    "noLogs": "لا توجد سجلات تدقيق للفلاتر المحددة.",
    "redacted": "محجوب",
    "actions": {
      "APPOINTMENT_CREATED": "تم إنشاء موعد",
      "APPOINTMENT_RESCHEDULED": "تمت إعادة جدولة موعد",
      "APPOINTMENT_CANCELED": "تم إلغاء موعد",
      "USER_CREATED": "تم إنشاء مستخدم",
      "USER_UPDATED": "تم تحديث مستخدم",
      "USER_DISABLED": "تم تعطيل مستخدم",
      "CLINIC_CONFIG_UPDATED": "تم تحديث إعدادات العيادة"
    }
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/audit` | Paginated, filterable audit log |

Backend plan lists AuditModule endpoint as `GET /` inside the module. With the global `/api` prefix and audit controller path, frontend should call `/audit`.

---

## 13. Accessibility

- Details buttons include actor/action/time in accessible labels.
- Payload sheet/dialog traps focus and returns focus to the triggering row.
- JSON payload uses readable text contrast and does not rely on syntax color only.
- Filter fields have visible labels and keyboard-accessible reset.
- Table pagination controls announce current page.

---

## 14. Acceptance Criteria

- [ ] Admin can load `/admin/audit`; non-admin roles redirect to `/403`.
- [ ] Audit table loads from `GET /audit` with default last-7-days filter.
- [ ] Date, actor, action, target type, and target ID filters sync to URL params.
- [ ] Rows show localized action labels with raw-key fallback.
- [ ] Details view displays redacted payload JSON without allowing edits.
- [ ] Pagination and sorting preserve current filters.
- [ ] Empty/error states are clear and recoverable.
- [ ] Mobile layout remains usable without horizontal scrolling.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds once audit endpoint exists.
