import { createFileRoute } from "@tanstack/react-router";
import { AssetForm } from "@/features/assets/components/asset-form";

export const Route = createFileRoute("/_authenticated/assets/new/")({
  component: () => <AssetForm mode="create" />,
});
