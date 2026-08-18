import { Skeleton } from "@/components/ui/skeleton";

export function QueueSkeleton() {
	return (
		<div className="grid gap-4">
			{Array.from({ length: 3 }).map((_, index) => (
				<div key={index} className="rounded-lg border p-4">
					<Skeleton className="h-5 w-40" />
					<div className="mt-4 grid gap-3">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				</div>
			))}
		</div>
	);
}
