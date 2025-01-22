import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"
import { clearCart } from '@/gl_Var_Reducers';

export default function Payment({ isOpen, onClose, totalAmount, guestName, setGuestName }) {
    const { toast } = useToast();
    const dispatch = useDispatch();
    const [orderType, setOrderType] = useState("onsite");
    const [paymentMethod, setPaymentMethod] = useState("momo");
    const [deliveryLocation, setDeliveryLocation] = useState("");
    const container = useSelector((state) => state.gl_variables.container);
    const order = useSelector((state) => state.gl_variables.order);
    const userInfo = useSelector((state) => state.gl_variables.userInfo);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const repeaters = useSelector((state) => state.gl_variables.repeater);

    const orderTypes = [
        { value: "onsite", label: "Dine In" },
        { value: "takeaway", label: "Takeaway" },
        { value: "delivery", label: "Delivery" }
    ];

    // Remove the login-based filtering
    const availableOrderTypes = orderTypes;  // All order types available to everyone

    const sanitizeCartItems = (container) => {
        const sanitized = JSON.parse(JSON.stringify(container)); // Create deep copy
        
        Object.entries(sanitized).forEach(([containerId, items]) => {
            items.forEach(item => {
                // Sanitize base item fields
                item.base_price = Number(item.base_price) || 0;
                item.quantity = parseInt(item.quantity) || 1;
                item.main_dish_price = Number(item.main_dish_price) || item.base_price || 0;
                
                // Sanitize customizations
                if (item.customizations) {
                    Object.values(item.customizations).forEach(choices => {
                        Object.values(choices).forEach(choice => {
                            choice.price = Number(choice.price) || 0;
                            choice.quantity = parseInt(choice.quantity) || 0;
                        });
                    });
                }
            });
        });

        return sanitized;
    };

    const calculateBasketTotal = (items) => {
        return items.reduce((total, item) => {
            if (!item.is_available) return total;
            
            let customizationTotal = 0;

            if (item.customizations) {
                Object.entries(item.customizations).forEach(([optionId, optionChoices]) => {
                    Object.entries(optionChoices).forEach(([choiceName, choice]) => {
                        if (choice.is_available) {
                            if (item.food_type === 'PK' && choice.pricing_type === 'INC') {
                                customizationTotal += Number(choice.price) || 0;
                            } else {
                                if (choice.quantity > 0) {
                                    customizationTotal += Number(choice.price) || 0;
                                }
                            }
                        }
                    });
                });
            }

            if (item.food_type === 'SA') {
                return total + (Number(item.base_price) * Number(item.quantity) || 0);
            } else if (item.food_type === 'MD' || item.food_type === 'PK') {
                if (item.pricing_type === 'INC') {
                    return total + Number(item.main_dish_price || 0) + customizationTotal;
                } else {
                    return total + (Number(item.base_price || 0) * Number(item.quantity || 1)) + customizationTotal;
                }
            }
            return total;
        }, 0);
    };

    const sendOrderToManager = async (orderData) => {
        const adminId = localStorage.getItem('adminId');
        const adminUsername = localStorage.getItem('adminUsername');
        console.log('Processing order with admin:', adminUsername, 'ID:', adminId); // Debug log
        
        try {
            const response = await fetch('https://orders-management-control-centre-l52z5.ondigitalocean.app/orderManager/process_order/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({
                    ...orderData,
                    adminId: adminId, // Send admin ID instead of username
                    adminUser: adminUsername // Keep username for display purposes
                })
            });
            
            console.log('Order data sent:', { ...orderData, adminId, adminUser: adminUsername }); // Debug log
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Order manager response data:', data);
            return data;
        } catch (error) {
            console.error('Error sending order:', error);
            throw error;
        }
    };

    const validateDeliveryLocation = () => {
        if (orderType === "delivery" && !deliveryLocation.trim()) {
            alert("Please enter a delivery location");
            return false;
        }
        return true;
    };

    const initializePaystackPayment = async (orderData) => {
        try {
            // Initialize payment with Paystack
            const response = await fetch('https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/initialize/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: orderData.email,
                    amount: orderData.amount * 100, // Convert to pesewas
                })
            });

            if (!response.ok) {
                throw new Error('Payment initialization failed');
            }

            const data = await response.json();
            
            // Redirect to Paystack payment page
            window.location.href = data.data.authorization_url;
            
        } catch (error) {
            console.error('Payment initialization error:', error);
            toast({
                title: "Payment Failed",
                description: "Could not initialize payment",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async () => {
        if (!validateDeliveryLocation()) return;
        
        setIsSubmitting(true);
        
        try {
            const sanitizedContainer = sanitizeCartItems(container);
            console.log('Sanitized Container:', sanitizedContainer); // Debug log
            console.log('Repeaters:', repeaters); // Debug log
            
            // Modified order data structure to include repeater information
            const orderData = {
                user_id: userInfo.userId,
                name: guestName?.trim() || `Guest #${userInfo.userId}`,
                email: `${userInfo.userId}@gmail.com`,
                containers: Object.entries(sanitizedContainer).map(([containerId, items]) => {
                    console.log(`Processing container ${containerId}:`, items); // Debug log
                    console.log(`Repeater value for container ${containerId}:`, repeaters[containerId]); // Debug log
                    
                    return {
                        containerId,
                        repeatCount: repeaters[containerId] || 1,
                        items,
                        containerTotal: calculateBasketTotal(items) * (repeaters[containerId] || 1)
                    };
                }),
                order_type: orderType,
                payment_method: 'momo',
                amount: Number(totalAmount),
                location: orderType === "delivery" ? deliveryLocation : "",
            };

            console.log('Final order data:', orderData); // Debug log

            // Store order data in localStorage before payment
            localStorage.setItem('pendingOrder', JSON.stringify(orderData));

            if (paymentMethod === "momo") {
                const adminId = localStorage.getItem('adminId');
                const adminUsername = localStorage.getItem('adminUsername');
                
                const response = await fetch('https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/initialize/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...orderData,
                        adminId: adminId,
                        adminUser: adminUsername
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Payment initialization failed');
                }

                const data = await response.json();
                window.location.href = data.data.authorization_url;
            } else if (paymentMethod === "cash") {
                const response = await sendOrderToManager(orderData);
                dispatch(clearCart());
                toast({
                    title: "Quick Tip",
                    description: "For active orders, please don't close the browser app completely.",
                    duration: 7000,
                });
                onClose();
            }
        } catch (error) {
            console.error('Order submission error:', error); // Detailed error logging
            console.error('Error stack:', error.stack); // Stack trace
            toast({
                title: "Order Failed",
                description: error.message || "Failed to place order",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Complete Your Order</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Choose your order type and payment method
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Order Type Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="orderType" className="text-white">
                            Order Type
                        </Label>
                        <Select
                            value={orderType}
                            onValueChange={setOrderType}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select order type" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableOrderTypes.map((type) => (
                                    <SelectItem 
                                        key={type.value} 
                                        value={type.value}
                                    >
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Delivery Location Input */}
                    {orderType === "delivery" && (
                        <div className="space-y-2">
                            <Label htmlFor="deliveryLocation" className="text-white">
                                Delivery Location
                            </Label>
                            <Input
                                id="deliveryLocation"
                                type="text"
                                value={deliveryLocation}
                                onChange={(e) => setDeliveryLocation(e.target.value)}
                                placeholder="Enter your delivery location"
                                className="bg-gray-800/50 border-gray-700 text-white"
                            />
                        </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="text-white">
                            Payment Method
                        </Label>
                        <Select
                            value={paymentMethod}
                            onValueChange={setPaymentMethod}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="momo">Mobile Money</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Total Amount Display */}
                    <div className="flex justify-between items-center py-4 border-t border-gray-800">
                        <span className="text-gray-400">Total Amount:</span>
                        <span className="text-xl font-semibold text-yellow-400">
                            GHS {totalAmount}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-yellow-500 text-gray-900 hover:bg-yellow-600"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            'Confirm Order'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
