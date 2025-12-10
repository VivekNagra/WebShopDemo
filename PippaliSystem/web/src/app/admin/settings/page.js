'use client';
import React, { useState } from 'react';
import { Save, Store, DollarSign, Globe } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        restaurantName: 'Pippali',
        address: '123 Main St, Copenhagen',
        phone: '+45 12 34 56 78',
        currency: 'DKK',
        language: 'en',
    });

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // TODO: Persist to backend
        alert('Settings saved! (Local only for now)');
        console.log('Saved settings:', settings);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600 mt-1">Configure your restaurant details and preferences.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Save className="w-5 h-5" />
                        <span className="font-semibold">Save Changes</span>
                    </button>
                </div>

                <div className="grid gap-8">
                    {/* Restaurant Info Section */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Store className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Restaurant Information</h2>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                                <input
                                    type="text"
                                    value={settings.restaurantName}
                                    onChange={(e) => handleChange('restaurantName', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={settings.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        value={settings.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Globe className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Regional Preferences</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        value={settings.currency}
                                        onChange={(e) => handleChange('currency', e.target.value)}
                                        className="w-full p-3 pl-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
                                    >
                                        <option value="DKK">Danish Krone (kr.)</option>
                                        <option value="USD">US Dollar ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => handleChange('language', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value="en">English</option>
                                    <option value="da">Danish</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
