import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LobbyQueueEntry } from "@/types";
import { formatLobbyQueueTime } from "@/lib/lobby-queue";
import { cn } from "@/lib/utils";

interface NextUpCardProps {
	entry: LobbyQueueEntry | null;
}

export function NextUpCard({ entry }: NextUpCardProps) {
	const { t } = useTranslation();

	return (
		<Card className={cn("border-s-8 border-blue-500", !entry && "opacity-95")}>
			<CardHeader>
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("lobby.nextUp")}</p>
				<CardTitle className="text-2xl text-start sm:text-3xl">{entry ? t("lobby.patient", { number: entry.position }) : t("lobby.noUpcoming")}</CardTitle>
			</CardHeader>
			<CardContent aria-live="polite" className="text-start text-base text-muted-foreground">
				{entry ? t("lobby.scheduled", { time: formatLobbyQueueTime(entry.startsAt) }) : t("lobby.noUpcoming")}
			</CardContent>
		</Card>
	);
}
