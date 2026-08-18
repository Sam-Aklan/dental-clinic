import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AppointmentCardSkeleton() {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="gap-3">
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-4 w-28" />
			</CardHeader>
			<CardContent className="grid gap-3">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<Skeleton className="h-9 w-32" />
			</CardContent>
		</Card>
	);
}
