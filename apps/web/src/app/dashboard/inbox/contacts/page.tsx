import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Contact } from "lucide-react";

export default function ContactsPage() {
  return (
    <ComingSoon
      title="Contacts"
      description="Everyone who's messaged you, unified across platforms"
      icon={Contact}
    />
  );
}
