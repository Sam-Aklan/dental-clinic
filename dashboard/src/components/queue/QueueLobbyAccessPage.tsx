import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { ExternalLink, Link2, LoaderCircle, QrCode } from "lucide-react";
import { useDoctors } from "@/hooks/doctors-admin";
import { useIssueKioskTokenMutation } from "@/hooks/queue";
import { showError, showSuccess } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DoctorDTO, IssuedKioskTokenDTO } from "@/types";

const NO_DOCTOR_VALUE = "__none__";

function buildQrCodeUrl(value: string, size = 224) {
	return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
}

function getDoctorName(doctor: DoctorDTO) {
	return `${doctor.firstName} ${doctor.lastName}`.trim();
}

export function QueueLobbyAccessPage() {
	const { t } = useTranslation();
	const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
	const [issuedToken, setIssuedToken] = useState<IssuedKioskTokenDTO | null>(null);
	const doctorsQuery = useDoctors({ page: 1, pageSize: 100, status: "active" });
	const issueTokenMutation = useIssueKioskTokenMutation();

	const doctors = doctorsQuery.data?.data ?? [];
	const selectedDoctor = useMemo(() => doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null, [doctors, selectedDoctorId]);
	const qrCodeUrl = issuedToken ? buildQrCodeUrl(issuedToken.lobbyUrl) : null;

	const handleGenerate = async () => {
		if (!selectedDoctorId) return;

		try {
			const nextToken = await issueTokenMutation.mutateAsync({ doctorId: selectedDoctorId });
			setIssuedToken(nextToken);
			showSuccess(t("lobbyAccess.generateSuccess"));
		} catch {
			showError(t("lobbyAccess.generateError"));
		}
	};

	const handleCopy = async () => {
		if (!issuedToken?.lobbyUrl) return;

		try {
			await navigator.clipboard.writeText(issuedToken.lobbyUrl);
			showSuccess(t("lobbyAccess.copySuccess"));
		} catch {
			showError(t("lobbyAccess.copyError"));
		}
	};

	return (
		<section className="grid gap-4 p-4 md:p-6">
			<header className="grid gap-2">
				<h1 className="text-2xl font-semibold">{t("lobbyAccess.title")}</h1>
				<p className="max-w-3xl text-sm text-muted-foreground">{t("lobbyAccess.subtitle")}</p>
			</header>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
				<Card>
					<CardHeader>
						<CardTitle>{t("lobbyAccess.generateTitle")}</CardTitle>
						<CardDescription>{t("lobbyAccess.generateDescription")}</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid gap-2">
							<label className="text-sm font-medium" htmlFor="lobby-access-doctor-select">{t("lobbyAccess.doctorLabel")}</label>
							<Select value={selectedDoctorId || NO_DOCTOR_VALUE} onValueChange={(value) => {
								setSelectedDoctorId(value === NO_DOCTOR_VALUE ? "" : value);
								setIssuedToken(null);
							}} disabled={doctorsQuery.isLoading || doctorsQuery.isFetching || doctors.length === 0}>
								<SelectTrigger id="lobby-access-doctor-select" aria-label={t("lobbyAccess.doctorLabel")}>
									<SelectValue placeholder={t("lobbyAccess.selectDoctorPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NO_DOCTOR_VALUE}>{t("lobbyAccess.selectDoctorPlaceholder")}</SelectItem>
									{doctors.map((doctor) => (
										<SelectItem key={doctor.id} value={doctor.id}>{getDoctorName(doctor)}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{doctorsQuery.isError ? (
							<Alert variant="destructive">
								<AlertTitle>{t("lobbyAccess.loadDoctorsErrorTitle")}</AlertTitle>
								<AlertDescription>{t("lobbyAccess.loadDoctorsError")}</AlertDescription>
							</Alert>
						) : null}

						<div className="flex flex-wrap gap-3">
							<Button type="button" onClick={() => void handleGenerate()} disabled={!selectedDoctorId || issueTokenMutation.isPending}>
								{issueTokenMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
								{t("lobbyAccess.generate")}
							</Button>
							<Button type="button" variant="outline" onClick={() => void handleCopy()} disabled={!issuedToken?.lobbyUrl}>
								<Link2 className="size-4" />
								{t("lobbyAccess.copy")}
							</Button>
							<Button type="button" variant="outline" asChild>
								<a href={issuedToken?.lobbyUrl ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!issuedToken?.lobbyUrl} onClick={(event) => {
									if (!issuedToken?.lobbyUrl) {
										event.preventDefault();
									}
								}}>
									<ExternalLink className="size-4" />
									{t("lobbyAccess.open")}
								</a>
							</Button>
						</div>

						<div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
							<div className="grid gap-1">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("lobbyAccess.publicUrlLabel")}</p>
								<p className="break-all text-sm font-medium text-foreground">{issuedToken?.lobbyUrl ?? t("lobbyAccess.noLinkYet")}</p>
							</div>
							<div className="grid gap-1 sm:grid-cols-2">
								<div>
									<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("lobbyAccess.selectedDoctorLabel")}</p>
									<p className="text-sm text-foreground">{selectedDoctor ? getDoctorName(selectedDoctor) : t("lobbyAccess.noDoctorSelected")}</p>
								</div>
								<div>
									<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("lobbyAccess.expiresAtLabel")}</p>
									<p className="text-sm text-foreground">{issuedToken?.expiresAt ? dayjs(issuedToken.expiresAt).format("YYYY-MM-DD HH:mm") : t("lobbyAccess.noExpiryYet")}</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<QrCode className="size-5 text-muted-foreground" />
							<CardTitle>{t("lobbyAccess.qrTitle")}</CardTitle>
						</div>
						<CardDescription>{t("lobbyAccess.qrDescription")}</CardDescription>
					</CardHeader>
					<CardContent className="grid justify-items-center gap-4">
						<div className="rounded-2xl border bg-background p-4 shadow-sm">
							{qrCodeUrl ? <img src={qrCodeUrl} alt={t("lobbyAccess.qrAlt")} className="size-56 rounded-xl" /> : <div className="flex size-56 items-center justify-center rounded-xl bg-muted px-4 text-center text-sm text-muted-foreground">{t("lobbyAccess.qrEmpty")}</div>}
						</div>
						<p className="text-center text-sm text-muted-foreground">{t("lobbyAccess.qrHint")}</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("lobbyAccess.guidanceTitle")}</CardTitle>
					<CardDescription>{t("lobbyAccess.guidanceDescription")}</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 text-sm text-muted-foreground">
					<p>{t("lobbyAccess.guidanceMonitor")}</p>
					<p>{t("lobbyAccess.guidanceQr")}</p>
					<p>{t("lobbyAccess.guidancePrivacy")}</p>
				</CardContent>
			</Card>
		</section>
	);
}
