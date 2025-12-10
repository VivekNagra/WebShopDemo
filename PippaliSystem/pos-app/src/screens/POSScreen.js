import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal, SectionList, Alert, useWindowDimensions, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import client from '../api/client';

// Draggable Table Component
const DraggableTable = ({ table, floorLayout, onMove, onJoin, onPress, onLongPress, isSelected, isJoined }) => {
    const pan = React.useRef(new Animated.ValueXY()).current;
    const [isDragging, setIsDragging] = React.useState(false);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only drag if moved significantly (prevent accidental drags on taps)
                return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
            },
            onPanResponderGrant: () => {
                setIsDragging(true);
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value
                });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                setIsDragging(false);
                pan.flattenOffset();

                // Calculate new position in percentage
                const currentX = (table.position_x / 100) * floorLayout.width;
                const currentY = (table.position_y / 100) * floorLayout.height;

                const newX = currentX + gestureState.dx;
                const newY = currentY + gestureState.dy;

                const newXPercent = (newX / floorLayout.width) * 100;
                const newYPercent = (newY / floorLayout.height) * 100;

                // Check for collision/drop target (Simple center-to-center check)
                // We'll pass the raw event or coords to parent to handle collision logic
                // For now, just update position locally and let parent handle logic
                onMove(table.id, newXPercent, newYPercent);
            }
        })
    ).current;

    // Reset pan position when table prop changes (external update)
    React.useEffect(() => {
        pan.setValue({ x: 0, y: 0 });
    }, [table.position_x, table.position_y]);

    return (
        <Animated.View
            style={{
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                position: 'absolute',
                left: `${table.position_x}%`,
                top: `${table.position_y}%`,
                zIndex: isDragging ? 100 : 1,
            }}
            {...panResponder.panHandlers}
        >
            <TouchableOpacity
                style={[
                    styles.tableCard, // Use relative style inside absolute Animated.View
                    table.is_occupied ? styles.tableOccupied : styles.tableFree,
                    isSelected && styles.tableSelected,
                    isJoined && styles.tableJoined
                ]}
                onPress={() => !isDragging && onPress(table)}
                onLongPress={() => !isDragging && onLongPress(table)}
                delayLongPress={200} // Trigger faster
                activeOpacity={0.9}
            >
                <View style={[styles.tableIndicator, table.is_occupied ? styles.indicatorOccupied : styles.indicatorFree]} />
                <Text style={styles.tableNumber} selectable={false}>{table.number}</Text>
                {isJoined && <Text style={styles.linkedText} selectable={false}>🔗</Text>}
            </TouchableOpacity>
        </Animated.View>
    );
};

