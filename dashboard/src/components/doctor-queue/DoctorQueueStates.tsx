import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function DoctorQueueSkeleton() {
	return <div className="grid gap-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>;
}

interface DoctorQueueErrorStateProps {
	message: string;
	onRetry: () => void;
}

export function DoctorQueueErrorState({ message, onRetry }: DoctorQueueErrorStateProps) {
	return (
		<div className="grid gap-3 rounded-lg border border-border p-6">
			<p className="text-sm text-muted-foreground">{message}</p>
			<Button type="button" onClick={onRetry}>Retry</Button>
		</div>
	);
}

export function DoctorQueueEmptyState({ title, description }: { title: string; description: string }) {
	return (
		<div className="grid gap-2 rounded-lg border border-dashed border-border p-6 text-center">
			<p className="font-medium">{title}</p>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
	);
}
