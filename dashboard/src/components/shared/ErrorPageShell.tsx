import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/shared/language-switcher/LanguageSwitcher";
import { cn } from "@/lib/utils";

export interface ErrorPageAction {
	label: string;
	to?: string;
	onClick?: () => void;
	variant?: "default" | "outline" | "secondary" | "ghost";
}

export interface ErrorPageShellProps {
	statusCode: "403" | "404";
	eyebrow: string;
	title: string;
	description: string;
	icon: ReactNode;
	primaryAction: ErrorPageAction;
	secondaryAction?: ErrorPageAction;
	supportText?: string;
}

// AR: غلاف عرضي مشترك لصفحات الأخطاء. يوفر التخطيط وإجراءات الاسترداد ومبدل اللغة.
// EN: Shared presentational shell for error pages. Provides layout, recovery actions, and language switcher.
export function ErrorPageShell({
	statusCode,
	eyebrow,
	title,
	description,
	icon,
	primaryAction,
	secondaryAction,
	supportText,
}: ErrorPageShellProps) {
	return (
		<main
			className={cn(
				"flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6",
			)}
			aria-label={title}
		>
			<header className="absolute top-4 end-4">
				<LanguageSwitcher />
			</header>

			<Card className="w-full max-w-md border-0 bg-background shadow-none sm:border sm:shadow-sm">
				<CardContent className="flex flex-col items-center gap-4 pt-6 pb-8 text-center">
					{/* Status badge */}
					<div className="flex flex-col items-center gap-3">
						<span className="inline-flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground" aria-hidden="true">
							{icon}
						</span>
						<span className="text-5xl font-bold tracking-tight text-foreground/20" aria-hidden="true">
							{statusCode}
						</span>
					</div>

					<p className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
						{eyebrow}
					</p>

					<h1 className="text-xl font-semibold text-foreground">
						{title}
					</h1>

					<p className="text-sm text-muted-foreground max-w-prose">
						{description}
					</p>

					<Separator className="w-full" />

					{/* Actions */}
					<div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
						{primaryAction.to ? (
							<Button asChild variant={primaryAction.variant ?? "default"} className="w-full sm:w-auto">
								<Link to={primaryAction.to} replace>
									{primaryAction.label}
								</Link>
							</Button>
						) : (
							<Button
								variant={primaryAction.variant ?? "default"}
								onClick={primaryAction.onClick}
								className="w-full sm:w-auto"
							>
								{primaryAction.label}
							</Button>
						)}

						{secondaryAction && (
							secondaryAction.to ? (
								<Button asChild variant={secondaryAction.variant ?? "outline"} className="w-full sm:w-auto">
									<Link to={secondaryAction.to} replace>
										{secondaryAction.label}
									</Link>
								</Button>
							) : (
								<Button
									variant={secondaryAction.variant ?? "outline"}
									onClick={secondaryAction.onClick}
									className="w-full sm:w-auto"
								>
									{secondaryAction.label}
								</Button>
							)
						)}
					</div>

					{supportText && (
						<>
							<Separator className="w-full" />
							<p className="text-xs text-muted-foreground">
								{supportText}
							</p>
						</>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
