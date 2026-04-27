import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Shared preview demos" };

export default function Page() {
  return (
    <DocPage slug="/docs/previews" title="Shared preview demos">
      <Content />
    </DocPage>
  );
}
