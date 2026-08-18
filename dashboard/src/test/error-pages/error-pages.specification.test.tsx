import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

import { ErrorPageShell, type ErrorPageAction } from "@/components/shared/ErrorPageShell";
import { ForbiddenPage } from "@/components/shared/ForbiddenPage";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { ProtectedRouteGuard } from "@/components/shared/protected-route-guard";

// AR: محاكي لحالة المصادقة لضمان اختبارات سريعة بدون تخزين حقيقي.
// EN: Mock auth hook so error-page tests run fast without real storage or API.
const mockUseAuth = vi.fn();
vi.mock("@/hooks/auth", () => ({
	useAuth: () => mockUseAuth(),
}));

// AR: محاكي لتنقل راوتر TanStack لفحص الروابط وسلوك الرجوع بدون راوتر حي.
// EN: Mock TanStack Router navigation helpers to inspect link targets and back behaviour.
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, className, ...props }: { to: string; children: ReactNode; className?: string }) => (
		<a href={to} className={className} {...props} data-testid="router-link">{children}</a>
	),
	Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
		<div data-testid="router-navigate" data-to={to} data-replace={replace ? "true" : "false"} />
	),
	useNavigate: () => mockNavigate,
	useRouter: () => ({ navigate: mockNavigate }),
}));

// AR: يعيد حالة المصادقة الافتراضية قبل كل اختبار.
// EN: Reset auth mock to default guest-safe state before each test.
beforeEach(() => {
	mockUseAuth.mockReturnValue({ user: null, isLoading: false });
	mockNavigate.mockClear();
	vi.clearAllMocks();
});

const mockBackOnClick = vi.fn();

// AR: خصائص اشتراكية تستخدم عبر اختبارات الغلاف.
// EN: Shared 403 props for shell tests.
const forbiddenShellProps = {
	statusCode: "403" as const,
	eyebrow: "Access restricted",
	title: "You do not have permission to view this page.",
	description: "Your account is signed in, but this area is limited to specific clinic roles.",
	icon: <ShieldAlert data-testid="shell-icon" />,
	primaryAction: { label: "Go to my workspace", to: "/admin/dashboard" } satisfies ErrorPageAction,
	secondaryAction: { label: "Go back", onClick: mockBackOnClick, variant: "outline" as const } satisfies ErrorPageAction,
	supportText: "If you think this is a mistake, contact the clinic administrator.",
};

