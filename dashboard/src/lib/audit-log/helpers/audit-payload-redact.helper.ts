import { AUDIT_SENSITIVE_KEYS } from "@/constants";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Object.prototype.toString.call(value) === "[object Object]";
}

function normalizeKey(key: string) {
	return key.toLowerCase().replace(/_/g, "");
}

function cloneValue<T>(value: T): T {
	if (typeof structuredClone === "function") {
		return structuredClone(value);
	}
	return JSON.parse(JSON.stringify(value)) as T;
}

function redactNode(input: unknown): unknown {
	if (Array.isArray(input)) {
		return input.map((item) => redactNode(item));
	}

	if (!isPlainObject(input)) {
		return input;
	}

	const normalizedSensitiveKeys = new Set(AUDIT_SENSITIVE_KEYS.map((key) => normalizeKey(key)));
	const output: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(input)) {
		if (normalizedSensitiveKeys.has(normalizeKey(key))) {
			output[key] = "[REDACTED]";
			continue;
		}

		output[key] = redactNode(value);
	}

	return output;
}

export function redactPayload(input: unknown): unknown {
	if (input === null || input === undefined) {
		return input;
	}

	if (!Array.isArray(input) && !isPlainObject(input)) {
		return input;
	}

	return redactNode(cloneValue(input));
}
