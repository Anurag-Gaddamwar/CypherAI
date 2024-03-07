// app/layout.jsx
'use client'
import { Inter } from "next/font/google";
import Navbar from "@/app/components/Navbar";   
import ClientLoadingScreen from "@/app/components/ClientLoadingScreen";
import "./globals.css";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
  isLoginPage = false, // Default value is false
}: {
  children: React.ReactNode;
  isLoginPage?: boolean;
}) {
  const router = useRouter();

  // Determine whether to show Header and Navbar based on the isLoginPage prop
  const showHeaderAndNavbar = !isLoginPage;

  return (
    <html data-theme="sunset" lang="en">
      <body className={inter.className}>
        {showHeaderAndNavbar && <Navbar />}
        {showHeaderAndNavbar && <Header />}
        <ClientLoadingScreen>{children}</ClientLoadingScreen>
      </body>
    </html>
  );
}
