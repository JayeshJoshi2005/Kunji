import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // optional
});

export const metadata = {
  title: "Kunji",
  description: "Personal Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en" suppressHydrationWarning>
      <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>
      <body className={`${poppins.className} antialiased`} suppressHydrationWarning>
        <Header/>
        <main className="min-h-screen">{children}</main>
        <Toaster richColors />
        <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
            <p>Made by Jayesh</p>
          </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
