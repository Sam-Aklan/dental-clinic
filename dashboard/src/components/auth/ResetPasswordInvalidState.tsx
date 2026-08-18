import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ROUTE_FORGOT_PASSWORD } from "@/constants";
import { cn } from "@/lib/utils";

interface ResetPasswordInvalidStateProps {
	className?: string;
}

export function ResetPasswordInvalidState({
	className,
}: ResetPasswordInvalidStateProps) {
	const { t } = useTranslation();

	return (
		<div
			className={cn("flex w-full flex-col gap-4", className)}
			role="alert"
		>
			<div className="flex flex-col gap-2 text-center">
				<h3 className="text-lg font-semibold text-foreground">
					{t("auth.resetPassword.invalidLinkTitle")}
				</h3>
				<p className="text-sm text-muted-foreground">
					{t("auth.resetPassword.invalidLinkMessage")}
				</p>
			</div>

			<div className="flex items-center justify-center text-sm">
				<Link
					to={ROUTE_FORGOT_PASSWORD}
					className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
				>
					{t("auth.resetPassword.requestNewLink")}
				</Link>
			</div>
		</div>
	);
}
