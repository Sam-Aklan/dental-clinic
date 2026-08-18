import { Badge } from "@/components/ui/badge";

interface ConnectionBannerProps {
	visible: boolean;
	label: string;
}

export function ConnectionBanner({ visible, label }: ConnectionBannerProps) {
	if (!visible) return null;

	return (
		<div role="alert" className="flex items-center justify-center border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
			<Badge variant="secondary" className="border-amber-200 bg-amber-100 text-amber-950">
				{label}
			</Badge>
		</div>
	);
}
