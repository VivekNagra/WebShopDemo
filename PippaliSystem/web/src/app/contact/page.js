'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-gray-900 tracking-tight">Get in Touch</h1>
                <p className="text-xl text-gray-600">We'd love to hear from you. Send us a message or visit us.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info Card */}
                <div className="card p-8 h-fit">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Information</h2>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-[var(--primary)] p-3 rounded-full text-white">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Phone</h3>
                                <p className="text-gray-600">+45 44 42 99 99</p>
                                <p className="text-sm text-gray-500 mt-1">Mon-Thu: 16:00 - 22:00</p>
                                <p className="text-sm text-gray-500">Fri-Sun: 12:00 - 22:00</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-[var(--primary)] p-3 rounded-full text-white">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Email</h3>
                                <p className="text-gray-600">kontakt@pippali.dk</p>
                                <p className="text-sm text-gray-500 mt-1">We will reply as soon as possible</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-[var(--primary)] p-3 rounded-full text-white">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Location</h3>
                                <p className="text-gray-600">Herlev Bygade 34</p>
                                <p className="text-gray-600">2730 Herlev</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form Card */}
                <div className="card p-8">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Send us a Message</h2>

                    {status === 'success' ? (
                        <div className="bg-green-50 text-green-800 p-6 rounded-xl border border-green-100 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                            <p>Thank you for contacting us. We will get back to you shortly.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-6 text-green-700 font-bold hover:underline"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                    placeholder="Your Name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Subject</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                    placeholder="How can we help?"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Message</label>
                                <textarea
                                    required
                                    rows="4"
                                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none resize-none"
                                    placeholder="Write your message here..."
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full btn-primary flex items-center justify-center gap-2 text-lg"
                            >
                                {status === 'submitting' ? (
                                    <span>Sending...</span>
                                ) : (
                                    <>
                                        <span>Send Message</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
