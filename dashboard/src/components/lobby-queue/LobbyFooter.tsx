import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatLobbyUpdatedAt } from "@/lib/lobby-queue";

interface LobbyFooterProps {
	lastUpdated: Date | null;
	className?: string;
}

export function LobbyFooter({ lastUpdated, className }: LobbyFooterProps) {
	const { t } = useTranslation();

	return (
		<footer className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:px-6", className)}>
			<p>{lastUpdated ? t("lobby.lastUpdated", { time: formatLobbyUpdatedAt(lastUpdated) }) : t("lobby.lastUpdated", { time: "—" })}</p>
			<p>{t("lobby.poweredBy")}</p>
		</footer>
	);
}
