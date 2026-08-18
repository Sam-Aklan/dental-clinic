import type { ReactNode } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface DeleteHolidayDialogProps {
	trigger: ReactNode;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isPending?: boolean;
}

export function DeleteHolidayDialog({ trigger, title, description, confirmLabel, cancelLabel, open, onOpenChange, onConfirm, isPending }: DeleteHolidayDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isPending}>{confirmLabel}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
