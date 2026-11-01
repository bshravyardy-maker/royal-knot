import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Palace Command Center & Client Desk | THE ROYAL KNOT",
  description:
    "Secure portal for royal wedding directors, event managers, and clients direct enquiry and tracking desk.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
