import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "@/features/maintenance";

export const Route = createFileRoute("/_authenticated/maintenance/")({
  component: MaintenancePage,
});