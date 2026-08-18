import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

interface AppointmentsEmptyStateProps {
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}

export function AppointmentsEmptyState({ title, description, actionLabel, onAction }: AppointmentsEmptyStateProps) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle>{title}</EmptyTitle>
			</EmptyHeader>
			<EmptyContent>
				<EmptyDescription>{description}</EmptyDescription>
				{actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
			</EmptyContent>
		</Empty>
	);
}
