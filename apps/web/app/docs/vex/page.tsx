import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "VEX — Vulnerability Exploitability eXchange" };

export default function Page() {
  return (
    <DocPage
      slug="/docs/vex"
      title="VEX — Vulnerability Exploitability eXchange"
    >
      <Content />
    </DocPage>
  );
}
