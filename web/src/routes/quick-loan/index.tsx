import { createFileRoute } from "@tanstack/react-router";
import { QuickLoan } from "@/features/quick-loan";

export const Route = createFileRoute("/quick-loan/")({
  component: QuickLoan,
});
