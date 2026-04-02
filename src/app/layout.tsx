import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "환불원정대 | 석지운 변호사",
  description: "불공정한 위약금, AI와 변호사가 함께 풀어드립니다.",
  icons: {
    icon: "https://fav.farm/⚖️",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-gowun" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
