import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Workflow } from "lucide-react";

export default function InboxWorkflowsPage() {
  return (
    <ComingSoon
      title="Workflows"
      description="Event-driven automation with branching logic"
      icon={Workflow}
    />
  );
}
