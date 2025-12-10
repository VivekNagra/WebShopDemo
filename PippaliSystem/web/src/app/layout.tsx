import "./globals.css";
import Navbar from "@/components/Navbar";
import ChatWidget from "@/components/ChatWidget";

export const metadata = {
  title: "Pippali Restaurant",
  description: "Authentic Indian Cuisine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900 font-sans">
        <Navbar />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
