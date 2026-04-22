import { createFileRoute } from "@tanstack/react-router";
import { BudgetSources } from "@/features/master-data/budget-sources";

export const Route = createFileRoute("/_authenticated/master-data/budget-sources/")({
  component: BudgetSources,
});
