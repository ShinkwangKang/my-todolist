import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My TodoList",
  description: "칸반 보드 기반 할 일 관리 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
