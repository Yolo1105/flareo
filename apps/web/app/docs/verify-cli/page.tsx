import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Verify from the CLI" };

export default function Page() {
  return (
    <DocPage slug="/docs/verify-cli" title="Verify from the CLI">
      <Content />
    </DocPage>
  );
}
