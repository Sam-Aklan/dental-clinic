import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, LogOut } from "lucide-react";
import type { WaitlistEntryDTO } from "@/types";
import { formatDoctorName, formatPosition, formatAvailability, formatJoinedDate } from "@/lib/waitlist";
import { ROUTE_OFFER } from "@/constants/routes";

interface WaitlistEntryCardProps {
	entry: WaitlistEntryDTO;
	onEdit: (entryId: string) => void;
	onLeave: (entryId: string) => void;
}

export function WaitlistEntryCard({ entry, onEdit, onLeave }: WaitlistEntryCardProps) {
	const { t } = useTranslation();

	return (
		<Card>
			<CardContent className="flex flex-col gap-3 p-4">
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-col gap-1 min-w-0">
						<h3 className="font-semibold text-foreground truncate">
							{formatDoctorName(entry)}
						</h3>
						{entry.doctor.specialization && (
							<p className="text-sm text-muted-foreground">{entry.doctor.specialization}</p>
						)}
					</div>
					<div className="flex shrink-0 gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onEdit(entry.id)}
							aria-label={t("waitlist.edit")}
						>
							<Pencil className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onLeave(entry.id)}
							aria-label={t("waitlist.leave")}
						>
							<LogOut className="size-4" />
						</Button>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 text-sm">
					{formatPosition(entry.position) && (
						<Badge variant="secondary">
							{t("waitlist.position", { position: entry.position })}
						</Badge>
					)}
					<Badge variant="outline">
						{t(formatAvailability(entry.availableFrom, entry.availableUntil))}
					</Badge>
					{entry.pendingOffer && (
						<Badge variant="secondary" className="gap-2">
							<span>{t("waitlist.offerAvailable")}</span>
							<Link
								to={ROUTE_OFFER}
								params={{ _splat: encodeURIComponent(entry.pendingOffer.id) }}
								aria-label={`${t("waitlist.offerAvailable")} ${t("waitlist.viewOffer")}`}
								className="underline underline-offset-4"
							>
								{t("waitlist.viewOffer")}
							</Link>
						</Badge>
					)}
				</div>

				<p className="text-xs text-muted-foreground">
					{t("waitlist.joined", { date: formatJoinedDate(entry.createdAt) })}
				</p>
			</CardContent>
		</Card>
	);
}

export function WaitlistEntryCardSkeleton() {
	return (
		<Card>
			<CardContent className="flex flex-col gap-3 p-4">
				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="flex gap-1">
						<Skeleton className="size-8" />
						<Skeleton className="size-8" />
					</div>
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-5 w-20" />
					<Skeleton className="h-5 w-24" />
				</div>
				<Skeleton className="h-3 w-36" />
			</CardContent>
		</Card>
	);
}
