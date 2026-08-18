import { LoadingSpinner } from "@/components/shared/loading/LoadingSpinner";

interface FullScreenSpinnerProps {
	label: string;
}

export function FullScreenSpinner({ label }: FullScreenSpinnerProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<LoadingSpinner variant="page" label={label} />
		</div>
	);
}
