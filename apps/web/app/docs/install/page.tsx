import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Install the CLI" };

export default function Page() {
  return (
    <DocPage slug="/docs/install" title="Install the CLI">
      <Content />
    </DocPage>
  );
}
