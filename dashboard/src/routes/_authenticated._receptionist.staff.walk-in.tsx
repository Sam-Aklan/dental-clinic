import { createFileRoute } from "@tanstack/react-router";
import { WalkInBookingPage } from "@/components/walk-in";

export const Route = createFileRoute("/_authenticated/_receptionist/staff/walk-in")({
  component: StaffWalkInRoute,
});

function StaffWalkInRoute() {
  return <WalkInBookingPage />;
}
