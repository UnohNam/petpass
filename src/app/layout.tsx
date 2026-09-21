import type { Metadata } from "next";
import Link from "next/link";
import { Gowun_Batang, IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import Logo from "@/components/Logo";
import NavSaved from "@/components/NavSaved";
import NavAuth from "@/components/NavAuth";
import "./globals.css";

const gowun = Gowun_Batang({ weight: ["400", "700"], variable: "--font-gowun", preload: false, display: "swap" });
const plexKr = IBM_Plex_Sans_KR({ weight: ["400", "500", "600", "700"], variable: "--font-plex-kr", preload: false, display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["400", "500"], variable: "--font-plex-mono", preload: false, display: "swap" });

export const metadata: Metadata = {
  title: "펫패스 PetPass — 반려동물 동반 여행 조건 매칭 가이드",
  description: "견종·체중·크기를 입력하면 한국관광공사 반려동반여행 데이터로 동반 입장 가능 여부를 즉시 판별하고, 대체 장소와 준비물까지 안내합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${gowun.variable} ${plexKr.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" aria-label="펫패스 홈"><Logo /></Link>
            <nav className="flex gap-4 text-sm font-medium sm:gap-6">
              <Link href="/" className="flex min-h-11 items-center text-ink hover:text-pass">장소 찾기</Link>
              <NavSaved />
              <Link href="/about" className="hidden min-h-11 items-center text-muted hover:text-pass sm:flex">서비스 소개</Link>
              <NavAuth />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">
          데이터 출처 · 한국관광공사 TourAPI, 한국문화정보원, 기상청, 한국천문연구원. 현장 사정에 따라 조건이 달라질 수 있으니 방문 전 확인하세요. <Link href="/about" className="underline">서비스 소개</Link> · <Link href="/privacy" className="underline">개인정보 처리방침</Link>
        </footer>
      </body>
    </html>
  );
}
