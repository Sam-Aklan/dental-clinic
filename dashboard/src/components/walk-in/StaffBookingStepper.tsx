import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STEPS = ["patient", "doctor", "slot", "confirm"] as const;

interface StaffBookingStepperProps {
	currentStep: number;
}

export function StaffBookingStepper({ currentStep }: StaffBookingStepperProps) {
	const { t } = useTranslation();

	return (
		<nav aria-label={t("walkIn.steps.label")} className="w-full">
			<ol className="flex flex-wrap items-center gap-2">
				{STEPS.map((step, index) => {
					const stepNumber = index + 1;
					const isActive = stepNumber === currentStep;
					const isCompleted = stepNumber < currentStep;

					return (
						<li key={step} className="flex items-center gap-2">
							<div
								className={cn(
									"flex size-8 items-center justify-center rounded-full text-sm font-medium",
									isActive && "bg-primary text-primary-foreground",
									isCompleted && "bg-primary text-primary-foreground",
									!isActive && !isCompleted && "bg-muted text-muted-foreground",
								)}
							>
								{isCompleted ? <CheckIcon className="size-4" /> : stepNumber}
							</div>
							<span className="text-xs font-medium text-muted-foreground">{t(`walkIn.steps.${step}`)}</span>
							{index < STEPS.length - 1 && <div className={cn("h-px w-6", isCompleted ? "bg-primary" : "bg-muted")} />}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
