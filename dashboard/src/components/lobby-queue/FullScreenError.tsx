import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FullScreenErrorProps {
	title: string;
	description: string;
	onRetry?: () => void;
}

export function FullScreenError({ title, description, onRetry }: FullScreenErrorProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<Card role="alert" className="w-full max-w-lg border-destructive/30">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<p className="text-sm text-muted-foreground">{description}</p>
					{onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
				</CardContent>
			</Card>
		</div>
	);
}
