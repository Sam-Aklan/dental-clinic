import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LobbyQueueEntry } from "@/types";
import { WaitingCard } from "./WaitingCard";

interface WaitingGridProps {
	items: LobbyQueueEntry[];
	overflow: number;
}

export function WaitingGrid({ items, overflow }: WaitingGridProps) {
	const { t } = useTranslation();

	return (
		<section aria-live="polite" className="grid gap-4">
			<div className="flex items-end justify-between gap-3">
				<h2 className="text-2xl font-semibold text-start">{t("lobby.waiting")}</h2>
				{overflow > 0 ? <p className="text-sm text-muted-foreground">{t("lobby.morePatients", { count: overflow })}</p> : null}
			</div>
			{items.length ? (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
					{items.map((item) => <WaitingCard key={item.appointmentId} entry={item} />)}
				</div>
			) : (
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">{t("lobby.noWaiting")}</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">{t("lobby.noWaiting")}</CardContent>
				</Card>
			)}
		</section>
	);
}
