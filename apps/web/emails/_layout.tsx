import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface LayoutProps {
  preview: string;
  children: ReactNode;
}

/**
 * Shared email chrome. Black-on-off-white, monospace accents, plain
 * plus-or-minus what the marketing site uses. Kept deliberately simple:
 * no hero images, no gradients, no per-template customization. The
 * point is that every Flareo email looks the same so recipients learn
 * to trust the shape.
 */
export function EmailLayout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>
            <Text style={logoStyle}>FLAREO</Text>
          </Section>
          {children}
          <Hr style={hrStyle} />
          <Section>
            <Text style={footerStyle}>
              Flareo · Container supply chain for self-hosters
              <br />
              You received this because you have an account at flareo.dev.
              Manage email preferences at flareo.dev/app/settings/notifications.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f7f7f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif",
  margin: 0,
  padding: "32px 0",
} as const;

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e4e0",
  maxWidth: "560px",
  padding: "32px 28px",
  margin: "0 auto",
} as const;

const logoStyle = {
  fontFamily: "'Courier New', monospace",
  fontWeight: 700,
  fontSize: "14px",
  letterSpacing: "0.18em",
  color: "#1a1a1a",
  margin: "0 0 24px 0",
} as const;

const hrStyle = {
  border: 0,
  borderTop: "1px solid #e5e4e0",
  margin: "32px 0 20px",
} as const;

const footerStyle = {
  color: "#7a7870",
  fontSize: "12px",
  lineHeight: "1.55",
  margin: 0,
} as const;
