import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Highlight Analyzer",
  description: "Analyze YouTube chat and extract highlight moments automatically.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900">
        <nav className="w-full p-4 shadow-sm bg-white sticky top-0">
          <h1 className="text-xl font-bold">🎥 YouTube Highlight Analyzer</h1>
        </nav>
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
