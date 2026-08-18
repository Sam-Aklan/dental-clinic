import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
	return (
		<div className={cn("flex flex-col items-center gap-2", className)}>
			<img
				className="size-16"
				src="/logo.png"
				alt="Clinic Logo"
			/>
			<h1 className="text-xl font-bold text-foreground">
				Smile Clinic
			</h1>
		</div>
	);
}
