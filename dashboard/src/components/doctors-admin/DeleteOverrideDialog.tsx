import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type DeleteOverrideDialogProps = {
	triggerLabel?: string;
	title?: string;
	description?: string;
	isPending?: boolean;
	onConfirm: () => void | Promise<void>;
};

export function DeleteOverrideDialog({ triggerLabel = "Delete", title = "Delete override?", description = "This will remove the selected schedule override.", isPending = false, onConfirm }: DeleteOverrideDialogProps) {
	const { t } = useTranslation();
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" size="sm">{triggerLabel === "Delete" ? t("doctorsAdmin.actions.delete") : triggerLabel}</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title === "Delete override?" ? t("doctorsAdmin.deleteDialog.title") : title}</AlertDialogTitle>
					<AlertDialogDescription>{description === "This will remove the selected schedule override." ? t("doctorsAdmin.deleteDialog.description") : description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("doctorsAdmin.actions.cancel")}</AlertDialogCancel>
					<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
						{isPending ? t("doctorsAdmin.actions.deleting") : t("doctorsAdmin.actions.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
