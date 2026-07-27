import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Phone } from "lucide-react";

export default function NumbersPage() {
  return (
    <ComingSoon
      title="Numbers"
      description="Provision phone numbers for SMS, calls, and WhatsApp"
      icon={Phone}
    />
  );
}
