import { Badge } from "@/components/ui/badge";
import type { ConnectionStatus } from "@/types";

interface ReconnectingBadgeProps {
	connectionStatus: ConnectionStatus;
	label: string;
}

export function ReconnectingBadge({ connectionStatus, label }: ReconnectingBadgeProps) {
	if (connectionStatus === "connected") return null;

	return <Badge variant={connectionStatus === "offline" ? "destructive" : "secondary"} aria-live="polite">{label}</Badge>;
}
