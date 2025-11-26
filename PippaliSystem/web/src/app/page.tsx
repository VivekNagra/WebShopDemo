import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-6xl font-bold mb-6 text-gray-900 tracking-tight">
        Welcome to <span className="text-[var(--primary)]">Pippali</span>
      </h1>
      <p className="text-xl text-gray-500 mb-10 max-w-2xl leading-relaxed">
        Authentic Indian cuisine made with passion. <br />
        Order online for takeaway or dine with us.
      </p>
      <div className="flex gap-4">
        <Link
          href="/order"
          className="btn-primary text-lg px-8 py-3"
        >
          Order Online
        </Link>
        <Link
          href="/admin/menu"
          className="bg-white text-gray-900 border border-gray-200 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          Admin Panel
        </Link>
      </div>
    </div>
  );
}
