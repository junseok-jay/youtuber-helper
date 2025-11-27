"use client";

import { useState } from "react";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(false);
  };

  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 flex h-screen overflow-hidden">
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-20
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">메뉴</h2>
            <ul className="space-y-4">
              {/* <li>
                <Link 
                  href="/" 
                  className="block hover:text-blue-500 cursor-pointer"
                  onClick={handleMenuClick}
                >
                  홈
                </Link>
              </li> */}
              
              <li>
                <Link 
                  href="/" 
                  className="block hover:text-blue-500 cursor-pointer"
                  onClick={handleMenuClick}
                >
                  채팅 분석
                </Link>
              </li>

              <li>
                <Link 
                  href="/video-highlights" 
                  className="block hover:text-blue-500 cursor-pointer"
                  onClick={handleMenuClick}
                >
                  하이라이트
                </Link>
              </li>

              <li>
                <Link 
                  href="/final-analyze" 
                  className="block hover:text-blue-500 cursor-pointer"
                  onClick={handleMenuClick}
                >
                  최종 분석
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-auto">
          <nav className="w-full p-4 shadow-md bg-white flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button
                className="p-2 rounded-md hover:bg-gray-200 transition"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <Link href="/" className="text-xl font-bold">
                YOUTUBE-HELPER
              </Link>
            </div>
          </nav>

          <main className="max-w-5xl mx-auto p-6">{children}</main>
        </div>
        
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-transparent z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </body>
    </html>
  );
}