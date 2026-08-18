import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

interface QueueEmptyStateProps {
	title: string;
	description: string;
}

export function QueueEmptyState({ title, description }: QueueEmptyStateProps) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			<EmptyContent />
		</Empty>
	);
}
