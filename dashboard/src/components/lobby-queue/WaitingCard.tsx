import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LobbyQueueEntry } from "@/types";
import { formatLobbyQueueTime } from "@/lib/lobby-queue";
import { cn } from "@/lib/utils";

interface WaitingCardProps {
	entry: LobbyQueueEntry;
}

export function WaitingCard({ entry }: WaitingCardProps) {
	const { t } = useTranslation();
	const isPending = entry.status === "PENDING";

	return (
		<Card className={cn("border-border", isPending && "border-dashed opacity-80")}>
			<CardHeader className="gap-2">
				<div className="flex items-start justify-between gap-3">
					<div className="grid gap-1">
						<CardTitle className="text-lg text-start">{t("lobby.patient", { number: entry.position })}</CardTitle>
						<p className="text-sm text-muted-foreground">{t("lobby.scheduled", { time: formatLobbyQueueTime(entry.startsAt) })}</p>
					</div>
					<Badge variant={isPending ? "secondary" : "default"}>{t(`queue.status.${entry.status}`)}</Badge>
				</div>
			</CardHeader>
			<CardContent aria-live="polite" className="sr-only">{t("lobby.patient", { number: entry.position })}</CardContent>
		</Card>
	);
}
