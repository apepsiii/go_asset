import { createFileRoute } from "@tanstack/react-router";
import { Locations } from "@/features/master-data/locations";

export const Route = createFileRoute("/_authenticated/master-data/locations/")({
  component: Locations,
});
