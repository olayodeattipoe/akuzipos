import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import store from '@/gl_Var_Store';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"
import { clearCart } from '@/gl_Var_Reducers';

export default function Payment({ isOpen, onClose, totalAmount, guestName }) {
    const { toast } = useToast();
    const dispatch = useDispatch();
    const [orderType, setOrderType] = useState("onsite");
    const [paymentMethod, setPaymentMethod] = useState("momo");
    const [deliveryLocation, setDeliveryLocation] = useState("");
    const container = useSelector((state) => state.gl_variables.container);
    const order = useSelector((state) => state.gl_variables.order);
    const userInfo = useSelector((state) => state.gl_variables.userInfo);

    const orderTypes = [
        { value: "onsite", label: "Dine In" },
        { value: "takeaway", label: "Takeaway" },
        { value: "delivery", label: "Delivery" }
    ];

    // Filter order types based on login status
    const availableOrderTypes = userInfo.isLoggedIn 
        ? orderTypes 
        : orderTypes.filter(type => type.value === "onsite");

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

    const sendOrderToManager = async (orderData) => {
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
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
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

    const handleSubmit = async () => {
        if (!validateDeliveryLocation()) return;

        // Sanitize the container data
        const sanitizedContainer = sanitizeCartItems(container);
        
   

        if (paymentMethod === "momo") {
            // Store order data before payment
            const orderData = {
                container,
                userInfo,
                order: {
                    order_type: orderType,
                    location: deliveryLocation,
                    phone: userInfo.phone
                }
            };
            
            localStorage.setItem('pendingOrder', JSON.stringify(orderData));

            const paymentPayload = {
                email: userInfo.isLoggedIn ? userInfo.email : `${userInfo.userId}@example.com`,
                amount: Math.round(Number(totalAmount) * 100)
            };

            try {
                const response = await axios({
                    method: 'post',
                    url: 'https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/initialize/',
                    data: paymentPayload,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    withCredentials: true
                });

                if (response.data.status) {
                    window.location.href = response.data.data.authorization_url;
                } else {
                    throw new Error(response.data.message || 'Payment initialization failed');
                }
            } catch (error) {
                // More detailed error logging
                console.error("Full error object:", error);
                console.error("Response data:", error.response?.data);
                console.error("Request payload:", paymentPayload);
                
                toast({
                    title: "Payment Error",
                    description: error.response?.data?.message || "Failed to initialize payment. Please try again.",
                    variant: "destructive",
                });
            }
        } else if (paymentMethod === "cash") {
            // Keep existing cash payment logic
            sendOrderToManager(orderData)
                .then(response => {
                    dispatch(clearCart());
                    toast({
                        title: "Quick Tip",
                        description: "For active orders, please don't close the browser app completely.",
                        duration: 7000,
                        variant: "default",
                    });
                    onClose();
                })
                .catch(error => {
                    toast({
                        title: "Order Failed",
                        description: error.message || "Failed to place order",
                        variant: "destructive",
                    });
                });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Complete Your Order</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {!userInfo.isLoggedIn && (
                            <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg text-yellow-400 text-sm">
                                Note: Only dine-in orders are available for guests. Please log in to access takeaway and delivery options.
                            </div>
                        )}
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
                    >
                        Confirm Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
