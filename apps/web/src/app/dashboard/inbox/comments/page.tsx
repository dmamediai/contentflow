import { ComingSoon } from "@/components/dashboard/coming-soon";
import { MessageSquare } from "lucide-react";

export default function CommentsPage() {
  return (
    <ComingSoon
      title="Comments"
      description="Reply to comments on your posts across every platform"
      icon={MessageSquare}
    />
  );
}
