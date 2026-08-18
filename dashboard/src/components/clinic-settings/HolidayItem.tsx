import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HolidayClosureDTO } from "@/types";
import { useState } from "react";
import { DeleteHolidayDialog } from "./DeleteHolidayDialog";

interface HolidayItemProps {
	holiday: HolidayClosureDTO;
	dateLabel: string;
	onDelete: () => void;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel: string;
	deleteLabel: string;
	isPending?: boolean;
}

export function HolidayItem({ holiday, dateLabel, onDelete, title, description, confirmLabel, cancelLabel, deleteLabel, isPending }: HolidayItemProps) {
	const [open, setOpen] = useState(false);
	return (
			<div className="flex items-center justify-between gap-3 rounded-lg border p-4">
				<div className="grid gap-1">
					<p className="font-medium">{holiday.name}</p>
					<p className="text-sm text-muted-foreground">{dateLabel}</p>
				</div>
				<DeleteHolidayDialog
					trigger={
						<Button variant="ghost" size="icon" aria-label={deleteLabel}>
							<Trash2 className="size-4" />
						</Button>
					}
					open={open}
					onOpenChange={setOpen}
					title={title}
					description={description}
					confirmLabel={confirmLabel}
					cancelLabel={cancelLabel}
					onConfirm={onDelete}
					isPending={isPending}
				/>
			</div>
	);
}
