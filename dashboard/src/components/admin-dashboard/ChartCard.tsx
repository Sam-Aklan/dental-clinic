import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
	title: string;
	description?: string;
	isLoading?: boolean;
	isError?: boolean;
	errorLabel?: string;
	retryLabel?: string;
	onRetry?: () => void;
	summary?: ReactNode;
	children: ReactNode;
}

export function ChartCard({ title, description, isLoading, isError, errorLabel, retryLabel, onRetry, summary, children }: ChartCardProps) {
	return (
		<Card className="h-full">
			<CardHeader className="space-y-1">
				<CardTitle className="text-base font-semibold">{title}</CardTitle>
				{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
			</CardHeader>
			<CardContent className="space-y-4">
				{isLoading ? <div className="h-48 animate-pulse rounded-md bg-muted" /> : null}
				{!isLoading && isError ? (
					<div className="flex flex-col gap-3 rounded-md border border-dashed border-border p-4">
						<p className="text-sm text-destructive">{errorLabel}</p>
						{onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button> : null}
					</div>
				) : null}
				{!isLoading && !isError ? children : null}
				{summary ? <div className="sr-only">{summary}</div> : null}
			</CardContent>
		</Card>
	);
}
