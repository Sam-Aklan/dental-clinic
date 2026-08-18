import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaitlistOfferPageSection } from "@/components/waitlist";
import { renderWithOfferProviders, setLanguage } from "@/test/waitlist-offer/test-utils";
import { waitlistOfferFixtures } from "@/test/waitlist-offer/fixtures";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

let currentOfferId = "offer-1";

vi.mock("@tanstack/react-router", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@tanstack/react-router")>();
	return {
		...actual,
		Link: ({ children, to, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode; to?: string }) => <a href={to} {...props}>{children}</a>,
		useParams: () => ({ _splat: currentOfferId }),
	};
});

import { api } from "@/lib/axios-instance";

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

beforeEach(() => {
	vi.clearAllMocks();
	currentOfferId = "offer-1";
	setLanguage("en");
});

function mockPendingOffer(offer = waitlistOfferFixtures.pending) {
	mockedGet.mockImplementation((url: string) => {
		if (url === `/waitlist/offers/${encodeURIComponent(currentOfferId)}`) {
			return Promise.resolve({ data: { data: offer, statusCode: 200 } });
		}
		return Promise.reject(new Error(`Unknown GET ${url}`));
	});
}

function mockOfferSequence(initial = waitlistOfferFixtures.pending, next = waitlistOfferFixtures.accepted) {
	const responses = [initial, next];
	mockedGet.mockImplementation((url: string) => {
		if (url === `/waitlist/offers/${encodeURIComponent(currentOfferId)}`) {
			return Promise.resolve({ data: { data: responses.shift() ?? next, statusCode: 200 } });
		}
		return Promise.reject(new Error(`Unknown GET ${url}`));
	});
}

