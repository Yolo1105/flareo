import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Deploy Vaultwarden in 5 minutes" };

export default function Page() {
  return (
    <DocPage
      slug="/docs/uses/vaultwarden"
      title="Deploy Vaultwarden in 5 minutes"
    >
      <Content />
    </DocPage>
  );
}
