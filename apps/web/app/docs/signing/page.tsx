import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "How we sign modules" };

export default function Page() {
  return (
    <DocPage slug="/docs/signing" title="How we sign modules">
      <Content />
    </DocPage>
  );
}
