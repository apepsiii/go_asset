import { createFileRoute } from "@tanstack/react-router";
import { MassLabelPrint } from "@/features/mass-label-print";

export const Route = createFileRoute("/_authenticated/mass-label-print/")({
  component: MassLabelPrint,
});
