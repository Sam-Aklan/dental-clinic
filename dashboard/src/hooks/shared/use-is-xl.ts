import { useSyncExternalStore } from "react";

const XL_BREAKPOINT = 1280;

function getSnapshot() {
	if (typeof window === "undefined") return false;
	return window.innerWidth >= XL_BREAKPOINT;
}

function subscribe(callback: () => void) {
	if (typeof window === "undefined") return () => {};
	const mql = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
	mql.addEventListener("change", callback);
	return () => mql.removeEventListener("change", callback);
}

export function useIsXl() {
	return useSyncExternalStore(subscribe, getSnapshot);
}
