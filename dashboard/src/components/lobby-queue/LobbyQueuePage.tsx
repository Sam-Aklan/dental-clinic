import { useTranslation } from "react-i18next";
import { ConnectionBanner } from "./ConnectionBanner";
import { FullScreenError } from "./FullScreenError";
import { FullScreenSpinner } from "./FullScreenSpinner";
import { LobbyFooter } from "./LobbyFooter";
import { LobbyHeader } from "./LobbyHeader";
import { InProgressCard } from "./InProgressCard";
import { NextUpCard } from "./NextUpCard";
import { WaitingGrid } from "./WaitingGrid";
import { useLobbyQueue } from "@/hooks/lobby-queue";
import type { ConnectionState, LobbyQueueError, LobbyQueueSections } from "@/types";
import { useLiveClock } from "@/hooks/lobby-queue";

interface LobbyQueuePageProps {
	doctorId?: string;
	kioskToken?: string | null;
}

interface LobbyQueuePageViewProps {
	doctorName: string;
	timeLabel: string;
	loading: boolean;
	error: LobbyQueueError | null;
	connectionState: ConnectionState;
	sections: LobbyQueueSections;
	lastUpdated: Date | null;
	dir: "ltr" | "rtl";
}

export function LobbyQueuePageView({ doctorName, timeLabel, loading, error, connectionState, sections, lastUpdated, dir }: LobbyQueuePageViewProps) {
	const { t } = useTranslation();

	if (loading) {
		return <FullScreenSpinner label={t("lobby.loading")} />;
	}

	if (error) {
		return (
			<FullScreenError
				title={error.status === 404 ? t("lobby.doctorNotFound") : error.status === 401 ? t("lobby.invalidLink") : t("lobby.unexpectedError")}
				description={error.status === 404 ? t("lobby.doctorNotFound") : error.status === 401 ? t("lobby.invalidLinkDescription") : t("lobby.unexpectedError")}
			/>
		);
	}

	return (
		<div dir={dir} className="flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
			<LobbyHeader doctorName={doctorName} timeLabel={timeLabel} />
			<ConnectionBanner visible={connectionState === "offline" || connectionState === "reconnecting"} label={t("lobby.connectionLost")} />
			<main className="grid flex-1 min-h-0 gap-4 overflow-hidden px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
				<div className="grid min-h-0 gap-4">
					<InProgressCard entry={sections.inProgress} />
					<NextUpCard entry={sections.nextUp} />
				</div>
				<WaitingGrid items={sections.visibleWaiting} overflow={sections.waitingOverflow} />
			</main>
			<LobbyFooter lastUpdated={lastUpdated} />
		</div>
	);
}

export function LobbyQueuePage({ doctorId: doctorIdProp, kioskToken: providedToken = null }: LobbyQueuePageProps = {}) {
	const doctorId = doctorIdProp ?? "";
	const { i18n } = useTranslation();
	const queue = useLobbyQueue(doctorId, providedToken);
	const { now } = useLiveClock();
	const missingTokenError = !providedToken
		? {
			message: "Lobby link is invalid",
			status: 401,
		}
		: null;

	return (
		<LobbyQueuePageView
			doctorName={queue.doctorDisplay?.displayName ?? doctorId}
			timeLabel={now.format("h:mm:ss A")}
			loading={providedToken ? queue.connectionState === "connecting" && !queue.lastUpdated && !queue.error : false}
			error={missingTokenError ?? queue.error}
			connectionState={queue.connectionState}
			sections={queue.sections}
			lastUpdated={queue.lastUpdated}
			dir={i18n.dir() as "ltr" | "rtl"}
		/>
	);
}
