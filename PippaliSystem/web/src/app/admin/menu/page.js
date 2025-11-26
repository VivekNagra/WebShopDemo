'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function AdminMenuPage() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [optionGroups, setOptionGroups] = useState([]);
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        base_price: '',
        category_id: '',
        category_id: '',
        menu_number: '',
        dish_type: '',
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        option_group_ids: []
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, catRes, optRes] = await Promise.all([
                api.get('/menu/'),
                api.get('/categories/'),
                api.get('/option-groups/')
            ]);
            setMenuItems(menuRes.data);
            setCategories(catRes.data);
            setOptionGroups(optRes.data);

            // Default category if creating new item
            if (catRes.data.length > 0 && !editingId) {
                setNewItem(prev => ({ ...prev, category_id: catRes.data[0].id }));
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.base_price || !newItem.category_id) {
            alert('Please fill in Name, Price, and Category');
            return;
        }

        try {
            if (editingId) {
                await api.put(`/menu/${editingId}`, newItem);
                alert('Item updated successfully');
            } else {
                await api.post('/menu/', newItem);
                alert('Item created successfully');
            }
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error saving item');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setNewItem({
            name: item.name,
            description: item.description || '',
            base_price: item.base_price,
            category_id: item.category_id,
            category_id: item.category_id,
            menu_number: item.menu_number || '',
            dish_type: item.dish_type || '',
            is_vegetarian: item.is_vegetarian,
            is_vegan: item.is_vegan,
            is_gluten_free: item.is_gluten_free,
            option_group_ids: item.option_groups ? item.option_groups.map(g => g.id) : []
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/menu/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error deleting item');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setNewItem({
            name: '',
            description: '',
            base_price: '',
            category_id: categories[0]?.id || '',
            menu_number: '',
            dish_type: '',
            is_vegetarian: false,
            is_vegan: false,
            is_gluten_free: false,
            option_group_ids: []
        });
    };

    const toggleOptionGroup = (groupId) => {
        setNewItem(prev => {
            const current = prev.option_group_ids;
            if (current.includes(groupId)) {
                return { ...prev, option_group_ids: current.filter(id => id !== groupId) };
            } else {
                return { ...prev, option_group_ids: [...current, groupId] };
            }
        });
    };


    const itemsByCategory = categories.map(cat => ({
        ...cat,
        items: menuItems.filter(item => item.category_id === cat.id)
    }));

    return (
        <div className="container mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold">Menu Management</h1>
            </div>

            {/* Add/Edit Item Form */}
            <div className="card p-8 mb-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
                    {editingId && (
                        <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-900 font-medium">
                            Cancel Edit
                        </button>
                    )}
                </div>
                <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Name</label>
                            <input
                                className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="e.g. Chicken Tikka"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Category</label>
                            <select
                                className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                value={newItem.category_id}
                                onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Dish Type</label>
                            <select
                                className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                value={newItem.dish_type}
                                onChange={e => setNewItem({ ...newItem, dish_type: e.target.value })}
                            >
                                <option value="">Select Type...</option>
                                <option value="CHICKEN">Chicken</option>
                                <option value="LAMB">Lamb</option>
                                <option value="VEGETARIAN">Vegetarian</option>
                                <option value="SEAFOOD">Seafood</option>
                                <option value="RICE">Rice</option>
                                <option value="NAAN">Naan</option>
                                <option value="SODA">Soda</option>
                                <option value="JUICE">Juice</option>
                                <option value="LASSI">Lassi</option>
                                <option value="WATER">Water</option>
                                <option value="ALCOHOL">Alcohol</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700">Description</label>
                        <input
                            className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            placeholder="Description"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Price (kr.)</label>
                            <input
                                type="number"
                                className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                value={newItem.base_price}
                                onChange={e => setNewItem({ ...newItem, base_price: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Menu #</label>
                            <input
                                type="number"
                                className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                                value={newItem.menu_number}
                                onChange={e => setNewItem({ ...newItem, menu_number: e.target.value })}
                                placeholder="#"
                            />
                        </div>

                        {/* Dietary Flags */}
                        <div className="flex gap-4 pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newItem.is_vegetarian}
                                    onChange={e => setNewItem({ ...newItem, is_vegetarian: e.target.checked })}
                                />
                                <span className="text-sm">Veg</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newItem.is_vegan}
                                    onChange={e => setNewItem({ ...newItem, is_vegan: e.target.checked })}
                                />
                                <span className="text-sm">Vegan</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newItem.is_gluten_free}
                                    onChange={e => setNewItem({ ...newItem, is_gluten_free: e.target.checked })}
                                />
                                <span className="text-sm">GF</span>
                            </label>
                        </div>
                    </div>

                    {/* Option Groups Selection */}
                    <div className="border-t pt-4 mt-4">
                        <label className="block text-sm font-bold mb-2">Option Groups (Add-ons & Choices)</label>
                        <div className="flex flex-wrap gap-3">
                            {optionGroups.map(group => (
                                <label key={group.id} className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer select-none ${newItem.option_group_ids.includes(group.id) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <input
                                        type="checkbox"
                                        checked={newItem.option_group_ids.includes(group.id)}
                                        onChange={() => toggleOptionGroup(group.id)}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium">{group.name}</span>
                                </label>
                            ))}
                            {optionGroups.length === 0 && (
                                <span className="text-sm text-gray-500 italic">No option groups created yet. Go to Options page to create some.</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className={`w-full text-white px-6 py-3 rounded font-bold ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {editingId ? 'Update Item' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Menu List by Category */}
            <div className="space-y-8">
                {itemsByCategory.map(category => (
                    <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="p-4 w-16">#</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4 w-24">Price</th>
                                    <th className="p-4 w-24">Type</th>
                                    <th className="p-4 w-32">Tags</th>
                                    <th className="p-4 w-32">Options</th>
                                    <th className="p-4 w-24">Status</th>
                                    <th className="p-4 w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {category.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-400 italic">
                                            No items in this category yet.
                                        </td>
                                    </tr>
                                ) : (
                                    category.items.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-gray-500 font-mono">{item.menu_number || '-'}</td>
                                            <td className="p-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="p-4 text-gray-600 text-sm">{item.description}</td>
                                            <td className="p-4 font-bold text-gray-900">{item.base_price}</td>
                                            <td className="p-4">
                                                {item.dish_type && (
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                        {item.dish_type}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-1">
                                                    {item.is_vegetarian && <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-800 font-bold">V</span>}
                                                    {item.is_vegan && <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-800 font-bold">VG</span>}
                                                    {item.is_gluten_free && <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-800 font-bold">GF</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.option_groups && item.option_groups.map(g => (
                                                        <span key={g.id} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-200">
                                                            {g.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}
