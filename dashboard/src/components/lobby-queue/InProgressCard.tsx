import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LobbyQueueEntry } from "@/types";
import { formatLobbyQueueTime } from "@/lib/lobby-queue";
import { cn } from "@/lib/utils";

interface InProgressCardProps {
	entry: LobbyQueueEntry | null;
}

export function InProgressCard({ entry }: InProgressCardProps) {
	const { t } = useTranslation();

	return (
		<Card className={cn("border-s-8 border-green-500", !entry && "opacity-95")}>
			<CardHeader>
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("lobby.nowInProgress")}</p>
				<CardTitle className="text-3xl text-start sm:text-4xl">{entry ? t("lobby.patient", { number: entry.position }) : t("lobby.noPatientInSession")}</CardTitle>
			</CardHeader>
			<CardContent aria-live="polite" className="text-start text-lg text-muted-foreground">
				{entry ? t("lobby.started", { time: formatLobbyQueueTime(entry.startsAt) }) : t("lobby.noPatientInSession")}
			</CardContent>
		</Card>
	);
}
