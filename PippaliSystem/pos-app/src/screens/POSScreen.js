import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal, SectionList, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import client from '../api/client';
export default function POSScreen() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, catRes] = await Promise.all([
                client.get('/menu/'),
                client.get('/categories/')
            ]);
            setMenuItems(menuRes.data);
            setCategories(catRes.data);
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
            const orderData = {
                type: "DINE_IN",
                source: "POS",
                items: orderItems.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    // TODO: Backend update for options on order items
                }))
            };

            await client.post('/orders/', orderData);
            Alert.alert('Success', 'Order sent to kitchen!');
            setOrderItems([]);
        } catch (error) {
            console.error('Error submitting order:', error);
            Alert.alert('Error', 'Could not submit order');
        }
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
                    <Text style={styles.menuButtonText}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerText}>Pippali POS</Text>
                <View style={{ width: 40 }} />
            </View>

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
                        source={{ uri: 'http://10.0.0.161:3000/admin/menu' }}
                        style={{ flex: 1 }}
                    />
                </SafeAreaView>
            </Modal>
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
    }
});
