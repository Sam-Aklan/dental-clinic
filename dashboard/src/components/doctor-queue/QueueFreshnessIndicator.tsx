import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SocketConnectionState } from "@/types";
import { useTranslation } from "react-i18next";

dayjs.extend(relativeTime);

interface QueueFreshnessIndicatorProps {
	lastUpdatedAt?: string | null;
	connectionState: SocketConnectionState;
	onRefresh: () => void;
}

export function QueueFreshnessIndicator({ lastUpdatedAt, connectionState, onRefresh }: QueueFreshnessIndicatorProps) {
	const [now, setNow] = useState(() => dayjs());
	const { t } = useTranslation();

	useEffect(() => {
		const timer = window.setInterval(() => setNow(dayjs()), 10_000);
		return () => window.clearInterval(timer);
	}, []);

	if (connectionState === "connected" && !lastUpdatedAt) return null;

	return (
		<div role="status" aria-live="polite" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
			{lastUpdatedAt ? <span>{t("queue.freshness.updated", { when: dayjs(lastUpdatedAt).from(now) })}</span> : <span>{t("queue.freshness.waiting")}</span>}
			{connectionState !== "connected" ? <Badge variant="secondary">{t(`queue.connection.${connectionState}`)}</Badge> : null}
			<Button type="button" size="sm" variant="ghost" onClick={onRefresh}>{t("queue.actions.refresh")}</Button>
		</div>
	);
}
