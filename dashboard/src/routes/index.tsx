import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTABanner } from "@/components/landing/CTABanner";

export const Route = createFileRoute("/")({
	component: IndexRoute,
});

function IndexRoute() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<LandingNavbar />
			<main className="flex-grow">
				<HeroSection />
				<StatsBar />
				<FeaturesSection />
				<HowItWorksSection />
				<TestimonialsSection />
				<CTABanner />
			</main>
			<LandingFooter />
		</div>
	);
}

