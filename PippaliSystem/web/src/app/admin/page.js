'use client';
import Link from 'next/link';
import { UtensilsCrossed, Layers, List, Settings } from 'lucide-react';

export default function AdminDashboard() {
    const cards = [
        {
            title: 'Manage Menu',
            description: 'Add, edit, or remove dishes and prices.',
            icon: <UtensilsCrossed className="w-8 h-8 text-blue-600" />,
            href: '/admin/menu',
            color: 'bg-blue-50 border-blue-100'
        },
        {
            title: 'Manage Categories',
            description: 'Organize your menu into sections (e.g., Starters, Mains).',
            icon: <Layers className="w-8 h-8 text-purple-600" />,
            href: '/admin/categories',
            color: 'bg-purple-50 border-purple-100'
        },
        {
            title: 'Manage Options',
            description: 'Configure add-ons like Rice, Naan, and Spice Levels.',
            icon: <List className="w-8 h-8 text-orange-600" />,
            href: '/admin/options',
            color: 'bg-orange-50 border-orange-100'
        }
    ];

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mb-10">Manage your restaurant's menu and settings.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {cards.map((card) => (
                    <Link key={card.href} href={card.href} className="block group">
                        <div className={`h-full p-8 rounded-2xl border ${card.color} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white`}>
                            <div className="mb-6 p-4 rounded-xl bg-white w-fit shadow-sm group-hover:scale-110 transition-transform">
                                {card.icon}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">{card.title}</h2>
                            <p className="text-gray-600 leading-relaxed">{card.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
