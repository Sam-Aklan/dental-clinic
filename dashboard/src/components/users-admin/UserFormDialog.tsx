import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import type { AdminUserDTO } from "@/types";
import { UserForm } from "./UserForm";

interface UserFormDialogProps {
	open: boolean;
	mode: "create" | "edit";
	user?: AdminUserDTO;
	currentUserId?: string;
	isPending?: boolean;
	errorMessage?: string;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: any) => Promise<void> | void;
}

export function UserFormDialog({ open, mode, user, currentUserId, isPending, errorMessage, onOpenChange, onSubmit }: UserFormDialogProps) {
	const { t, i18n } = useTranslation();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl" isRtl={i18n.language === "ar"?true:false}>
				<DialogHeader>
					<DialogTitle>{mode === "create" ? t("usersAdmin.dialog.createTitle") : t("usersAdmin.dialog.editTitle")}</DialogTitle>
					<DialogDescription>{mode === "create" ? t("usersAdmin.dialog.createDescription") : t("usersAdmin.dialog.editDescription")}</DialogDescription>
				</DialogHeader>
				<UserForm mode={mode} user={user} currentUserId={currentUserId} isPending={isPending} errorMessage={errorMessage} onSubmit={onSubmit} />
			</DialogContent>
		</Dialog>
	);
}
