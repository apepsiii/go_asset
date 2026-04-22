import { createFileRoute } from "@tanstack/react-router";
import { AssetDetail } from "@/features/assets/components/asset-detail";

export const Route = createFileRoute("/_authenticated/assets/$id/")({
  component: AssetDetail,
});
