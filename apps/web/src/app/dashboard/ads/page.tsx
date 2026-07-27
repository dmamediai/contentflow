import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Megaphone } from "lucide-react";

export default function AdsPage() {
  return (
    <ComingSoon
      title="Ads"
      description="Manage paid campaigns across every connected platform"
      icon={Megaphone}
    />
  );
}
