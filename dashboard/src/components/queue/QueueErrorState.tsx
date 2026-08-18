import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueueErrorStateProps {
	message: string;
	onRetry: () => void;
}

export function QueueErrorState({ message, onRetry }: QueueErrorStateProps) {
	return (
		<Card className="border-destructive/30">
			<CardHeader>
				<CardTitle>{message}</CardTitle>
			</CardHeader>
			<CardContent>
				<Button onClick={onRetry}>Retry</Button>
			</CardContent>
		</Card>
	);
}
