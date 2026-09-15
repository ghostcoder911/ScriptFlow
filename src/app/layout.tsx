import type { Metadata } from "next";
import { Courier_Prime, Geist, Noto_Sans_Malayalam } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-script",
});

const malayalam = Noto_Sans_Malayalam({
  weight: ["400", "500", "600", "700"],
  subsets: ["malayalam"],
  variable: "--font-ml",
});

export const metadata: Metadata = {
  title: "ScriptFlow — Malayalam + English screenplay studio",
  description:
    "Professional bilingual screenplay writer with Manglish-to-Malayalam typing, scene cards, and voice dictation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geist.variable} ${courier.variable} ${malayalam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
