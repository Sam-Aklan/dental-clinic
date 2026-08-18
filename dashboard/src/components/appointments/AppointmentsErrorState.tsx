import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AppointmentsErrorStateProps {
	title: string;
	description: string;
	retryLabel: string;
	onRetry: () => void;
}

export function AppointmentsErrorState({ title, description, retryLabel, onRetry }: AppointmentsErrorStateProps) {
	return (
		<Alert role="alert" className="flex flex-col gap-4">
			<div>
				<AlertTitle>{title}</AlertTitle>
				<AlertDescription>{description}</AlertDescription>
			</div>
			<Button onClick={onRetry} className="self-start">
				{retryLabel}
			</Button>
		</Alert>
	);
}
