import { createFileRoute } from "@tanstack/react-router";
import { PublicAsset } from "@/features/public/components/public-asset";

export const Route = createFileRoute("/public/asset/$id/")({
  component: PublicAsset,
});
