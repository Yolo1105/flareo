import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Verify any container" };

export default function Page() {
  return (
    <DocPage slug="/docs/verify" title="Verify any container">
      <Content />
    </DocPage>
  );
}
