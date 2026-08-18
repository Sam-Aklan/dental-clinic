import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DoctorProfileForm } from "./DoctorProfileForm";
import { createDoctorPayload, normalizeApiError, type DoctorProfileFormValues } from "@/lib/doctors-admin";
import { useCreateDoctor } from "@/hooks/doctors-admin";

export function CreateDoctorDialog() {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const mutation = useCreateDoctor();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>{t("doctorsAdmin.actions.createDoctor")}</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("doctorsAdmin.createDialog.title")}</DialogTitle>
					<DialogDescription>{t("doctorsAdmin.createDialog.description")}</DialogDescription>
				</DialogHeader>
				<DoctorProfileForm
					mode="create"
					submitLabel={t("doctorsAdmin.actions.create")}
					isPending={mutation.isPending}
					errorMessage={errorMessage}
					onCancel={() => setOpen(false)}
					onSubmit={async (values: DoctorProfileFormValues) => {
						setErrorMessage(null);
						try {
							await mutation.mutateAsync(createDoctorPayload(values));
							setOpen(false);
						} catch (error) {
							setErrorMessage(normalizeApiError(error) || t("doctorsAdmin.errors.createFailed"));
						}
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}
