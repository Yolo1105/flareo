import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Run a module ephemerally" };

export default function Page() {
  return (
    <DocPage slug="/docs/run" title="Run a module ephemerally">
      <Content />
    </DocPage>
  );
}
