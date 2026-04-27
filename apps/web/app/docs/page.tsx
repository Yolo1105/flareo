import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Overview" };

export default function Page() {
  return (
    <DocPage slug="/docs" title="Overview">
      <Content />
    </DocPage>
  );
}
