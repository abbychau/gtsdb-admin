import type { Metadata } from "next";
import "./globals.css";
import favicon from "../public/favicon.png";
import { SettingsProvider } from './settings-context'
import { ConfigProvider } from './config-context'
import { ComparisonProvider } from './comparison-context'

export const metadata: Metadata = {
  title: "GTSDB Admin",
  description: "GTSDB ADMIN is a modern REST client for developers. by Abby",
  icons: {
    icon: favicon.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <SettingsProvider>
        <ConfigProvider>
        <ComparisonProvider>
          {children}
        </ComparisonProvider>
        </ConfigProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
