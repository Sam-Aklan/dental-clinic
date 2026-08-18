import type { Role } from "./auth";

export interface NavItem {
  key: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export interface WorkspaceConfig {
  role: Role;
  navItems: NavItem[];
  homeRoute: string;
}

export type LoadingVariant = "page" | "section" | "overlay" | "compact";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export type LanguageCode = "en" | "ar";
