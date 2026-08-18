import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "@/contexts/auth";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<QueryProvider>
			<AuthProvider>{children}</AuthProvider>
			<Toaster/>
		</QueryProvider>
	);
}
