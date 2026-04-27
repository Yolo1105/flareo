import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Verify images in CI/CD" };

export default function Page() {
  return (
    <DocPage slug="/docs/uses/ci-cd" title="Verify images in CI/CD">
      <Content />
    </DocPage>
  );
}
