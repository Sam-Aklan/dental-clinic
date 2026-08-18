import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DoctorDirectoryItemDTO } from "@/types";

interface DoctorSelectorProps {
	doctors: DoctorDirectoryItemDTO[];
	isLoading: boolean;
	isError: boolean;
	onRetry: () => void;
	selectedDoctorId: string | null;
	onSelectDoctor: (doctorId: string) => void;
}

export function DoctorSelector({
	doctors,
	isLoading,
	isError,
	onRetry,
	selectedDoctorId,
	onSelectDoctor,
}: DoctorSelectorProps) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");

	const activeDoctors = useMemo(
		() => doctors.filter((d) => d.isActive),
		[doctors],
	);

	const filteredDoctors = useMemo(() => {
		if (!search.trim()) return activeDoctors;
		const query = search.toLowerCase();
		return activeDoctors.filter((d) => {
			const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
			const specialization = (d.specialization ?? "").toLowerCase();
			return fullName.includes(query) || specialization.includes(query);
		});
	}, [activeDoctors, search]);

	if (isError) {
		return (
			<div className="rounded-md bg-destructive/10 p-6 text-center" role="alert">
				<p className="text-destructive">{t("booking.errors.doctorsFailed")}</p>
				<button
					type="button"
					onClick={onRetry}
					className="mt-2 text-sm font-medium underline underline-offset-4 hover:text-destructive/80"
				>
					{t("booking.errors.retry")}
				</button>
			</div>
		);
	}

	if (!isLoading && filteredDoctors.length === 0 && activeDoctors.length === 0) {
		return (
			<p className="text-center text-muted-foreground py-8">{t("booking.errors.noDoctors")}</p>
		);
	}

	return (
		<div className="space-y-4">
			{activeDoctors.length > 0 && (
				<div className="relative">
					<SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search by name or specialization..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="ps-9"
					/>
				</div>
			)}

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={`skeleton-${i}`}>
							<CardContent className="p-4 space-y-3">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-3 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : filteredDoctors.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredDoctors.map((doctor) => {
						const isSelected = doctor.id === selectedDoctorId;
						return (
							<Card
								key={doctor.id}
								className={cn(
									"cursor-pointer transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-ring",
									isSelected && "border-primary bg-primary/5 ring-2 ring-primary",
								)}
								onClick={() => onSelectDoctor(doctor.id)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										onSelectDoctor(doctor.id);
									}
								}}
								aria-selected={isSelected}
								role="option"
								tabIndex={0}
							>
								<CardContent className="p-4 space-y-1">
							<p className="font-medium">
								{doctor.firstName} {doctor.lastName}
							</p>
							<p className="text-sm text-muted-foreground">{doctor.specialization ?? t("booking.doctorCard.specializationFallback")}</p>
							<p className="text-xs text-muted-foreground line-clamp-2">{doctor.bio ?? t("booking.doctorCard.bioFallback")}</p>
						</CardContent>
					</Card>
					);
					})}
				</div>
			) : (
				<p className="text-center text-muted-foreground py-4">
					{search.trim()
						? t("booking.errors.noDoctors")
						: t("booking.errors.noDoctors")}
				</p>
			)}
		</div>
	);
}
