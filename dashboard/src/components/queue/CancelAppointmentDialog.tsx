import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelReasonSchema } from "@/lib/queue";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CancelAppointmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (values: { reason?: string }) => void;
	isPending?: boolean;
	error?: string | null;
	reasonRequired?: boolean;
	title: string;
	description: string;
	confirmLabel: string;
}

export function CancelAppointmentDialog({ open, onOpenChange, onConfirm, isPending, error, reasonRequired = true, title, description, confirmLabel }: CancelAppointmentDialogProps) {
	const schema = useMemo(() => (reasonRequired ? cancelReasonSchema : cancelReasonSchema.partial()), [reasonRequired]);
	const form = useForm<{ reason?: string }>({
		resolver: zodResolver(schema as never),
		defaultValues: { reason: "" },
	});

	useEffect(() => {
		if (!open) form.reset({ reason: "" });
	}, [form, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<form onSubmit={form.handleSubmit((values) => onConfirm(values))} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="reason">Reason</Label>
						<Textarea id="reason" {...form.register("reason")} />
						{form.formState.errors.reason && <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>}
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
						<Button type="submit" disabled={isPending}>{confirmLabel}</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
