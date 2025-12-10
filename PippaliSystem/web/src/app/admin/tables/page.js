'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Save, Plus, Trash2, Move } from 'lucide-react';

export default function TableManager() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dragging State
    const [draggingId, setDraggingId] = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await api.get('/tables');
            setTables(res.data);
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMouseDown = (e, tableId) => {
        e.preventDefault(); // Prevent text selection
        setDraggingId(tableId);
    };

    const handleMouseMove = (e) => {
        if (!draggingId || !canvasRef.current) return;

        const canvas = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - canvas.left;
        const y = e.clientY - canvas.top;

        // Convert to percentage
        let xPercent = (x / canvas.width) * 100;
        let yPercent = (y / canvas.height) * 100;

        // Clamp
        xPercent = Math.max(0, Math.min(90, xPercent)); // 90 to keep inside (assuming 10% width)
        yPercent = Math.max(0, Math.min(90, yPercent));

        setTables(prev => prev.map(t =>
            t.id === draggingId ? { ...t, position_x: xPercent, position_y: yPercent } : t
        ));
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    const saveLayout = async () => {
        setSaving(true);
        try {
            // Update all tables
            // Ideally backend supports bulk update, but loop is fine for < 50 tables
            await Promise.all(tables.map(t =>
                api.put(`/tables/${t.id}`, {
                    position_x: t.position_x,
                    position_y: t.position_y
                })
            ));
            alert('Layout saved successfully!');
        } catch (error) {
            console.error('Error saving layout:', error);
            alert('Failed to save layout');
        } finally {
            setSaving(false);
        }
    };

    const addTable = async () => {
        const number = prompt("Enter Table Number:");
        if (!number) return;

        try {
            await api.post('/tables', {
                number,
                capacity: 4,
                position_x: 50, // Center
                position_y: 50
            });
            fetchTables();
        } catch (error) {
            alert('Error creating table (Number might exist)');
        }
    };

    const deleteTable = async (id) => {
        if (!confirm('Delete this table?')) return;
        try {
            await api.delete(`/tables/${id}`);
            fetchTables();
        } catch (error) {
            alert('Error deleting table');
        }
    };

    const autoArrange = (order = 'asc') => {
        const sorted = [...tables].sort((a, b) => {
            const numA = parseInt(a.number) || 0;
            const numB = parseInt(b.number) || 0;
            return order === 'asc' ? numA - numB : numB - numA;
        });

        // Grid Settings
        const cols = 5; // Tables per row
        const startX = 5; // Margin Left %
        const startY = 5; // Margin Top %
        const gapX = 15; // Horizontal Gap %
        const gapY = 20; // Vertical Gap %

        const newTables = sorted.map((table, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;

            return {
                ...table,
                position_x: startX + (col * gapX),
                position_y: startY + (row * gapY)
            };
        });

        setTables(newTables);
    };

    return (
        <div
            className="min-h-screen bg-gray-50 p-8"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Floor Plan Editor</h1>
                        <p className="text-gray-600">Drag tables to rearrange. Click Save to apply.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex gap-2 mr-4">
                            <button
                                onClick={() => autoArrange('asc')}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium"
                                title="Sort Ascending"
                            >
                                1-9
                            </button>
                            <button
                                onClick={() => autoArrange('desc')}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium"
                                title="Sort Descending"
                            >
                                9-1
                            </button>
                        </div>
                        <button
                            onClick={addTable}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                        >
                            <Plus size={20} /> Add Table
                        </button>
                        <button
                            onClick={saveLayout}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition-colors"
                        >
                            <Save size={20} /> {saving ? 'Saving...' : 'Save Layout'}
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className="relative w-full aspect-[4/3] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    style={{
                        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Loading floor plan...</div>
                    ) : (
                        tables.map(table => (
                            <div
                                key={table.id}
                                onMouseDown={(e) => handleMouseDown(e, table.id)}
                                className={`absolute flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 shadow-sm cursor-move transition-shadow
                  ${draggingId === table.id ? 'shadow-xl border-blue-500 z-50 scale-105' : 'border-gray-200 bg-white hover:border-blue-300'}
                `}
                                style={{
                                    left: `${table.position_x}%`,
                                    top: `${table.position_y}%`,
                                    transition: draggingId === table.id ? 'none' : 'all 0.2s ease-out'
                                }}
                            >
                                <div className="absolute top-2 right-2 cursor-pointer text-gray-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }}>
                                    <Trash2 size={14} />
                                </div>
                                <Move size={16} className="text-gray-300 mb-1" />
                                <span className="text-xl font-bold text-gray-800">{table.number}</span>
                                <span className="text-xs text-gray-500">4 Seats</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-2">Instructions</h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li>• Drag tables to position them.</li>
                            <li>• Positions are saved as percentages, so they adapt to screen size.</li>
                            <li>• Changes update immediately in the POS app after saving.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
