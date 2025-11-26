'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Trash2, Edit2, Plus, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [newItem, setNewItem] = useState({
        name: '',
        slug: '',
        sort_order: 0
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories/');
            // Sort by sort_order
            const sorted = res.data.sort((a, b) => a.sort_order - b.sort_order);
            setCategories(sorted);
            // Set next sort order
            if (sorted.length > 0) {
                setNewItem(prev => ({ ...prev, sort_order: sorted[sorted.length - 1].sort_order + 1 }));
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!newItem.name) {
            alert('Please enter a category name');
            return;
        }

        // Auto-generate slug if empty
        const dataToSend = {
            ...newItem,
            slug: newItem.slug || newItem.name.toLowerCase().replace(/\s+/g, '-')
        };

        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, dataToSend);
            } else {
                await api.post('/categories/', dataToSend);
            }
            resetForm();
            fetchCategories();
        } catch (err) {
            console.error(err);
            alert('Error saving category');
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setNewItem({
            name: cat.name,
            slug: cat.slug,
            sort_order: cat.sort_order
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This might affect menu items linked to this category.')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (err) {
            console.error(err);
            alert('Error deleting category');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setNewItem({
            name: '',
            slug: '',
            sort_order: categories.length > 0 ? categories[categories.length - 1].sort_order + 1 : 0
        });
    };

    return (
        <div className="container mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold">Category Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
                        <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Category' : 'Add Category'}</h2>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Name</label>
                                <input
                                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g. Starters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Slug (Optional)</label>
                                <input
                                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                    value={newItem.slug}
                                    onChange={e => setNewItem({ ...newItem, slug: e.target.value })}
                                    placeholder="e.g. starters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Sort Order</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                    value={newItem.sort_order}
                                    onChange={e => setNewItem({ ...newItem, sort_order: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="submit"
                                    className={`flex-1 text-white px-4 py-3 rounded-xl font-bold transition-colors ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                >
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="p-4 w-20">Order</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Slug</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50 group">
                                        <td className="p-4 font-mono text-gray-500">{cat.sort_order}</td>
                                        <td className="p-4 font-bold text-gray-900">{cat.name}</td>
                                        <td className="p-4 text-gray-500 text-sm">{cat.slug}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-400">
                                            No categories found. Create one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
