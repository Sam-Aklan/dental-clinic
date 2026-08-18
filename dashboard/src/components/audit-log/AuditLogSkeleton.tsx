import { Skeleton } from "@/components/ui/skeleton";

export function AuditLogSkeleton() {
	return (
		<div className="space-y-3 p-4">
			{Array.from({ length: 5 }).map((_, index) => (
				<div key={index} className="grid grid-cols-6 gap-3">
					{Array.from({ length: 6 }).map((__, cellIndex) => <Skeleton key={cellIndex} className="h-6 w-full" />)}
				</div>
			))}
		</div>
	);
}
