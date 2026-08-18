import {
  Calendar,
  Clock,
  User,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
  FileText,
  UserPlus,
} from "lucide-react";
import type { NavItem, WorkspaceConfig } from "@/types";
import {
  ROUTE_BOOK,
  ROUTE_BOOK_APPOINTMENTS,
  ROUTE_WAITLIST,
  ROUTE_PROFILE,
  ROUTE_DOCTOR_QUEUE,
  ROUTE_DOCTOR_TODAY,
  ROUTE_STAFF_QUEUE,
  ROUTE_STAFF_LOBBY_ACCESS,
  ROUTE_STAFF_APPOINTMENTS,
  ROUTE_STAFF_PATIENTS,
  ROUTE_STAFF_WALK_IN,
  ROUTE_ADMIN_DASHBOARD,
  ROUTE_ADMIN_LOBBY_ACCESS,
  ROUTE_ADMIN_SETTINGS,
  ROUTE_ADMIN_DOCTORS,
  ROUTE_ADMIN_USERS,
  ROUTE_ADMIN_AUDIT_LOG,
} from "@/constants/routes";

export const PATIENT_NAV_ITEMS: NavItem[] = [
  { key: "nav.bookAppointment", to: ROUTE_BOOK, icon: Calendar },
  { key: "nav.myAppointments", to: ROUTE_BOOK_APPOINTMENTS, icon: Clock },
  { key: "nav.waitlist", to: ROUTE_WAITLIST, icon: Clock },
  { key: "nav.profile", to: ROUTE_PROFILE, icon: User },
];

export const DOCTOR_NAV_ITEMS: NavItem[] = [
  { key: "nav.myQueue", to: ROUTE_DOCTOR_QUEUE, icon: Users },
  { key: "nav.todaysSchedule", to: ROUTE_DOCTOR_TODAY, icon: Calendar },
  { key: "nav.profile", to: ROUTE_PROFILE, icon: User },
];

export const RECEPTIONIST_NAV_ITEMS: NavItem[] = [
  { key: "nav.queue", to: ROUTE_STAFF_QUEUE, icon: Users },
  { key: "nav.lobbyAccess", to: ROUTE_STAFF_LOBBY_ACCESS, icon: Clock },
  { key: "nav.appointments", to: ROUTE_STAFF_APPOINTMENTS, icon: Calendar },
  { key: "nav.patients", to: ROUTE_STAFF_PATIENTS, icon: Users },
  { key: "nav.walkInBooking", to: ROUTE_STAFF_WALK_IN, icon: UserPlus },
  { key: "nav.profile", to: ROUTE_PROFILE, icon: User },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { key: "nav.dashboard", to: ROUTE_ADMIN_DASHBOARD, icon: LayoutDashboard },
  { key: "nav.lobbyAccess", to: ROUTE_ADMIN_LOBBY_ACCESS, icon: Clock },
  { key: "nav.clinicSettings", to: ROUTE_ADMIN_SETTINGS, icon: Settings },
  { key: "nav.doctors", to: ROUTE_ADMIN_DOCTORS, icon: Stethoscope },
  { key: "nav.users", to: ROUTE_ADMIN_USERS, icon: Users },
  { key: "nav.auditLog", to: ROUTE_ADMIN_AUDIT_LOG, icon: FileText },
  { key: "nav.profile", to: ROUTE_PROFILE, icon: User },
];

export const WORKSPACE_CONFIGS: WorkspaceConfig[] = [
  { role: "PATIENT", navItems: PATIENT_NAV_ITEMS, homeRoute: ROUTE_BOOK },
  { role: "DOCTOR", navItems: DOCTOR_NAV_ITEMS, homeRoute: ROUTE_DOCTOR_QUEUE },
  { role: "RECEPTIONIST", navItems: RECEPTIONIST_NAV_ITEMS, homeRoute: ROUTE_STAFF_QUEUE },
  { role: "ADMIN", navItems: ADMIN_NAV_ITEMS, homeRoute: ROUTE_ADMIN_DASHBOARD },
];
