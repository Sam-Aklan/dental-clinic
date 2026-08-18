import { createFileRoute } from "@tanstack/react-router";
import { BookingPage } from "@/components/booking";

export const Route = createFileRoute("/_authenticated/_patient/book")({
	component: BookRoute,
});

function BookRoute() {
	return <BookingPage />;
}
