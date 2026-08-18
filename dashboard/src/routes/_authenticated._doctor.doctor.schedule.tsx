import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/_doctor/doctor/schedule")({
  component: DoctorScheduleRoute,
});

function DoctorScheduleRoute() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("nav.todaysSchedule")}</h1>
    </div>
  );
}
