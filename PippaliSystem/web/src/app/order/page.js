'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ShoppingBag, Plus, Minus, X, Check } from 'lucide-react';

export default function OrderPage() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({}); // { group_id: option_obj | [option_objs] }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, catRes] = await Promise.all([
                api.get('/menu'),
                api.get('/categories')
            ]);
            setMenuItems(menuRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Cart Logic ---

    const addToCart = (item, options = {}) => {
        setCart(prev => {
            // Generate unique ID based on item ID and sorted option IDs
            const allOptionIds = [];
            Object.values(options).forEach(val => {
                if (Array.isArray(val)) {
                    val.forEach(opt => allOptionIds.push(opt.id));
                } else if (val) {
                    allOptionIds.push(val.id);
                }
            });
            const optionsKey = allOptionIds.sort().join('-');
            const uniqueId = `${item.id}-${optionsKey}`;

            const existing = prev.find(i => i.uniqueId === uniqueId);
            if (existing) {
                return prev.map(i => i.uniqueId === uniqueId ? { ...i, quantity: i.quantity + 1 } : i);
            }

            // Calculate total price for this item instance
            let priceModifier = 0;
            Object.values(options).forEach(val => {
                if (Array.isArray(val)) {
                    val.forEach(opt => priceModifier += (opt.price_modifier || 0));
                } else if (val) {
                    priceModifier += (val.price_modifier || 0);
                }
            });

            return [...prev, {
                ...item,
                uniqueId,
                selectedOptions: options,
                quantity: 1,
                finalPrice: item.base_price + priceModifier
            }];
        });
    };

    const removeFromCart = (uniqueId) => {
        setCart(prev => {
            const existing = prev.find(i => i.uniqueId === uniqueId);
            if (existing.quantity > 1) {
                return prev.map(i => i.uniqueId === uniqueId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.uniqueId !== uniqueId);
        });
    };

    // --- Modal Logic ---

    const openModal = (item) => {
        if (!item.option_groups || item.option_groups.length === 0) {
            addToCart(item);
            return;
        }
        setSelectedItem(item);
        setSelectedOptions({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        setSelectedOptions({});
    };

    const handleOptionSelect = (group, option) => {
        setSelectedOptions(prev => {
            const currentSelection = prev[group.id];

            if (group.allows_multiple) {
                // Multi-select (Checkbox logic)
                const currentList = Array.isArray(currentSelection) ? currentSelection : [];
                const isSelected = currentList.find(o => o.id === option.id);

                let newList;
                if (isSelected) {
                    newList = currentList.filter(o => o.id !== option.id);
                } else {
                    newList = [...currentList, option];
                }
                return { ...prev, [group.id]: newList };
            } else {
                // Single-select (Radio logic)
                return { ...prev, [group.id]: option };
            }
        });
    };

    const handleConfirmAddToCart = () => {
        // Validation
        const missingRequired = selectedItem.option_groups.filter(g => {
            if (!g.is_required) return false;
            const selection = selectedOptions[g.id];
            if (g.allows_multiple) {
                return !selection || selection.length === 0;
            }
            return !selection;
        });

        if (missingRequired.length > 0) {
            alert(`Please select a ${missingRequired[0].name}`);
            return;
        }

        addToCart(selectedItem, selectedOptions);
        closeModal();
    };

    const submitOrder = async () => {
        if (cart.length === 0) return;
        try {
            const orderData = {
                type: "TAKEAWAY",
                source: "WEB",
                items: cart.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity
                    // Note: Backend might need update to store options on order items
                }))
            };
            await api.post('/orders/', orderData);
            alert('Order placed successfully!');
            setCart([]);
        } catch (err) {
            console.error(err);
            alert('Failed to place order');
        }
    };

    const total = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

    // Group items by category
    const itemsByCategory = categories.map(cat => ({
        ...cat,
        items: menuItems.filter(item => item.category_id === cat.id)
    })).filter(cat => cat.items.length > 0);

    if (loading) return <div className="p-8 text-center">Loading menu...</div>;

    return (
        <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8 relative">
            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-6">Menu</h1>

                <div className="space-y-10">
                    {itemsByCategory.map(category => (
                        <div key={category.id}>
                            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">{category.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {category.items.map(item => (
                                    <div key={item.id} className="card p-6 flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{item.name}</h3>
                                            <span className="font-bold text-lg text-[var(--primary)] whitespace-nowrap bg-black/5 px-3 py-1 rounded-full">{item.base_price} kr.</span>
                                        </div>
                                        <p className="text-gray-600 mb-6 text-sm flex-grow leading-relaxed">{item.description}</p>

                                        <div className="flex justify-between items-center mt-auto">
                                            <div className="flex gap-2">
                                                {item.is_vegetarian && <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-bold">Veg</span>}
                                                {item.is_vegan && <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-bold">Vegan</span>}
                                                {item.is_gluten_free && <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 font-bold">GF</span>}
                                            </div>
                                            <button
                                                onClick={() => openModal(item)}
                                                className="bg-[var(--primary)] p-2 rounded-full hover:brightness-110 transition-all shadow-sm"
                                            >
                                                <Plus size={20} className="text-black" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-full md:w-96">
                <div className="bg-white p-6 rounded-2xl shadow-lg sticky top-24 border border-gray-100">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <ShoppingBag /> Your Order
                    </h2>
                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Cart is empty</p>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.uniqueId} className="flex justify-between items-start border-b border-gray-100 pb-4">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">{item.name}</div>
                                        {/* Display Options */}
                                        {item.selectedOptions && Object.values(item.selectedOptions).flat().map(opt => (
                                            <div key={opt.id} className="text-xs text-gray-500 flex items-center gap-1">
                                                <Plus size={10} /> {opt.name}
                                            </div>
                                        ))}
                                        <div className="text-sm font-medium text-gray-700 mt-1">
                                            {item.finalPrice} kr. x {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button onClick={() => removeFromCart(item.uniqueId)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Minus size={14} /></button>
                                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => addToCart(item, item.selectedOptions)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Plus size={14} /></button>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 flex justify-between items-center font-bold text-xl text-gray-900">
                                <span>Total:</span>
                                <span>{total.toFixed(2)} kr.</span>
                            </div>
                            <button
                                onClick={submitOrder}
                                className="w-full btn-primary py-3 rounded-xl font-bold text-lg mt-4 shadow-md hover:shadow-lg transition-all"
                            >
                                Checkout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Customize Item Modal */}
            {isModalOpen && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">{selectedItem.name}</h3>
                            <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto">
                            {selectedItem.option_groups.map(group => (
                                <div key={group.id} className="mb-6 last:mb-0">
                                    <h4 className="font-bold text-gray-800 mb-3 flex justify-between">
                                        {group.name}
                                        {group.is_required && <span className="text-red-500 text-xs uppercase tracking-wider bg-red-50 px-2 py-1 rounded-full">Required</span>}
                                    </h4>
                                    <div className="space-y-2">
                                        {group.options.map(option => {
                                            const currentSelection = selectedOptions[group.id];
                                            let isSelected = false;
                                            if (group.allows_multiple) {
                                                isSelected = Array.isArray(currentSelection) && currentSelection.find(o => o.id === option.id);
                                            } else {
                                                isSelected = currentSelection?.id === option.id;
                                            }

                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleOptionSelect(group, option)}
                                                    className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${isSelected
                                                        ? 'border-[var(--primary)] bg-yellow-50 text-gray-900'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <span className="font-medium">{option.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        {option.price_modifier > 0 && <span className="text-sm text-gray-500">+{option.price_modifier} kr.</span>}
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && <Check size={12} className="text-black" />}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={handleConfirmAddToCart}
                                className="w-full btn-primary py-3 rounded-xl font-bold text-lg shadow-md"
                            >
                                Add to Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
