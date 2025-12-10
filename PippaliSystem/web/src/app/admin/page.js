'use client';
import Link from 'next/link';
import { UtensilsCrossed, LayoutGrid, Settings, PlusCircle } from 'lucide-react';

export default function AdminDashboard() {
    const cards = [
        {
            title: 'Menu Management',
            description: 'Edit items, categories, and prices.',
            icon: <UtensilsCrossed className="w-12 h-12 text-emerald-600" />,
            href: '/admin/menu',
            color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
        },
        {
            title: 'Table Layout',
            description: 'Drag & drop tables to arrange floor plan.',
            icon: <LayoutGrid className="w-12 h-12 text-blue-600" />,
            href: '/admin/tables',
            color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        },
        {
            title: 'Settings',
            description: 'Configure restaurant details.',
            icon: <Settings className="w-12 h-12 text-gray-600" />,
            href: '/admin/settings',
            color: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600 mb-12">Manage your restaurant from one place.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cards.map((card) => (
                        <Link key={card.title} href={card.href} className={`block p-8 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1 shadow-sm hover:shadow-md ${card.color}`}>
                            <div className="mb-6">{card.icon}</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{card.title}</h2>
                            <p className="text-gray-600">{card.description}</p>
                        </Link>
                    ))}


                </div>
            </div>
        </div>
    );
}
