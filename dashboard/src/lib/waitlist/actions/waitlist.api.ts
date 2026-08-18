import { api } from "@/lib/axios-instance";
import { WAITLIST, waitlistOfferAcceptPath, waitlistOfferDeclinePath, waitlistOfferPath } from "@/lib/api-paths";
import type { WaitlistEntryDTO, JoinWaitlistDTO, UpdateWaitlistWindowDTO, WaitlistOfferDTO } from "@/types";

export async function getMyWaitlist(): Promise<WaitlistEntryDTO[]> {
	const response = await api.get<{ data: { items: WaitlistEntryDTO[] }; statusCode: number }>(WAITLIST);
	return response.data.data.items;
}

export async function joinWaitlist(payload: JoinWaitlistDTO): Promise<WaitlistEntryDTO> {
	const response = await api.post<{ data: WaitlistEntryDTO; statusCode: number }>(WAITLIST, payload);
	return response.data.data;
}

export async function updateWaitlistWindow(
	id: string,
	payload: UpdateWaitlistWindowDTO,
): Promise<WaitlistEntryDTO> {
	const response = await api.patch<{ data: WaitlistEntryDTO; statusCode: number }>(
		`${WAITLIST}/${id}`,
		payload,
	);
	return response.data.data;
}

export async function leaveWaitlist(id: string): Promise<void> {
  await api.delete(`${WAITLIST}/${id}`);
}

export async function getWaitlistOffer(offerId: string): Promise<WaitlistOfferDTO> {
  const response = await api.get<{ data: WaitlistOfferDTO; statusCode: number }>(
		waitlistOfferPath(offerId),
  );
  return response.data.data;
}

export async function acceptWaitlistOffer(offerId: string): Promise<WaitlistOfferDTO> {
  const response = await api.post<{ data: WaitlistOfferDTO; statusCode: number }>(
		waitlistOfferAcceptPath(offerId),
  );
  return response.data.data;
}

export async function declineWaitlistOffer(offerId: string): Promise<WaitlistOfferDTO> {
  const response = await api.post<{ data: WaitlistOfferDTO; statusCode: number }>(
		waitlistOfferDeclinePath(offerId),
  );
  return response.data.data;
}
