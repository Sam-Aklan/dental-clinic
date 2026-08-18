import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { BookingRulesSection } from "./BookingRulesSection";
import { WeeklyHoursSection } from "./WeeklyHoursSection";
import { HolidayClosuresSection } from "./HolidayClosuresSection";

export function ClinicSettingsPage() {
	const { t } = useTranslation();
	return (
		<div dir={i18n.dir()} className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
			<header className="grid gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">{t("clinicSettings.title")}</h1>
				<p className="text-sm text-muted-foreground">{t("clinicSettings.subtitle")}</p>
			</header>
			<BookingRulesSection />
			<WeeklyHoursSection />
			<HolidayClosuresSection />
		</div>
	);
}
