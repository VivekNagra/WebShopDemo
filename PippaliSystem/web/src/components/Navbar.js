'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: 'Order Online', href: '/order' },
        { name: 'Cocktails', href: '/cocktails' },
        { name: 'Book Table', href: '/book-table' },
        { name: 'Catering', href: '/catering' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ];

    return (
        <nav className="bg-white sticky top-4 z-50 mx-4 mt-4 rounded-2xl shadow-md border border-gray-100">
            <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
                    Pippali
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-8 font-medium text-sm items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-gray-600 hover:text-[var(--primary)] transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}

                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-700 hover:text-[var(--primary)] focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white rounded-b-2xl">
                    <div className="flex flex-col p-4 space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-lg font-medium text-gray-700 hover:text-[var(--primary)] hover:pl-2 transition-all"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                    </div>
                </div>
            )}
        </nav>
    );
}
