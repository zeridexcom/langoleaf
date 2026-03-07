import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({ 
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "EduAgent Pro - Growth Dashboard",
  description: "Partner portal for freelancers to manage students and track admissions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${publicSans.variable} font-sans antialiased bg-dark-bg text-white`}>
        {children}
      </body>
    </html>
  );
}
