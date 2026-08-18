import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ROUTE_LOGIN } from "@/constants";
import { cn } from "@/lib/utils";

interface ResetPasswordSuccessStateProps {
	className?: string;
}

export function ResetPasswordSuccessState({
	className,
}: ResetPasswordSuccessStateProps) {
	const { t } = useTranslation();

	return (
		<div
			className={cn("flex w-full flex-col gap-4", className)}
			role="status"
		>
			<div className="flex flex-col gap-2 text-center">
				<h3 className="text-lg font-semibold text-foreground">
					{t("auth.resetPassword.successTitle")}
				</h3>
				<p className="text-sm text-muted-foreground">
					{t("auth.resetPassword.successMessage")}
				</p>
				<p className="text-sm text-muted-foreground">
					{t("auth.resetPassword.redirectingIn", { seconds: 2 })}
				</p>
			</div>

			<div className="flex items-center justify-center text-sm">
				<Link
					to={ROUTE_LOGIN}
					className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
				>
					{t("auth.resetPassword.signInNow")}
				</Link>
			</div>
		</div>
	);
}