describe("WaitlistOfferPageSection specifications", () => {
	it("OFFER-T001: renders pending offer details, countdown, and actions", async () => {
		mockPendingOffer();
		renderWithOfferProviders(<WaitlistOfferPageSection />);

		expect(await screen.findByTestId("offer-pending-state")).toBeDefined();
		expect(screen.getByText("Ahmad Al-Rashid")).toBeDefined();
		expect(screen.getByText("General Dentistry")).toBeDefined();
		expect(screen.getByText("Your Current Appointment")).toBeDefined();
		expect(screen.getByText("Comparison")).toBeDefined();
		expect(screen.getByTestId("offer-countdown")).toBeDefined();
		expect(screen.getByRole("button", { name: "Accept Offer" })).toBeDefined();
		expect(screen.getByRole("button", { name: "Decline" })).toBeDefined();
	});

	it("OFFER-T002: accepts an offer and transitions to the accepted terminal state", async () => {
		mockOfferSequence(waitlistOfferFixtures.pending, waitlistOfferFixtures.accepted);
		mockedPost.mockResolvedValueOnce({ data: { data: waitlistOfferFixtures.accepted, statusCode: 200 } });

		renderWithOfferProviders(<WaitlistOfferPageSection />);

		await screen.findByTestId("offer-pending-state");
		await userEvent.click(screen.getByTestId("accept-offer-button"));

		const dialog = await screen.findByRole("alertdialog");
		await userEvent.click(within(dialog).getByRole("button", { name: "Accept Offer" }));

		await screen.findByTestId("offer-accepted-state");
		expect(mockedPost).toHaveBeenCalledWith("/waitlist/offers/offer-1/accept");
		expect(screen.getByText("Offer Accepted")).toBeDefined();
		expect(screen.getByRole("link", { name: "View My Appointments" })).toBeDefined();
	});

	it("OFFER-T003: declines an offer and transitions to the declined terminal state", async () => {
		mockOfferSequence(waitlistOfferFixtures.pending, waitlistOfferFixtures.declined);
		mockedPost.mockResolvedValueOnce({ data: { data: waitlistOfferFixtures.declined, statusCode: 200 } });

		renderWithOfferProviders(<WaitlistOfferPageSection />);

		await screen.findByTestId("offer-pending-state");
		await userEvent.click(screen.getByTestId("decline-offer-button"));

		const dialog = await screen.findByRole("alertdialog");
		await userEvent.click(within(dialog).getByRole("button", { name: "Decline" }));

		await screen.findByTestId("offer-declined-state");
		expect(mockedPost).toHaveBeenCalledWith("/waitlist/offers/offer-1/decline");
		expect(screen.getByText("Offer Declined")).toBeDefined();
		expect(screen.getByRole("link", { name: "Back to Waitlist" })).toBeDefined();
	});

	it("OFFER-T004: shows the expired state when the offer is expired", async () => {
		mockPendingOffer(waitlistOfferFixtures.expired);
		renderWithOfferProviders(<WaitlistOfferPageSection />);

		expect(await screen.findByTestId("offer-expired-state")).toBeDefined();
		expect(screen.getByText("This offer has expired.")).toBeDefined();
	});

	it("OFFER-T005: shows the not-found state for missing offers", async () => {
		mockedGet.mockRejectedValueOnce({ status: 404, response: { data: { message: "Not Found" } } });
		renderWithOfferProviders(<WaitlistOfferPageSection />);
		expect(await screen.findByTestId("offer-not-found")).toBeDefined();
	});

	it("OFFER-T006: shows the forbidden state for unauthorized offers", async () => {
		mockedGet.mockRejectedValueOnce({ status: 403, response: { data: { message: "Forbidden" } } });
		renderWithOfferProviders(<WaitlistOfferPageSection />);
		expect(await screen.findByTestId("offer-forbidden")).toBeDefined();
	});

	it("OFFER-T007: explains slot unavailable conflicts after accepting", async () => {
		mockPendingOffer();
		mockedPost.mockRejectedValueOnce({ status: 409, response: { data: { message: "Slot unavailable", code: "SLOT_UNAVAILABLE" } } });

		renderWithOfferProviders(<WaitlistOfferPageSection />);

		await screen.findByTestId("offer-pending-state");
		await userEvent.click(screen.getByTestId("accept-offer-button"));

		const dialog = await screen.findByRole("alertdialog");
		await userEvent.click(within(dialog).getByRole("button", { name: "Accept Offer" }));

		expect(await screen.findByText("This slot is no longer available.")).toBeDefined();
		expect(screen.getByTestId("offer-action-error")).toBeDefined();
	});

	it("OFFER-T008: ignores duplicate accept clicks while the first accept is pending", async () => {
		mockPendingOffer();
		let resolveAccept: ((value: unknown) => void) | null = null;
		mockedPost.mockImplementation((url: string) => {
			if (url === "/waitlist/offers/offer-1/accept") {
				return new Promise((resolve) => {
					resolveAccept = resolve;
				});
			}
			return Promise.reject(new Error(`Unknown POST ${url}`));
		});

		renderWithOfferProviders(<WaitlistOfferPageSection />);

		await screen.findByTestId("offer-pending-state");
		await userEvent.click(screen.getByTestId("accept-offer-button"));
		const dialog = await screen.findByRole("alertdialog");
		const confirm = within(dialog).getByRole("button", { name: "Accept Offer" });
		await userEvent.dblClick(confirm);

		expect(mockedPost).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolveAccept?.({ data: { data: waitlistOfferFixtures.accepted, statusCode: 200 } });
		});
	});

	it("captures wildcard offer ids without truncating slash-separated tokens", async () => {
		currentOfferId = "offer/token-1";
		mockPendingOffer(createOfferWithId("offer/token-1"));

		renderWithOfferProviders(<WaitlistOfferPageSection />);

		expect(await screen.findByTestId("offer-pending-state")).toBeDefined();
		expect(mockedGet).toHaveBeenCalledWith("/waitlist/offers/offer%2Ftoken-1");
	});

	it("encodes slash-separated offer ids for accept actions", async () => {
		currentOfferId = "offer/token-1";
		mockOfferSequence(createOfferWithId("offer/token-1"), { ...waitlistOfferFixtures.accepted, id: "offer/token-1" });
		mockedPost.mockResolvedValueOnce({ data: { data: { ...waitlistOfferFixtures.accepted, id: "offer/token-1" }, statusCode: 200 } });

		renderWithOfferProviders(<WaitlistOfferPageSection />);

		await screen.findByTestId("offer-pending-state");
		await userEvent.click(screen.getByTestId("accept-offer-button"));

		const dialog = await screen.findByRole("alertdialog");
		await userEvent.click(within(dialog).getByRole("button", { name: "Accept Offer" }));

		expect(mockedPost).toHaveBeenCalledWith("/waitlist/offers/offer%2Ftoken-1/accept");
	});
});

function createOfferWithId(id: string) {
	return { ...waitlistOfferFixtures.pending, id };
}
