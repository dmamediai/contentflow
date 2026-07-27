import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  return (
    <ComingSoon
      title="Reviews"
      description="Respond to reviews left on your connected business profiles"
      icon={Star}
    />
  );
}
