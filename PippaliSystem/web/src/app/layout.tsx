import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata = {
  title: "Pippali Restaurant",
  description: "Authentic Indian Cuisine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
