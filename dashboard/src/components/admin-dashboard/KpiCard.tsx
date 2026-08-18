import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
	label: string;
	value: string;
	deltaLabel: string;
	description?: string;
	className?: string;
}

export function KpiCard({ label, value, deltaLabel, description, className }: KpiCardProps) {
	return (
		<Card className={cn("h-full", className)}>
			<CardHeader className="space-y-1 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="text-2xl font-semibold tracking-tight">{value}</div>
				<p className="text-xs text-muted-foreground">{deltaLabel}</p>
				{description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
			</CardContent>
		</Card>
	);
}
