import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import type { AdminUserDTO } from "@/types";

interface DisableUserDialogProps {
	open: boolean;
	user?: AdminUserDTO;
	currentUserId?: string;
	isPending?: boolean;
	errorMessage?: string;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void> | void;
}

export function DisableUserDialog({ open, user, currentUserId, isPending, errorMessage, onOpenChange, onConfirm }: DisableUserDialogProps) {
	const { t } = useTranslation();
	const isSelf = Boolean(user && currentUserId === user.id);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("usersAdmin.disableDialog.title")}</AlertDialogTitle>
					<AlertDialogDescription>{user ? t("usersAdmin.disableDialog.description", { name: `${user.firstName} ${user.lastName}`, email: user.email }) : t("usersAdmin.disableDialog.fallback")}</AlertDialogDescription>
				</AlertDialogHeader>
				{errorMessage ? <Alert variant="destructive"><AlertTitle>{t("usersAdmin.errors.submitTitle")}</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
				<AlertDialogFooter>
					<AlertDialogCancel>{t("usersAdmin.actions.cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={(event) => { event.preventDefault(); void onConfirm(); }} disabled={isPending || isSelf}>{isPending ? t("usersAdmin.actions.disabling") : t("usersAdmin.actions.disable")}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
