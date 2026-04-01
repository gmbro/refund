import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "환불원정대 — 억울한 위약금, 법으로 바로잡으세요",
  description: "소비자가 부당한 위약금을 방어하고 합법적인 환불을 받을 수 있도록 돕는 AI 법률 분석 서비스. 헬스장, 예식장, 숙박/항공권 분쟁을 해결하세요.",
  keywords: ["환불", "위약금", "소비자 권리", "방문판매법", "소비자분쟁해결기준", "헬스장 환불", "예식장 환불"],
  openGraph: {
    title: "환불원정대 — 억울한 위약금, 법으로 바로잡으세요",
    description: "AI가 관련 법령을 분석하고 합법적인 환불액을 계산해드립니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-grid min-h-screen">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
