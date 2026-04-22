import { createFileRoute } from "@tanstack/react-router";
import { Categories } from "@/features/master-data";

export const Route = createFileRoute("/_authenticated/master-data/categories/")({
  component: Categories,
});
