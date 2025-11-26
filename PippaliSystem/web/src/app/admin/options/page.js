'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Trash2, Plus, X, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

export default function AdminOptionsPage() {
    const [optionGroups, setOptionGroups] = useState([]);
    const [newGroup, setNewGroup] = useState({
        name: '',
        slug: '',
        is_required: false,
        allows_multiple: false,
        options: []
    });
    const [newOption, setNewOption] = useState({ name: '', price_delta: '' });
    const [expandedGroup, setExpandedGroup] = useState(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/option-groups/');
            setOptionGroups(res.data);
        } catch (err) {
            console.error("Error fetching groups:", err);
        }
    };

    const handleAddOptionToGroup = () => {
        if (!newOption.name) return;
        setNewGroup(prev => ({
            ...prev,
            options: [...prev.options, {
                name: newOption.name,
                price_delta: parseFloat(newOption.price_delta) || 0,
                sort_order: prev.options.length + 1
            }]
        }));
        setNewOption({ name: '', price_delta: '' });
    };

    const handleRemoveOptionFromGroup = (index) => {
        setNewGroup(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroup.name || !newGroup.slug) {
            alert('Please fill in Name and Slug');
            return;
        }

        try {
            await api.post('/option-groups/', newGroup);
            alert('Option Group created successfully');
            setNewGroup({
                name: '',
                slug: '',
                is_required: false,
                allows_multiple: false,
                options: []
            });
            fetchGroups();
        } catch (err) {
            console.error(err);
            alert('Error creating group');
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!confirm('Are you sure? This will delete all options in this group.')) return;
        try {
            await api.delete(`/option-groups/${id}`);
            fetchGroups();
        } catch (err) {
            console.error(err);
            alert('Error deleting group');
        }
    };

    const toggleExpand = (id) => {
        setExpandedGroup(expandedGroup === id ? null : id);
    };

    return (
        <div className="container mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold">Option Groups Management</h1>
            </div>

            {/* Create Group Form */}
            <div className="bg-white p-6 rounded-lg shadow mb-8 border border-gray-200">
                <h2 className="text-xl font-bold mb-4">Create New Option Group</h2>
                <form onSubmit={handleCreateGroup} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Group Name</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={newGroup.name}
                                onChange={e => setNewGroup({ ...newGroup, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                placeholder="e.g. Spice Level"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Slug (ID)</label>
                            <input
                                className="w-full border p-2 rounded bg-gray-50"
                                value={newGroup.slug}
                                onChange={e => setNewGroup({ ...newGroup, slug: e.target.value })}
                                placeholder="e.g. spice-level"
                            />
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newGroup.is_required}
                                onChange={e => setNewGroup({ ...newGroup, is_required: e.target.checked })}
                            />
                            <span className="text-sm font-medium">Required Selection</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newGroup.allows_multiple}
                                onChange={e => setNewGroup({ ...newGroup, allows_multiple: e.target.checked })}
                            />
                            <span className="text-sm font-medium">Allow Multiple Choices</span>
                        </label>
                    </div>

                    {/* Add Options Section */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold mb-2 uppercase text-gray-500">Add Options to Group</h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                className="flex-1 border p-2 rounded"
                                value={newOption.name}
                                onChange={e => setNewOption({ ...newOption, name: e.target.value })}
                                placeholder="Option Name (e.g. Mild)"
                            />
                            <input
                                type="number"
                                className="w-32 border p-2 rounded"
                                value={newOption.price_delta}
                                onChange={e => setNewOption({ ...newOption, price_delta: e.target.value })}
                                placeholder="+ Price"
                            />
                            <button
                                type="button"
                                onClick={handleAddOptionToGroup}
                                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Staged Options List */}
                        {newGroup.options.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                                {newGroup.options.map((opt, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-100">
                                        <span className="font-medium">{opt.name}</span>
                                        <div className="flex items-center gap-4">
                                            {opt.price_delta > 0 && <span className="text-green-600 text-sm font-bold">+{opt.price_delta} kr.</span>}
                                            <button type="button" onClick={() => handleRemoveOptionFromGroup(idx)} className="text-red-500 hover:text-red-700">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
                        Create Option Group
                    </button>
                </form>
            </div>

            {/* Existing Groups List */}
            <div className="space-y-4">
                {optionGroups.map(group => (
                    <div key={group.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                        <div
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleExpand(group.id)}
                        >
                            <div className="flex items-center gap-4">
                                {expandedGroup === group.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                <div>
                                    <h3 className="font-bold text-lg">{group.name}</h3>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        {group.is_required && <span className="bg-red-100 text-red-800 px-1 rounded">Required</span>}
                                        {group.allows_multiple && <span className="bg-blue-100 text-blue-800 px-1 rounded">Multi-Select</span>}
                                        <span>{group.options.length} options</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                className="text-red-600 hover:text-red-800 p-2"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* Expanded Options View */}
                        {expandedGroup === group.id && (
                            <div className="bg-gray-50 p-4 border-t border-gray-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 uppercase text-xs">
                                            <th className="pb-2">Option Name</th>
                                            <th className="pb-2 text-right">Extra Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.options.map(opt => (
                                            <tr key={opt.id} className="border-b border-gray-200 last:border-0">
                                                <td className="py-2">{opt.name}</td>
                                                <td className="py-2 text-right font-mono">
                                                    {parseFloat(opt.price_delta) > 0 ? `+${opt.price_delta} kr.` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
