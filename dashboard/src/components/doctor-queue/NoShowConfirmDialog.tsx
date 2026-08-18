import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface NoShowConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function NoShowConfirmDialog({ open, onOpenChange, onConfirm }: NoShowConfirmDialogProps) {
	const { t } = useTranslation();
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("queue.dialog.noShow.title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("queue.dialog.noShow.description")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("queue.actions.cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>{t("queue.actions.confirm")}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
