import { createFileRoute } from "@tanstack/react-router";
import { LabelSettings } from "@/features/settings/label";

export const Route = createFileRoute("/_authenticated/settings/label/")({
  component: LabelSettings,
});
