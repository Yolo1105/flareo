import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Verify your first module" };

export default function Page() {
  return (
    <DocPage slug="/docs/first-verify" title="Verify your first module">
      <Content />
    </DocPage>
  );
}
