import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AUDIT_LARGE_PAYLOAD_PREVIEW_LINES, AUDIT_LARGE_PAYLOAD_THRESHOLD } from "@/constants/audit-log";
import { redactPayload } from "@/lib/audit-log";
import { useTranslation } from "react-i18next";

function stringifyPayload(payload: unknown) {
	if (payload === null) {
		return "null";
	}

	if (typeof payload === "string") {
		return payload;
	}

	try {
		return JSON.stringify(payload, null, 2);
	} catch {
		return String(payload);
	}
}

export function AuditPayloadViewer({ payload }: { payload: unknown }) {
	const [expanded, setExpanded] = useState(false);
	const { t } = useTranslation();
	const redacted = useMemo(() => redactPayload(payload), [payload]);
	if (redacted === null) {
		return <p className="text-sm text-muted-foreground">{t("auditLog.payload.empty")}</p>;
	}
	const text = stringifyPayload(redacted);
	const lines = text.split("\n");
	const collapsed = text.length > AUDIT_LARGE_PAYLOAD_THRESHOLD && !expanded;

	return (
		<div className="space-y-3">
			<pre className="max-h-[28rem] overflow-auto rounded-lg bg-muted p-3 text-xs leading-5 text-foreground">
				{collapsed ? lines.slice(0, AUDIT_LARGE_PAYLOAD_PREVIEW_LINES).join("\n") : text}
			</pre>
			{text.length > AUDIT_LARGE_PAYLOAD_THRESHOLD ? (
				<Button type="button" variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>
					{expanded ? t("auditLog.payload.showLess") : t("auditLog.payload.showMore")}
				</Button>
			) : null}
		</div>
	);
}
