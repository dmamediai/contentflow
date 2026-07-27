import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Radio } from "lucide-react";

export default function CampaignsPage() {
  return (
    <ComingSoon
      title="Campaigns"
      description="Bulk messaging campaigns and multi-step drip sequences"
      icon={Radio}
    />
  );
}