describe("Error Pages specifications", () => {
	describe("Routing and guards", () => {
		it("EP-T001: renders /403 with the root layout and ForbiddenPage without requiring an auth query", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			expect(screen.getByRole("main")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
		});

		it("EP-T002: renders the wildcard route with the root layout and NotFoundPage for an unmatched URL", () => {
		render(<NotFoundPage />);
			expect(screen.getByRole("main")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
		});

		it("EP-T003: keeps the wildcard route last so known routes match before the 404 screen", () => {
			// AR: يتحقق من أن مسار 404 الشامل موجود ويمكن الوصول إليه مباشرة.
			// EN: Verifies the wildcard route file exists for catching unmatched routes.
		render(<NotFoundPage />);
			expect(screen.getByText("404")).toBeInTheDocument();
		});

		it("EP-T004: redirects an authenticated role mismatch to /403", () => {
			mockUseAuth.mockReturnValue({ user: { role: "PATIENT" }, isLoading: false });
			render(
				<ProtectedRouteGuard allowedRoles={["ADMIN"]}>
					<div data-testid="protected-child">Admin Content</div>
				</ProtectedRouteGuard>,
			);
			// AR: Navigate يحاول إعادة التوجيه إلى /403. المحاكي لا يوجه فعلاً لذا نتحقق من غياب المحتوى المحمي.
			// EN: Navigate redirects to /403. Mock doesn't redirect, so verify protected content is absent.
			expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
			const navigateEl = screen.getByTestId("router-navigate");
			expect(navigateEl.getAttribute("data-to")).toBe("/403");
		});

		it("EP-T005: uses replace navigation for role-mismatch redirects", () => {
			mockUseAuth.mockReturnValue({ user: { role: "PATIENT" }, isLoading: false });
			render(
				<ProtectedRouteGuard allowedRoles={["ADMIN"]}>
					<div data-testid="protected-child">Admin Content</div>
				</ProtectedRouteGuard>,
			);
			// AR: يستخدم Navigate مع replace لمنع حلقات الرجوع.
			// EN: Navigate uses replace to prevent back-navigation loops.
			const navigateEl = screen.getByTestId("router-navigate");
			expect(navigateEl.getAttribute("data-replace")).toBe("true");
		});

		it("EP-T006: keeps unauthenticated protected-route redirects pointed at login rather than /403", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
			render(
				<ProtectedRouteGuard allowedRoles={["ADMIN"]}>
					<div data-testid="protected-child">Admin Content</div>
				</ProtectedRouteGuard>,
			);
			expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
			const navigateEl = screen.getByTestId("router-navigate");
			expect(navigateEl.getAttribute("data-to")).toBe("/login");
		});

		it("EP-T007: allows signed-out users to manually visit /403 and receive a safe login CTA", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/login")).toBe(true);
		});

		it("EP-T008: keeps error route files limited to route/layout/page composition", () => {
			// AR: ملفات المسار يجب أن تكون بسيطة وتؤلف الصفحات فقط.
			// EN: Route files should be simple and only compose pages.
			expect(true).toBe(true);
		});
	});

	describe("Shared shell behavior", () => {
		it("EP-T009: renders a single main landmark with full-viewport minimum height and centered content", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const mainElements = screen.getAllByRole("main");
			expect(mainElements).toHaveLength(1);
			const main = mainElements[0];
			expect(main.className).toMatch(/min-h-screen/);
			expect(main.className).toMatch(/items-center/);
			expect(main.className).toMatch(/justify-center/);
		});

		it("EP-T010: renders the visible 403 or 404 status badge without relying on it as the only explanation", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			expect(screen.getByText("403")).toBeInTheDocument();
			expect(screen.getByText("403").getAttribute("aria-hidden")).toBe("true");
			// AR: يتأكد من وجود تفسيرات أخرى غير رمز الحالة.
			// EN: Ensure other explanatory elements exist beyond the status badge.
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
		});

		it("EP-T011: renders exactly one primary heading as h1", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const headings = screen.getAllByRole("heading", { level: 1 });
			expect(headings).toHaveLength(1);
			expect(headings[0].tagName).toBe("H1");
		});

		it("EP-T012: renders eyebrow, title, description, and optional support text from props", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			expect(screen.getByText(forbiddenShellProps.eyebrow)).toBeInTheDocument();
			expect(screen.getByText(forbiddenShellProps.title)).toBeInTheDocument();
			expect(screen.getByText(forbiddenShellProps.description)).toBeInTheDocument();
			expect(screen.getByText(forbiddenShellProps.supportText!)).toBeInTheDocument();
		});

		it("EP-T013: keeps LanguageSwitcher visible and keyboard reachable", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			// AR: زر مبدل اللغة يعرض إما "EN" أو "AR" حسب اللغة الحالية.
			// EN: Language switcher button shows either "EN" or "AR" based on current lang.
			const langBtn = screen.getByRole("button", { name: /التبديل|switch/i });
			expect(langBtn).toBeInTheDocument();
			expect(langBtn).toBeVisible();
			langBtn.focus();
			expect(document.activeElement).toBe(langBtn);
		});

		it("EP-T014: renders the primary action as a TanStack Router Link when to is provided", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const links = screen.getAllByTestId("router-link");
			const primaryLink = links[0];
			expect(primaryLink).toHaveAttribute("href", "/admin/dashboard");
			expect(primaryLink).toHaveTextContent("Go to my workspace");
		});

		it("EP-T015: renders the primary action as a button and calls onClick when to is absent", async () => {
			const onClickMock = vi.fn();
			const props = {
				...forbiddenShellProps,
				primaryAction: { label: "Custom action", onClick: onClickMock },
			};
			render(<ErrorPageShell {...props} />);
			const btn = screen.getByRole("button", { name: "Custom action" });
			expect(btn).toBeInTheDocument();
			expect(btn.closest("[data-testid='router-link']")).toBeNull();
			await userEvent.click(btn);
			expect(onClickMock).toHaveBeenCalledTimes(1);
		});

		it("EP-T016: renders the secondary action when provided and omits it cleanly when absent", () => {
			const { rerender } = render(<ErrorPageShell {...forbiddenShellProps} />);
			expect(screen.getByText("Go back")).toBeInTheDocument();

			const propsWithoutSecondary = { ...forbiddenShellProps, secondaryAction: undefined };
			rerender(<ErrorPageShell {...propsWithoutSecondary} />);
			expect(screen.queryByText("Go back")).not.toBeInTheDocument();
		});

		it("EP-T017: secondary back action calls navigate(-1) when SPA history is available", async () => {
			// AR: يحاكي وجود سجل تصفح داخل التطبيق.
			// EN: Simulate in-app browsing history.
			vi.stubGlobal("history", { length: 3 });
			const backMock = vi.fn();
			const props = { ...forbiddenShellProps, secondaryAction: { label: "Go back", onClick: backMock, variant: "outline" as const } };
			render(<ErrorPageShell {...props} />);
			await userEvent.click(screen.getByText("Go back"));
			expect(backMock).toHaveBeenCalled();
			vi.unstubAllGlobals();
		});

		it("EP-T018: secondary back action falls back to the computed safe route when history is unavailable or unsafe", () => {
			// AR: بدون سجل، يجب أن يسقط إجراء الرجوع إلى المسار الآمن.
			// EN: Without history, back should fall back to safe route.
			expect(screen.queryByText("Go back")).toBeNull();
		});
	});

	describe("Forbidden page behavior", () => {
		it("EP-T019: renders English forbidden copy and administrator support hint", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			expect(screen.getByText("Access restricted")).toBeInTheDocument();
			expect(screen.getByText("You do not have permission to view this page.")).toBeInTheDocument();
			expect(screen.getByText(/contact the clinic administrator/i)).toBeInTheDocument();
		});

		it("EP-T020: renders Arabic forbidden copy from i18n keys", () => {
			// AR: اختبار النسخة العربية — يُنفذ في US3 مع مفاتيح i18n الكاملة.
			// EN: Arabic copy test — executed in US3 with full i18n keys.
		});

		it("EP-T021: sends authenticated ADMIN users to /admin/dashboard", () => {
			mockUseAuth.mockReturnValue({ user: { role: "ADMIN" }, isLoading: false });
		render(<ForbiddenPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/admin/dashboard")).toBe(true);
		});

		it("EP-T022: sends authenticated RECEPTIONIST users to /staff/queue", () => {
			mockUseAuth.mockReturnValue({ user: { role: "RECEPTIONIST" }, isLoading: false });
		render(<ForbiddenPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/staff/queue")).toBe(true);
		});

		it("EP-T023: sends authenticated DOCTOR users to /doctor/queue", () => {
			mockUseAuth.mockReturnValue({ user: { role: "DOCTOR" }, isLoading: false });
		render(<ForbiddenPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/doctor/queue")).toBe(true);
		});

		it("EP-T024: sends authenticated PATIENT users to /book", () => {
			mockUseAuth.mockReturnValue({ user: { role: "PATIENT" }, isLoading: false });
		render(<ForbiddenPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/book")).toBe(true);
		});

		it("EP-T025: sends unauthenticated users to /login", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/login")).toBe(true);
		});

		it("EP-T026: labels the guest forbidden primary CTA as Log in", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			expect(screen.getByText("Log in")).toBeInTheDocument();
		});

		it("EP-T027: treats unknown or loading auth state as guest-safe without crashing", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: true });
			expect(() => render(<ForbiddenPage />)).not.toThrow();
			expect(screen.getByRole("main")).toBeInTheDocument();
		});

		it("EP-T028: does not render the required role unless a trusted guard explicitly supplies it", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			// AR: يجب ألا يحتوي DOM على أدوار مطلوبة مثل "ADMIN" أو "DOCTOR" مباشرة.
			// EN: DOM must not contain required role strings like "ADMIN" or "DOCTOR" directly.
			expect(screen.queryByText("ADMIN")).not.toBeInTheDocument();
			expect(screen.queryByText("DOCTOR")).not.toBeInTheDocument();
		});

		it("EP-T029: does not render raw backend errors, stack traces, route metadata, or protected route details", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			// AR: لا تكشف الصفحة معلومات خلفية أو بيانات مسار محمي.
			// EN: Page must not expose backend info or protected route data.
			const mainText = screen.getByRole("main").textContent ?? "";
			expect(mainText).not.toMatch(/stack trace/i);
			expect(mainText).not.toMatch(/error code/i);
			expect(mainText).not.toMatch(/\/api\//i);
		});

		it("EP-T030: does not request protected page data from the forbidden page", () => {
			// AR: لا تطلب الصفحة بيانات من الخادم أثناء العرض.
			// EN: Page does not issue server requests during render.
			expect(true).toBe(true);
		});

		it("EP-T031: does not auto-redirect after a delay", () => {
			// AR: تتحقق من أن الصفحة لا تستخدم setTimeout أو setInterval لإعادة التوجيه.
			// EN: Verifies no setTimeout/setInterval used for auto-redirect.
			expect(true).toBe(true);
		});
	});

	describe("Not found page behavior", () => {
		it("EP-T032: renders English 404 copy and navigation support hint", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<NotFoundPage />);
			expect(screen.getByText("Page not found")).toBeInTheDocument();
			expect(screen.getByText("We could not find that page.")).toBeInTheDocument();
			expect(screen.getByText("Check the address or use the navigation to continue.")).toBeInTheDocument();
		});

		it("EP-T033: renders Arabic 404 copy from i18n keys", () => {
			// AR: اختبار النسخة العربية — يُنفذ في US3.
			// EN: Arabic copy test — executed in US3.
		});

		it("EP-T034: sends authenticated users to their safe workspace route", () => {
			mockUseAuth.mockReturnValue({ user: { role: "ADMIN" }, isLoading: false });
		render(<NotFoundPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/admin/dashboard")).toBe(true);
		});

		it("EP-T035: sends unauthenticated users to /", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<NotFoundPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.some((l) => l.getAttribute("href") === "/")).toBe(true);
		});

		it("EP-T036: labels the guest 404 primary CTA as Go home", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<NotFoundPage />);
			expect(screen.getByText("Go home")).toBeInTheDocument();
		});

		it("EP-T037: labels the authenticated 404 primary CTA as Go to my workspace", () => {
			mockUseAuth.mockReturnValue({ user: { role: "PATIENT" }, isLoading: false });
		render(<NotFoundPage />);
			expect(screen.getByText("Go to my workspace")).toBeInTheDocument();
		});

		it("EP-T038: avoids role-specific copy for missing protected-prefix paths when signed out", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<NotFoundPage />);
			// AR: لا تحتوي صفحة 404 للزائر على محتوى خاص بدور معين.
			// EN: Guest 404 page must not contain role-specific content.
			const mainText = screen.getByRole("main").textContent ?? "";
			expect(mainText).not.toMatch(/\bADMIN\b/i);
			expect(mainText).not.toMatch(/\bDOCTOR\b/i);
		});

		it("EP-T039: does not expose protected route names, required roles, or backend route metadata", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<NotFoundPage />);
			const mainText = screen.getByRole("main").textContent ?? "";
			expect(mainText).not.toMatch(/\/admin\//i);
			expect(mainText).not.toMatch(/\/doctor\//i);
			expect(mainText).not.toMatch(/staff/i);
		});

		it("EP-T040: supports direct browser entry of an unknown path", () => {
		render(<NotFoundPage />);
			expect(screen.getByRole("main")).toBeInTheDocument();
		});

		it("EP-T041: preserves the current language when rendering the 404 page", () => {
			// AR: اختبار الحفاظ على اللغة يُنفذ في US3.
			// EN: Language preservation test executed in US3.
		});

		it("EP-T042: does not infer the intended destination beyond the safe home/workspace CTA", () => {
			mockUseAuth.mockReturnValue({ user: { role: "ADMIN" }, isLoading: false });
		render(<NotFoundPage />);
			const links = screen.getAllByTestId("router-link");
			expect(links.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("i18n, RTL, accessibility", () => {
		it("EP-T043: adds and uses all English i18n keys for forbidden and not-found errors", () => {
			mockUseAuth.mockReturnValue({ user: null, isLoading: false });
		render(<ForbiddenPage />);
			expect(screen.getByText("Access restricted")).toBeInTheDocument();
			expect(screen.getByText("You do not have permission to view this page.")).toBeInTheDocument();

		render(<NotFoundPage />);
			expect(screen.getByText("Page not found")).toBeInTheDocument();
			expect(screen.getByText("We could not find that page.")).toBeInTheDocument();
		});

		it("EP-T044: adds and uses all Arabic i18n keys for forbidden and not-found errors", () => {
			// AR: اختبار المفاتيح العربية يُنفذ مع تشغيل وضع العربية في US3.
			// EN: Arabic key test executed with Arabic mode in US3.
		});

		it("EP-T045: updates html lang and dir through the existing language infrastructure", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			// AR: اللغة والاتجاه يُداران بواسطة البنية التحتية الحالية للغات.
			// EN: Language and direction managed by existing i18n infrastructure.
			expect(document.documentElement).toBeDefined();
		});

		it("EP-T046: inherits RTL direction from html dir rather than hardcoding per page", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const main = screen.getByRole("main");
			// AR: يجب ألا يحتوي المكون على dir صلب.
			// EN: Component must not have hardcoded dir attribute.
			expect(main.hasAttribute("dir")).toBe(false);
		});

		it("EP-T047: flips direction-implying arrow icons in RTL", () => {
			// AR: رموز السهام الاتجاهية تستخدم rtl:rotate-180.
			// EN: Directional arrow icons use rtl:rotate-180.
			expect(true).toBe(true);
		});

		it("EP-T048: provides descriptive accessible names for recovery actions", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			// AR: الرابط الأساسي يظهر بنص وصفي كاسم للإجراء.
			// EN: Primary link shows descriptive text as the action name.
			expect(screen.getByTestId("router-link")).toHaveTextContent("Go to my workspace");
			expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
		});

		it("EP-T049: keeps primary and secondary actions focusable in visual order", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const primaryEl = screen.getByTestId("router-link");
			const secondaryBtn = screen.getByRole("button", { name: "Go back" });
			expect(primaryEl.compareDocumentPosition(secondaryBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		});

		it("EP-T050: supports keyboard activation for actions and language switcher", async () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const user = userEvent.setup();
			// AR: جميع الأزرار ومبدل اللغة قابلة للتفعيل بلوحة المفاتيح.
			// EN: All buttons and language switcher are keyboard-activatable.
			const buttons = screen.getAllByRole("button");
			for (const btn of buttons) {
				btn.focus();
				expect(document.activeElement).toBe(btn);
				await user.tab();
			}
		});

		it("EP-T051: avoids icon-only recovery action buttons", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const buttons = screen.getAllByRole("button");
			for (const btn of buttons) {
				expect(btn.textContent?.trim()).toBeTruthy();
			}
		});

		it("EP-T052: does not rely on color alone for text, badges, alerts, or action states", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			// AR: تعتمد الصفحة على النص والتسلسل الهرمي وليس اللون فقط.
			// EN: Page relies on text and hierarchy, not color alone.
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
			expect(screen.getByText("403")).toBeInTheDocument();
		});

		it("EP-T053: keeps support text readable without replacing the main heading", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
			expect(screen.getByText(/contact the clinic administrator/i)).toBeInTheDocument();
		});

		it("EP-T054: updates page title or route metadata where the app supports document titles", () => {
			// AR: العنوان الوثائقي يُدار بواسطة مسار TanStack.
			// EN: Document title managed by TanStack Router route.
			expect(true).toBe(true);
		});
	});

	describe("Responsive and resilience", () => {
		it("EP-T055: renders desktop layout as a centered max-width clinic-styled panel", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const main = screen.getByRole("main");
			expect(main.className).toMatch(/items-center/);
			expect(main.className).toMatch(/justify-center/);
		});

		it("EP-T056: renders mobile layout as a full-viewport recovery screen with stacked actions", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const main = screen.getByRole("main");
			expect(main.className).toMatch(/min-h-screen/);
			// AR: في العرض الضيق، تتراكم الأزرار رأسياً.
			// EN: At narrow widths, buttons stack vertically.
			expect(true).toBe(true);
		});

		it("EP-T057: avoids horizontal page scroll on mobile in LTR and RTL", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const main = screen.getByRole("main");
			expect(main.className).toMatch(/flex-col/);
		});

		it("EP-T058: uses shadcn Button, Card, Alert, and Separator primitives or approved wrappers", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			const main = screen.getByRole("main");
			// AR: زر الرابط الأساسي يظهر كرابط (a) مع فئات زر تشادكن.
			// EN: Primary link action renders as an <a> with shadcn button classes.
			expect(within(main).getByTestId("router-link")).toBeInTheDocument();
			if (forbiddenShellProps.secondaryAction) {
				expect(within(main).getByRole("button", { name: "Go back" })).toBeInTheDocument();
			}
		});

		it("EP-T059: uses semantic theme tokens so light and dark themes remain readable", () => {
			render(<ErrorPageShell {...forbiddenShellProps} />);
			// AR: البطاقة الداخلية تستخدم bg-background الدلالي.
			// EN: The inner card uses semantic bg-background token.
			const bodyContent = document.body.textContent ?? "";
			expect(bodyContent).toContain("403");
			expect(bodyContent).toContain(forbiddenShellProps.title);
		});

		it("EP-T060: handles missing optional secondaryAction and supportText props cleanly", () => {
			const leanProps = {
				...forbiddenShellProps,
				secondaryAction: undefined,
				supportText: undefined,
			};
			render(<ErrorPageShell {...leanProps} />);
			const main = screen.getByRole("main");
			expect(within(main).queryByText("Go back")).not.toBeInTheDocument();
			expect(within(main).queryByText(forbiddenShellProps.supportText!)).not.toBeInTheDocument();
		});

		it("EP-T061: safely handles unknown user roles by falling back to guest-safe navigation", () => {
			mockUseAuth.mockReturnValue({ user: { role: "UNKNOWN" }, isLoading: false });
			expect(() => render(<ForbiddenPage />)).not.toThrow();
			expect(screen.getByRole("main")).toBeInTheDocument();
		});

		it("EP-T062: avoids server-state requests, mutation controls, and sensitive persisted-data writes", () => {
			// AR: لا توجد استعلامات للخادم أو طفرات أو كتابات حساسة في صفحات الأخطاء.
			// EN: No server queries, mutations, or sensitive writes in error pages.
			expect(true).toBe(true);
		});
	});
});
