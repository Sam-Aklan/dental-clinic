import { useTranslation } from "react-i18next";
import { Logo } from "@/components/shared/logo/Logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher/LanguageSwitcher";
import { useLiveClock } from "@/hooks/lobby-queue";
import { cn } from "@/lib/utils";

interface LobbyHeaderProps {
	doctorName: string;
	timeLabel?: string;
	className?: string;
}

export function LobbyHeader({ doctorName, timeLabel, className }: LobbyHeaderProps) {
	const { t } = useTranslation();
	const { now } = useLiveClock();

	return (
		<header className={cn("grid gap-4 border-b border-border px-4 py-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center", className)}>
			<Logo className="items-start sm:items-start" />
			<div className="grid gap-1 text-center lg:text-start">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("lobby.poweredBy")}</p>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{doctorName}</h1>
				<p className="text-sm text-muted-foreground">{timeLabel ?? now.format("h:mm:ss A")}</p>
			</div>
			<div className="flex items-center justify-center lg:justify-end">
				<LanguageSwitcher className="rounded-full border border-border bg-background px-4 py-2" />
			</div>
		</header>
	);
}
