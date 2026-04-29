import { createFileRoute } from "@tanstack/react-router";
import { MaintenanceLabelPrint } from "@/features/maintenance-label";

export const Route = createFileRoute("/_authenticated/maintenance-label-print/")({
  component: MaintenanceLabelPrint,
});