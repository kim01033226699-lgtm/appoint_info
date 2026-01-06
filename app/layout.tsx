import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "굿리치 위촉일정",
  description: "신규 위촉자 일정 조회 시스템",
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  minimumScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
