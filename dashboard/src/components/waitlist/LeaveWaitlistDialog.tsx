import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface LeaveWaitlistDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isPending: boolean;
	error: string | null;
}

export function LeaveWaitlistDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
	error,
}: LeaveWaitlistDialogProps) {
	const { t } = useTranslation();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("waitlist.leaveTitle")}</DialogTitle>
					<DialogDescription>{t("waitlist.leaveDescription")}</DialogDescription>
				</DialogHeader>

				{error && (
					<Alert variant="destructive" role="alert">
						<AlertDescription>{t(error)}</AlertDescription>
					</Alert>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
						{t("waitlist.cancel")}
					</Button>
					<Button variant="destructive" onClick={onConfirm} disabled={isPending} aria-busy={isPending}>
						{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
						{t("waitlist.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
