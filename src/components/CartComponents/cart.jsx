import React, { useEffect, useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag01Icon } from 'hugeicons-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSelector, useDispatch } from 'react-redux';
import { removeItemFromContainer } from '@/gl_Var_Reducers';
import { X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Payment from './payment';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

const EmptyCart = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Your cart is empty</h3>
            <p className="text-sm text-gray-500">
                Add some delicious items to your cart and they will appear here
            </p>
        </div>
    );
};

export default function Cart({ buttonClassName }) {
    const dispatch = useDispatch();
    const container = useSelector((state) => state.gl_variables.container);
    const order = useSelector((state) => state.gl_variables.order);
    const userInfo = useSelector((state) => state.gl_variables.userInfo);
    const navigate = useNavigate();
    const [showPayment, setShowPayment] = useState(false);
    const [guestName, setGuestName] = useState('');

    useEffect(()=>{
        console.log("hesus",container)
        console.log("order",order)
    },[container])

    const calculateItemTotal = (item) => {
        if (item.food_type === 'MD') {
            let customizationTotal = 0;
            if (item.customizations) {
                Object.values(item.customizations).forEach(choices => {
                    Object.values(choices).forEach(choiceData => {
                        customizationTotal += choiceData.price || 0;
                    });
                });
            }
            return (item.main_dish_price || 0) + customizationTotal;
        } else if (item.food_type === 'SA') {
            // For side items, multiply base_price by quantity
            return item.base_price * item.quantity;
        } else {
            return item.item_price || 0;
        }
    };

    const calculateBasketTotal = (items) => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const totalPrice = Object.values(container)
        .reduce((total, items) => total + calculateBasketTotal(items), 0)
        .toFixed(2);

    const handleRemoveItem = (containerId, itemIndex) => {
        dispatch(removeItemFromContainer({ containerId, itemIndex }));
    };

    const CartItem = ({ item }) => {
        // Calculate main product total based on food type and pricing type
        const mainProductTotal = useMemo(() => {
            if (item.food_type === 'SA') {
                return item.base_price * item.quantity;
            }
            return item.main_dish_price || item.base_price || 0;
        }, [item]);

        const calculateCustomizationsTotal = () => {
            let total = 0;
            if (item.customizations) {
                Object.entries(item.customizations).forEach(([optionId, choices]) => {
                    Object.entries(choices).forEach(([choiceName, choice]) => {
                        // Only include if the choice is available
                        if (choice.is_available) {
                            if (item.food_type === 'PK' && choice.pricing_type === 'INC') {
                                // For package INC items, always include their price
                                total += choice.price;
                            } else if (choice.quantity > 0) {
                                total += choice.price;
                            }
                        }
                    });
                });
            }
            return total;
        };

        const renderCustomizations = () => {
            if (!item.customizations) return null;

            return (
                <div className="mt-2 space-y-2">
                    {Object.entries(item.customizations).map(([category, choices]) => {
                        const availableChoices = Object.entries(choices)
                            .filter(([_, choice]) => choice.is_available && choice.quantity > 0);

                        if (availableChoices.length === 0) return null;

                        return (
                            <div key={category} className="space-y-1">
                                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                    {category}
                                </div>
                                <div className="pl-2 space-y-1">
                                    {availableChoices.map(([choiceName, choice]) => (
                                        <div key={choiceName} 
                                             className="flex justify-between items-center text-[11px]">
                                            <div className="text-gray-400">
                                                • {choiceName}
                                                {choice.quantity > 1 && ` ×${choice.quantity}`}
                                            </div>
                                            <span className="text-gray-500">
                                                GHS {choice.price.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        };

        const itemTotal = mainProductTotal + calculateCustomizationsTotal();

        return (
            <div className="p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800
                          transition-all duration-200 hover:bg-gray-900/70">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-col">
                                <h3 className="font-medium text-gray-200 mb-0.5">
                                    {item.item_name}
                                    {item.pricing_type === 'FIX' && item.quantity > 0 && 
                                        <span className="ml-2 text-sm text-gray-500">×{item.quantity}</span>
                                    }
                                </h3>
                                {item.pricing_type === 'FIX' && (
                                    <span className="text-[11px] text-gray-500">
                                        GHS {item.base_price.toFixed(2)} each
                                    </span>
                                )}
                            </div>
                            <span className="text-yellow-400 font-medium">
                                GHS {mainProductTotal.toFixed(2)}
                            </span>
                        </div>
                        {renderCustomizations()}
                        <div className="mt-2 pt-2 border-t border-gray-800/50 flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total</span>
                            <span className="text-sm font-medium text-yellow-400">
                                GHS {itemTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const BasketContainer = ({ containerId, items }) => {
        const dispatch = useDispatch();
        
        const calculateBasketTotal = () => {
            const itemsTotal = items.reduce((total, item) => {
                let customizationTotal = 0;

                // Calculate customizations total
                if (item.customizations) {
                    Object.entries(item.customizations).forEach(([optionId, optionChoices]) => {
                        Object.entries(optionChoices).forEach(([choiceName, choice]) => {
                            if (item.food_type === 'PK' && choice.pricing_type === 'INC') {
                                customizationTotal += choice.price;
                            } else {
                                if (choice.quantity > 0) {
                                    customizationTotal += choice.price;
                                }
                            }
                        });
                    });
                }

                // Calculate price based on food type and pricing type
                if (item.food_type === 'SA') {
                    return total + (item.base_price * item.quantity);
                } else if (item.food_type === 'MD' || item.food_type === 'PK') {
                    if (item.pricing_type === 'INC') {
                        return total + item.main_dish_price + customizationTotal;
                    } else {
                        return total + (item.base_price * (item.quantity || 1)) + customizationTotal;
                    }
                }
                return total;
            }, 0);

            return itemsTotal;
        };

        const basketTotal = calculateBasketTotal();
        
        return (
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Badge className="px-2.5 py-0.5 bg-gray-900 text-gray-300 border-gray-800">
                            Basket {containerId}
                        </Badge>
                        <span className="text-xs text-gray-500">
                            {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="text-lg font-medium text-yellow-400">
                        GHS {basketTotal.toFixed(2)}
                    </div>
                </div>
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <CartItem key={index} item={item} />
                    ))}
                </div>
            </div>
        );
    };

    const calculateGrandTotal = () => {
        return Object.entries(container).reduce((grandTotal, [containerId, items]) => {
            const basketTotal = items.reduce((total, item) => {
                // Skip if the item itself is unavailable
                if (!item.is_available) return total;
                
                let customizationTotal = 0;

                // Calculate customizations total
                if (item.customizations) {
                    Object.entries(item.customizations).forEach(([optionId, optionChoices]) => {
                        Object.entries(optionChoices).forEach(([choiceName, choice]) => {
                            // Only include if the choice is available
                            if (choice.is_available) {
                                if (item.food_type === 'PK' && choice.pricing_type === 'INC') {
                                    customizationTotal += choice.price;
                                } else {
                                    if (choice.quantity > 0) {
                                        customizationTotal += choice.price;
                                    }
                                }
                            }
                        });
                    });
                }

                // Calculate price based on food type and pricing type
                if (item.food_type === 'SA') {
                    return total + (item.base_price * item.quantity);
                } else if (item.food_type === 'MD' || item.food_type === 'PK') {
                    if (item.pricing_type === 'INC') {
                        return total + item.main_dish_price + customizationTotal;
                    } else {
                        return total + (item.base_price * (item.quantity || 1)) + customizationTotal;
                    }
                }
                return total;
            }, 0);
            
            return grandTotal + basketTotal;
        }, 0);
    };

    const handleProceedToCheckout = () => {
        // Only append userId for default guest names
        const formattedName = guestName 
            ? guestName.trim()
            : `Guest #${userInfo.userId}`;

        console.log("Current Container State:", container);
        setShowPayment(true);
        
        const orderData = {
            name: formattedName,
            containers: container
        };
        
        console.log("Order Data:", orderData);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button className={buttonClassName}>
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg border-gray-800 bg-gray-950/95 backdrop-blur-xl">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-gray-200">Your Cart</SheetTitle>
                </SheetHeader>
                
                {Object.keys(container).length === 0 ? (
                    <EmptyCart />
                ) : (
                    <div className="flex flex-col h-[calc(100vh-8rem)]">
                        <div className="flex-1 overflow-y-auto pr-4 -mr-4 scrollbar-thin 
                                      scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            {Object.entries(container).map(([containerId, items]) => (
                                <BasketContainer 
                                    key={containerId} 
                                    containerId={containerId} 
                                    items={items} 
                                />
                            ))}
                        </div>
                        
                        <div className="mt-auto pt-2 space-y-2 sticky bottom-0 bg-gray-950/95 backdrop-blur-xl">
                            <div className="border-t border-gray-800 pt-2">
                                {/* Guest Name Input - Only show for non-logged-in users */}
                                {!userInfo.isLoggedIn && (
                                    <div className="mb-2">
                                        <div className="relative">
                                            <input
                                                id="guestName"
                                                type="text"
                                                placeholder="Enter your name (optional)"
                                                className="w-full px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700/50 
                                                 rounded-lg text-gray-300 placeholder-gray-500
                                                 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 
                                                 focus:border-yellow-500/30 transition-all duration-200"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <span className="text-xs text-gray-500">
                                                    {guestName ? `${guestName}` : `Guest #${userInfo.userId}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-base font-medium text-gray-300">Grand Total</span>
                                    <span className="text-xl font-semibold text-yellow-400">
                                        GHS {calculateGrandTotal().toFixed(2)}
                                    </span>
                                </div>
                                
                                <Button 
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 
                                             font-semibold py-4 rounded-xl
                                             transition-all duration-200 
                                             shadow-lg shadow-yellow-500/10
                                             active:scale-[0.98]"
                                    onClick={handleProceedToCheckout}
                                >
                                    Proceed to Checkout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <Payment 
                    isOpen={showPayment}
                    onClose={() => setShowPayment(false)}
                    totalAmount={calculateGrandTotal()}
                    guestName={guestName ? guestName.trim() : `Guest #${userInfo.userId}`}
                />
            </SheetContent>
        </Sheet>
    );
}