// Split Bill Modal Component
const SplitBillModal = ({ visible, onClose, table, tables, onSplit }) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [targetTableId, setTargetTableId] = useState(null);
    const [orderItems, setOrderItems] = useState([]);

    useEffect(() => {
        if (visible && table) {
            fetchOrder();
        }
    }, [visible, table]);

    const fetchOrder = async () => {
        try {
            // Fetch active order for this table
            // Assuming backend has an endpoint or we filter orders
            // For now, we'll mock it or use a specific endpoint if available
            // Let's assume we can get order items from a new endpoint or existing state
            // For this demo, we might need to fetch 'active order' for table.
            // Let's try GET /orders/table/{table_id} if it exists, or just list orders.
            const res = await client.get(`/orders/active/${table.id}`); // Need to ensure this exists or use alternative
            setOrderItems(res.data.items || []);
        } catch (error) {
            console.log('No active order or error fetching');
            setOrderItems([]);
        }
    };

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            if (prev.includes(itemId)) return prev.filter(id => id !== itemId);
            return [...prev, itemId];
        });
    };

    const handleSplit = () => {
        if (selectedItems.length === 0) {
            Alert.alert('Error', 'Select items to move');
            return;
        }
        if (!targetTableId) {
            Alert.alert('Error', 'Select a target table');
            return;
        }
        onSplit(table.id, targetTableId, selectedItems);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Split / Transfer Items</Text>
                        <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>Close</Text></TouchableOpacity>
                    </View>

                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        {/* Left: Items */}
                        <View style={{ flex: 1, padding: 10, borderRightWidth: 1, borderColor: '#eee' }}>
                            <Text style={styles.groupTitle}>Select Items from Table {table?.number}</Text>
                            <FlatList
                                data={orderItems}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.orderItem, selectedItems.includes(item.id) && { backgroundColor: '#e3f2fd' }]}
                                        onPress={() => toggleItemSelection(item.id)}
                                    >
                                        <Text>{item.menu_item_name} (x{item.quantity})</Text>
                                        {selectedItems.includes(item.id) && <Text>✓</Text>}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        {/* Right: Target Table */}
                        <View style={{ flex: 1, padding: 10 }}>
                            <Text style={styles.groupTitle}>Move to Table</Text>
                            <FlatList
                                data={tables.filter(t => t.id !== table?.id)}
                                keyExtractor={t => t.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.optionBtn, targetTableId === item.id && styles.selectedOptionBtn, { marginBottom: 8 }]}
                                        onPress={() => setTargetTableId(item.id)}
                                    >
                                        <Text style={[styles.optionBtnText, targetTableId === item.id && styles.selectedOptionBtnText]}>
                                            Table {item.number}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSplit}>
                        <Text style={styles.submitBtnText}>Transfer Selected Items</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default function POSScreen() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});

    // Table Management State
    const [tables, setTables] = useState([]);
    const [currentTable, setCurrentTable] = useState(null);
    const [viewMode, setViewMode] = useState('floor_plan'); // 'floor_plan' or 'order'

    // Multi-Select & Joining
    const [selectedTableIds, setSelectedTableIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Floor Plan Dimensions for Lines
    const [floorLayout, setFloorLayout] = useState({ width: 0, height: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, catRes, tablesRes] = await Promise.all([
                client.get('/menu/'),
                client.get('/categories/'),
                client.get('/tables')
            ]);
            setMenuItems(menuRes.data);
            setCategories(catRes.data);
            setTables(tablesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Could not fetch menu data');
        } finally {
            setLoading(false);
        }
    };

    const handleItemPress = (item) => {
        if (item.option_groups && item.option_groups.length > 0) {
            setSelectedItem(item);
            setSelectedOptions({});
            setModalVisible(true);
        } else {
            addToOrder(item);
        }
    };

    const handleOptionSelect = (group, option) => {
        setSelectedOptions(prev => {
            const currentSelection = prev[group.id];

            if (group.allows_multiple) {
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
                return { ...prev, [group.id]: option };
            }
        });
    };

    const confirmAddToCart = () => {
        // Validate required groups
        const missingRequired = selectedItem.option_groups.filter(g => {
            if (!g.is_required) return false;
            const selection = selectedOptions[g.id];
            if (g.allows_multiple) {
                return !selection || selection.length === 0;
            }
            return !selection;
        });

        if (missingRequired.length > 0) {
            Alert.alert('Required', `Please select a ${missingRequired[0].name}`);
            return;
        }

        // Calculate Final Price
        let priceModifier = 0;
        Object.values(selectedOptions).forEach(val => {
            if (Array.isArray(val)) {
                val.forEach(opt => priceModifier += (parseFloat(opt.price_delta) || 0));
            } else if (val) {
                priceModifier += (parseFloat(val.price_delta) || 0);
            }
        });
        const finalPrice = (parseFloat(selectedItem.base_price) || 0) + priceModifier;

        addToOrder(selectedItem, selectedOptions, finalPrice);
        setModalVisible(false);
        setSelectedItem(null);
        setSelectedOptions({});
    };

    const addToOrder = (item, options = {}, finalPrice = null) => {
        setOrderItems(currentItems => {
            // Unique key for item + options
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

            const existingItem = currentItems.find(i => i.uniqueId === uniqueId);

            if (existingItem) {
                return currentItems.map(i =>
                    i.uniqueId === uniqueId ? { ...i, quantity: i.quantity + 1 } : i
                );
            }

            return [...currentItems, {
                ...item,
                uniqueId,
                selectedOptions: options,
                quantity: 1,
                finalPrice: parseFloat(finalPrice || item.base_price)
            }];
        });
    };

    const removeFromOrder = (item) => {
        setOrderItems(currentItems => {
            const existingItem = currentItems.find(i => i.uniqueId === item.uniqueId);
            if (existingItem.quantity > 1) {
                return currentItems.map(i =>
                    i.uniqueId === item.uniqueId ? { ...i, quantity: i.quantity - 1 } : i
                );
            }
            return currentItems.filter(i => i.uniqueId !== item.uniqueId);
        });
    };

    const submitOrder = async () => {
        if (orderItems.length === 0) return;

        try {
            // If table is a child, find the parent to assign the order to
            // (Backend handles this logic usually, but good to be explicit if we had full local state)
            // For now, just send the current table number.

            const orderData = {
                type: "DINE_IN",
                source: "POS",
                table_number: currentTable ? currentTable.number : null,
                items: orderItems.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    // TODO: Backend update for options on order items
                }))
            };

            await client.post('/orders/', orderData);

            // Update table status
            if (currentTable) {
                // If it's a joined group, we might want to update the parent?
                // The backend should handle syncing status to children if parent is updated.
                await client.put(`/tables/${currentTable.id}`, { is_occupied: true });

                const tablesRes = await client.get('/tables');
                setTables(tablesRes.data);
                setViewMode('floor_plan');
                setCurrentTable(null);
            }

            Alert.alert('Success', 'Order sent to kitchen!');
            setOrderItems([]);
        } catch (error) {
            console.error('Error submitting order:', error);
            Alert.alert('Error', 'Could not submit order');
        }
    };

    const handleTableLongPress = (table) => {
        // If table is joined, show Group Options
        const isJoined = !!table.parent_id || tables.some(t => t.parent_id === table.id);
        if (isJoined) {
            setGroupOptionsTable(table);
            setGroupOptionsVisible(true);
            return;
        }

        setIsSelectionMode(true);
        toggleTableSelection(table.id);
    };

    const handleTablePress = (table) => {
        if (isSelectionMode) {
            toggleTableSelection(table.id);
        } else {
            // Normal mode
            if (table.parent_id) {
                // If child, find parent to open
                const parent = tables.find(t => t.id === table.parent_id);
                if (parent) {
                    setCurrentTable(parent);
                } else {
                    setCurrentTable(table); // Fallback
                }
            } else {
                setCurrentTable(table);
            }
            setViewMode('order');
        }
    };

    const toggleTableSelection = (id) => {
        setSelectedTableIds(prev => {
            if (prev.includes(id)) {
                const newList = prev.filter(tid => tid !== id);
                if (newList.length === 0) setIsSelectionMode(false);
                return newList;
            } else {
                return [...prev, id];
            }
        });
    };

    const handleJoinTables = async () => {
        if (selectedTableIds.length < 2) {
            Alert.alert('Error', 'Select at least 2 tables to join');
            return;
        }

        if (floorLayout.width === 0) {
            Alert.alert('Error', 'Floor plan not ready. Try again.');
            return;
        }

        try {
            // 1. Expand Selection to include entire groups
            // If any selected table is part of a group, include the whole group.
            const allInvolvedTableIds = new Set(selectedTableIds);

            selectedTableIds.forEach(id => {
                const table = tables.find(t => t.id === id);
                if (table) {
                    // If it has a parent, add parent and all siblings
                    const parentId = table.parent_id || (tables.find(t => t.parent_id === table.id) ? table.id : null);

                    if (parentId) {
                        allInvolvedTableIds.add(parentId);
                        tables.filter(t => t.parent_id === parentId).forEach(child => {
                            allInvolvedTableIds.add(child.id);
                        });
                    }
                }
            });

            const finalSelectedIds = Array.from(allInvolvedTableIds);
            const selectedTables = tables.filter(t => finalSelectedIds.includes(t.id));

            // 2. Determine Parent (Lowest ID)
            const sortedTables = [...selectedTables].sort((a, b) => a.id - b.id);
            const parent = sortedTables[0];
            const children = sortedTables.slice(1);

            // 2. Calculate New Positions for Group
            // Table width is 100px. Let's add 10px gap.
            const tableWidthPx = 110;
            const widthPercent = (tableWidthPx / floorLayout.width) * 100;
            const heightPercent = (100 / floorLayout.height) * 100; // Approx height % for collision

            // Map of updates: tableId -> { position_x, position_y }
            const updates = {};

            // Place children next to parent
            children.forEach((child, index) => {
                updates[child.id] = {
                    position_x: parent.position_x + (widthPercent * (index + 1)),
                    position_y: parent.position_y
                };
            });

            // 3. Collision Resolution (Shift Row)
            // Instead of complex ripple, we simply check if the new group overlaps anything.
            // If it does, we shift ALL tables to the right of the group by the group's width.

            // Calculate Group Bounding Box
            const groupStartX = parent.position_x;
            const groupWidth = widthPercent * (children.length + 1); // Parent + Children
            const groupEndX = groupStartX + groupWidth;
            const groupY = parent.position_y;

            // Find tables that need shifting
            // Criteria: 
            // 1. Not in the new group
            // 2. On the same "row" (approx Y)
            // 3. To the right of the parent (start X > parent X)
            // 4. Actually overlapping or close enough to need space?
            //    Actually, let's just shift EVERYTHING to the right of the parent to be safe.
            //    This ensures we always            
            const tablesToShift = tables.filter(t =>
                !finalSelectedIds.includes(t.id) && // Not in group (using expanded list)
                Math.abs(t.position_y - groupY) < heightPercent && // Same row
                t.position_x > groupStartX // To the right
            );

            // Shift them
            tablesToShift.forEach(t => {
                // If it was already to the right, ensure it's at least groupEndX
                // Or just add the width of the added children?
                // The parent was already there. We added `children.length` tables.
                // So we need to shift everything by `widthPercent * children.length`.

                const shiftAmount = widthPercent * children.length;

                // Only shift if it's actually in the way?
                // User said "if a row of tables cross over".
                // Let's check overlap first.
                if (t.position_x < groupEndX) {
                    // It's inside the new group area. Shift it!
                    // But we should shift it relative to its current pos?
                    // Or just push it to the end?
                    // Simplest: Shift everything to the right by the added width.

                    updates[t.id] = {
                        position_x: t.position_x + shiftAmount,
                        position_y: t.position_y
                    };
                }
            });

            // 4. Call Join API FIRST to save original positions
            // Use finalSelectedIds to ensure backend knows about all of them
            await client.post('/tables/join', { table_ids: finalSelectedIds });

            // 5. Apply Updates to Backend (Snap & Shift)
            const updatePromises = Object.keys(updates).map(tableId => {
                return client.put(`/tables/${tableId}`, updates[tableId]);
            });

            await Promise.all(updatePromises);

            Alert.alert('Success', 'Tables joined and reorganized!');

            // Refresh
            const res = await client.get('/tables');
            setTables(res.data);

            // Reset selection
            setSelectedTableIds([]);
            setIsSelectionMode(false);
        } catch (error) {
            console.error('Join error:', error);
            Alert.alert('Error', 'Could not join tables');
        }
    };

    const handleDisjoinTable = async () => {
        if (!currentTable) return;

        // TODO: Check for items and show Split Modal
        // For now, simple disjoin (transfer all to parent/current)

        Alert.alert(
            'Disjoin Tables',
            'Are you sure you want to separate these tables?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disjoin',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.post(`/tables/${currentTable.id}/disjoin`, {});
                            Alert.alert('Success', 'Tables separated');
                            const res = await client.get('/tables');
                            setTables(res.data);
                            setViewMode('floor_plan');
                            setCurrentTable(null);
                        } catch (error) {
                            Alert.alert('Error', 'Could not disjoin');
                        }
                    }
                }
            ]
        );
    };

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);


    const sections = categories.map(cat => ({
        title: cat.name,
        data: menuItems.filter(item => item.category_id === cat.id)
    })).filter(section => section.data.length > 0);

    const renderMenuItem = ({ item }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.menuItemContent}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.menuItemPrice}>{item.base_price} kr.</Text>
            </View>
            <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
            </View>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    const renderOrderItem = ({ item }) => {
        const validOptions = item.selectedOptions
            ? Object.values(item.selectedOptions).flat().filter(opt => opt && opt.name)
            : [];

        return (
            <View style={styles.orderItem}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.orderItemName}>{item.name}</Text>

                    {validOptions.map((opt, index) => (
                        <Text key={`${opt.id}-${index}`} style={styles.orderItemOption}>
                            + {opt.name} ({parseFloat(opt.price_delta) > 0 ? parseFloat(opt.price_delta).toFixed(2) : 0} kr)
                        </Text>
                    ))}
                    <Text style={styles.orderItemPrice}>@ {item.finalPrice.toFixed(2)} kr.</Text>
                </View>
                <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={() => removeFromOrder(item)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => addToOrder(item, item.selectedOptions, item.finalPrice)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>{(item.finalPrice * item.quantity).toFixed(2)}</Text>
            </View>
        );
    };


    const getCurrentModalTotal = () => {
        if (!selectedItem) return 0;
        let modifier = 0;
        Object.values(selectedOptions).forEach(val => {
            if (Array.isArray(val)) {
                val.forEach(opt => modifier += (parseFloat(opt.price_delta) || 0));
            } else if (val) {
                modifier += (parseFloat(val.price_delta) || 0);
            }
        });
        return (parseFloat(selectedItem.base_price) || 0) + modifier;
    };


    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [orderModalVisible, setOrderModalVisible] = useState(false);

    // Sidebar State
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [adminModalVisible, setAdminModalVisible] = useState(false);

    const handleAdminPress = () => {
        setSidebarVisible(false);
        setAdminModalVisible(true);
    };

    // Group Options Modal State
    const [groupOptionsVisible, setGroupOptionsVisible] = useState(false);
    const [groupOptionsTable, setGroupOptionsTable] = useState(null);
    const [splitModalVisible, setSplitModalVisible] = useState(false); // New Split Modal State

    const handleGroupAction = async (action) => {
        if (!groupOptionsTable) return;
        setGroupOptionsVisible(false);

        try {
            if (action === 'ungroup_all') {
                // Disjoin entire group
                await client.post(`/tables/${groupOptionsTable.id}/disjoin`, {});
            } else if (action === 'remove_one') {
                // Remove specific table
                await client.post(`/tables/${groupOptionsTable.id}/disjoin`, {
                    remove_table_ids: [groupOptionsTable.id]
                });
            } else if (action === 'split_bill') {
                // Open Split Modal
                setSplitModalVisible(true);
                return; // Don't refresh tables yet
            }

            Alert.alert('Success', 'Updated group');
            const res = await client.get('/tables');
            setTables(res.data);
        } catch (error) {
            console.error('Group action error:', error);
            Alert.alert('Error', 'Could not update group');
        }
    };

    const handleSplitItems = async (sourceTableId, targetTableId, itemIds) => {
        try {
            await client.post('/orders/split', {
                source_table_id: sourceTableId,
                target_splits: [
                    {
                        table_id: targetTableId,
                        item_ids: itemIds
                    }
                ]
            });
            Alert.alert('Success', 'Items transferred');
            setSplitModalVisible(false);
            // Refresh tables/orders?
        } catch (error) {
            console.error('Split error:', error);
            Alert.alert('Error', 'Could not split items');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
                    <Text style={styles.menuButtonText}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerText}>
                    {currentTable ? `Table ${currentTable.number}` : (isSelectionMode ? `${selectedTableIds.length} Selected` : 'Select Table')}
                </Text>

                {isSelectionMode ? (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => {
                            setIsSelectionMode(false);
                            setSelectedTableIds([]);
                        }} style={[styles.joinBtn, { backgroundColor: '#666' }]}>
                            <Text style={styles.joinBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleJoinTables} style={styles.joinBtn}>
                            <Text style={styles.joinBtnText}>Join</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    currentTable ? (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {(currentTable.children && currentTable.children.length > 0) && (
                                <TouchableOpacity onPress={handleDisjoinTable} style={[styles.switchTableBtn, { backgroundColor: '#d32f2f' }]}>
                                    <Text style={styles.switchTableBtnText}>Disjoin</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setViewMode('floor_plan')} style={styles.switchTableBtn}>
                                <Text style={styles.switchTableBtnText}>Tables</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={fetchData} style={styles.switchTableBtn}>
                            <Text style={styles.switchTableBtnText}>Refresh</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>

            {viewMode === 'floor_plan' ? (
                <View style={styles.floorPlanContainer}>
                    <Text style={styles.floorPlanTitle}>Restaurant Floor</Text>
                    <View
                        style={styles.floorArea}
                        onLayout={(event) => {
                            const { width, height } = event.nativeEvent.layout;
                            setFloorLayout({ width, height });
                        }}
                    >
                        {tables.map(table => {
                            const isSelected = selectedTableIds.includes(table.id);
                            const isJoined = !!table.parent_id || tables.some(t => t.parent_id === table.id);

                            return (
                                <DraggableTable
                                    key={table.id}
                                    table={table}
                                    floorLayout={floorLayout}
                                    isSelected={isSelected}
                                    isJoined={isJoined}
                                    onPress={handleTablePress}
                                    onLongPress={handleTableLongPress}
                                    onMove={async (id, x, y) => {
                                        // 1. Check for Drop-to-Join
                                        // Find if we dropped onto another table
                                        const droppedTable = tables.find(t => {
                                            if (t.id === id) return false;
                                            const tX = t.position_x;
                                            const tY = t.position_y;
                                            // Simple proximity check (within 5%)
                                            return Math.abs(tX - x) < 5 && Math.abs(tY - y) < 5;
                                        });

                                        if (droppedTable) {
                                            // Trigger Join
                                            Alert.alert(
                                                'Join Tables',
                                                `Join Table ${table.number} with Table ${droppedTable.number}?`,
                                                [
                                                    {
                                                        text: 'Cancel', onPress: () => {
                                                            // Reset position? For now, just leave it where dropped or refresh
                                                            fetchData();
                                                        }
                                                    },
                                                    {
                                                        text: 'Join', onPress: async () => {
                                                            // Select both and call join
                                                            setSelectedTableIds([table.id, droppedTable.id]);
                                                            // We need to wait for state update?
                                                            // Actually, handleJoinTables uses 'selectedTableIds' state.
                                                            // Better to call a direct join function.

                                                            // Hack: Set state then call logic?
                                                            // Or refactor handleJoinTables to accept IDs.
                                                            // Let's call API directly here for speed.
                                                            try {
                                                                await client.post('/tables/join', { table_ids: [table.id, droppedTable.id] });
                                                                Alert.alert('Success', 'Tables joined!');
                                                                fetchData();
                                                            } catch (e) {
                                                                Alert.alert('Error', 'Could not join');
                                                            }
                                                        }
                                                    }
                                                ]
                                            );
                                        } else {
                                            // Just Move
                                            try {
                                                await client.put(`/tables/${id}`, { position_x: x, position_y: y });
                                                // Update local state to prevent snap back
                                                setTables(prev => prev.map(t => t.id === id ? { ...t, position_x: x, position_y: y } : t));
                                            } catch (error) {
                                                console.error('Move error:', error);
                                            }
                                        }
                                    }}
                                />
                            );
                        })}
                    </View>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={[styles.menuSection, isMobile && { flex: 1, borderRightWidth: 0 }]}>
                        {loading ? (
                            <Text style={styles.loadingText}>Loading menu...</Text>
                        ) : (
                            <SectionList
                                sections={sections}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderMenuItem}
                                renderSectionHeader={renderSectionHeader}
                                contentContainerStyle={[styles.menuList, isMobile && { paddingBottom: 100 }]} // Add padding for floating button
                                stickySectionHeadersEnabled={true}
                            />
                        )}
                    </View>

                    {!isMobile && (
                        <View style={styles.orderSection}>
                            <Text style={styles.orderTitle}>Current Order</Text>
                            <FlatList
                                data={orderItems}
                                keyExtractor={(item) => item.uniqueId}
                                renderItem={renderOrderItem}
                                contentContainerStyle={styles.orderList}
                                ListEmptyComponent={
                                    <Text style={styles.emptyOrderText}>No items added</Text>
                                }
                            />

                            <View style={styles.footer}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total:</Text>
                                    <Text style={styles.totalAmount}>{totalAmount.toFixed(2)} kr.</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.submitBtn, orderItems.length === 0 && styles.disabledBtn]}
                                    onPress={submitOrder}
                                    disabled={orderItems.length === 0}
                                >
                                    <Text style={styles.submitBtnText}>Send to Kitchen</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Sidebar Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={sidebarVisible}
                onRequestClose={() => setSidebarVisible(false)}
            >
                <TouchableOpacity
                    style={styles.sidebarOverlay}
                    activeOpacity={1}
                    onPress={() => setSidebarVisible(false)}
                >
                    <View style={styles.sidebar}>
                        <View style={styles.sidebarHeader}>
                            <Text style={styles.sidebarTitle}>Menu</Text>
                            <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.sidebarItem} onPress={handleAdminPress}>
                            <Text style={styles.sidebarItemText}>Admin Panel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sidebarItem} onPress={() => setSidebarVisible(false)}>
                            <Text style={styles.sidebarItemText}>Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sidebarItem} onPress={() => setSidebarVisible(false)}>
                            <Text style={styles.sidebarItemText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {isMobile && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={orderModalVisible}
                    onRequestClose={() => setOrderModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: '90%', width: '95%' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Current Order</Text>
                                <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                                    <Text style={styles.closeBtn}>Close</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={orderItems}
                                keyExtractor={(item) => item.uniqueId}
                                renderItem={renderOrderItem}
                                contentContainerStyle={styles.orderList}
                                ListEmptyComponent={
                                    <Text style={styles.emptyOrderText}>No items added</Text>
                                }
                            />

                            <View style={styles.footer}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total:</Text>
                                    <Text style={styles.totalAmount}>{totalAmount.toFixed(2)} kr.</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.submitBtn, orderItems.length === 0 && styles.disabledBtn]}
                                    onPress={() => {
                                        submitOrder();
                                        setOrderModalVisible(false);
                                    }}
                                    disabled={orderItems.length === 0}
                                >
                                    <Text style={styles.submitBtnText}>Send to Kitchen</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {isMobile && orderItems.length > 0 && !orderModalVisible && (
                <TouchableOpacity
                    style={styles.floatingOrderBtn}
                    onPress={() => setOrderModalVisible(true)}
                >
                    <View style={styles.floatingBtnContent}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{orderItems.reduce((acc, item) => acc + item.quantity, 0)}</Text>
                        </View>
                        <Text style={styles.floatingBtnText}>View Order</Text>
                        <Text style={styles.floatingBtnPrice}>{totalAmount.toFixed(2)} kr.</Text>
                    </View>
                </TouchableOpacity>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtn}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedItem?.option_groups?.map(group => (
                                <View key={group.id} style={styles.optionGroup}>
                                    <Text style={styles.groupTitle}>
                                        {group.name} {group.is_required && <Text style={{ color: 'red' }}>*</Text>}
                                    </Text>
                                    <View style={styles.optionsGrid}>
                                        {group.options.map(option => {
                                            const currentSelection = selectedOptions[group.id];
                                            let isSelected = false;

                                            if (group.allows_multiple) {
                                                isSelected = Array.isArray(currentSelection) && currentSelection.find(o => o.id === option.id);
                                            } else {
                                                isSelected = currentSelection?.id === option.id;
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={option.id}
                                                    style={[
                                                        styles.optionBtn,
                                                        isSelected && styles.selectedOptionBtn,
                                                        group.allows_multiple && styles.checkboxBtn // Optional: different style for checkbox
                                                    ]}
                                                    onPress={() => handleOptionSelect(group, option)}
                                                >
                                                    <Text style={[styles.optionBtnText, isSelected && styles.selectedOptionBtnText]}>
                                                        {option.name} {option.price_delta > 0 && `(+${option.price_delta} kr)`}
                                                    </Text>
                                                    {isSelected && <Text style={{ color: '#000', fontWeight: 'bold' }}>✓</Text>}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.addToCartBtn} onPress={confirmAddToCart}>
                            <Text style={styles.addToCartBtnText}>
                                Add to Order • {Number(getCurrentModalTotal()).toFixed(2)} kr.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* Admin WebView Modal */}
            <Modal
                animationType="slide"
                presentationStyle="pageSheet"
                visible={adminModalVisible}
                onRequestClose={() => setAdminModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Admin Panel</Text>
                        <TouchableOpacity onPress={() => setAdminModalVisible(false)}>
                            <Text style={styles.closeBtn}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={{ uri: 'https://biserial-cutaneously-emmett.ngrok-free.dev/admin' }}
                        style={{ flex: 1 }}
                    />
                </SafeAreaView>
            </Modal>

            {/* Group Options Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={groupOptionsVisible}
                onRequestClose={() => setGroupOptionsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setGroupOptionsVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Group Options</Text>
                            <TouchableOpacity onPress={() => setGroupOptionsVisible(false)}>
                                <Text style={styles.closeBtn}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={{ fontSize: 16, marginBottom: 20 }}>
                                Manage Table {groupOptionsTable?.number}
                            </Text>

                            <TouchableOpacity
                                style={[styles.optionBtn, { backgroundColor: '#2196f3', marginBottom: 10 }]}
                                onPress={() => handleGroupAction('split_bill')}
                            >
                                <Text style={[styles.optionBtnText, { color: '#fff' }]}>Split / Transfer Items</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionBtn, { backgroundColor: '#d32f2f', marginBottom: 10 }]}
                                onPress={() => handleGroupAction('remove_one')}
                            >
                                <Text style={[styles.optionBtnText, { color: '#fff' }]}>Remove This Table</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionBtn, { backgroundColor: '#d32f2f' }]}
                                onPress={() => handleGroupAction('ungroup_all')}
                            >
                                <Text style={[styles.optionBtnText, { color: '#fff' }]}>Ungroup All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Split Bill Modal */}
            <SplitBillModal
                visible={splitModalVisible}
                onClose={() => setSplitModalVisible(false)}
                table={groupOptionsTable}
                tables={tables}
                onSplit={handleSplitItems}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
    },
    menuSection: {
        flex: 2,
        borderRightWidth: 1,
        borderRightColor: '#ddd',
    },
    orderSection: {
        flex: 1,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
    },
    menuList: {
        padding: 10,
    },
    sectionHeader: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    sectionHeaderText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    menuItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: 15,
        marginBottom: 10,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    menuItemContent: {
        flex: 1,
        paddingRight: 10,
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    menuItemDesc: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        lineHeight: 16,
    },
    menuItemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2e7d32',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffc32d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#1a1a1a',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -2,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    orderList: {
        padding: 10,
        flexGrow: 1,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    orderItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    orderItemOption: {
        fontSize: 13,
        color: '#444',
        marginTop: 2,
        marginLeft: 8,
    },
    orderItemPrice: {
        fontSize: 12,
        color: '#666',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        padding: 2,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    qtyBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    quantity: {
        marginHorizontal: 10,
        fontSize: 14,
        fontWeight: '600',
        minWidth: 16,
        textAlign: 'center',
    },
    itemTotal: {
        fontWeight: 'bold',
        width: 60,
        textAlign: 'right',
        color: '#000',
        fontSize: 14,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    submitBtn: {
        backgroundColor: '#ffc32d',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledBtn: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
    },
    submitBtnText: {
        color: '#1a1a1a',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyOrderText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
        fontSize: 16,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: '#666',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        maxHeight: '80%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    modalHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        color: '#666',
        fontSize: 16,
    },
    modalBody: {
        padding: 20,
    },
    optionGroup: {
        marginBottom: 24,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    selectedOptionBtn: {
        backgroundColor: '#ffc32d',
        borderColor: '#ffc32d',
    },
    optionBtnText: {
        fontSize: 14,
        color: '#333',
    },
    selectedOptionBtnText: {
        color: '#1a1a1a',
        fontWeight: 'bold',
    },
    addToCartBtn: {
        backgroundColor: '#ffc32d',
        padding: 16,
        alignItems: 'center',
        margin: 20,
        borderRadius: 12,
    },
    addToCartBtnText: {
        color: '#1a1a1a',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Floating Button Styles
    floatingOrderBtn: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 50,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    floatingBtnContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    floatingBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    floatingBtnPrice: {
        color: '#ffc32d',
        fontSize: 18,
        fontWeight: 'bold',
    },
    badge: {
        backgroundColor: '#ffc32d',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#1a1a1a',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Sidebar Styles
    menuButton: {
        padding: 10,
    },
    menuButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    sidebarOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
    },
    sidebar: {
        width: 300,
        backgroundColor: '#fff',
        height: '100%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
    },
    sidebarTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    sidebarItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    sidebarItemText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '500',
    },
    // Floor Plan Styles
    floorPlanContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    floorPlanTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        margin: 20,
        color: '#333',
        textAlign: 'center',
    },
    floorArea: {
        flex: 1,
        position: 'relative', // For absolute children
        margin: 20,
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        overflow: 'hidden', // Keep tables inside
    },
    tableCard: {
        width: 100,
        height: 100,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tableSelected: {
        borderColor: '#2196f3',
        borderWidth: 4,
        transform: [{ scale: 1.1 }],
    },
    tableJoined: {
        borderStyle: 'dashed',
        borderColor: '#666',
        borderWidth: 2,
    },
    linkedText: {
        fontSize: 20,
        position: 'absolute',
        bottom: 5,
    },
    joinBtn: {
        backgroundColor: '#2196f3',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    joinBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tableFree: {
        backgroundColor: '#e8f5e9', // Soft Green
        borderColor: '#c8e6c9',
    },
    tableOccupied: {
        backgroundColor: '#ffebee', // Soft Red
        borderColor: '#ffcdd2',
    },
    tableNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 5,
    },
    tableCapacity: {
        fontSize: 14,
        color: '#666',
    },
    tableStatus: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#d32f2f',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tableIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute',
        top: 15,
        right: 15,
    },
    indicatorFree: {
        backgroundColor: '#4caf50',
    },
    indicatorOccupied: {
        backgroundColor: '#f44336',
    },
    switchTableBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    switchTableBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
