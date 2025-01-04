import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const searchParams = useSearchParams()[0];
    const { toast } = useToast();

    useEffect(() => {
        const reference = searchParams.get('reference');
        const storedOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
        console.log("Stored Order:", storedOrder); // Debug log

        if (reference && storedOrder.container) {
            const checkPayment = async () => {
                try {
                    // Prepare the complete order with stored guest name
                    const completeOrder = {
                        user_id: storedOrder.userInfo.userId,
                        name: storedOrder.userInfo.name || `Guest #${storedOrder.userInfo.userId}`,
                        email: storedOrder.userInfo.email,
                        containers: storedOrder.container,
                        payment_reference: reference,
                        payment_method: 'momo',
                        order_type: storedOrder.order.order_type || 'onsite',
                        location: storedOrder.order.location || '',
                        phone: storedOrder.order.phone || ''
                    };

                    console.log("Sending order:", completeOrder); // Debug log

                    const response = await fetch('https://orders-management-control-centre-l52z5.ondigitalocean.app/orderManager/process_order/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        mode: 'cors',
                        credentials: 'include',
                        body: JSON.stringify(completeOrder)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log("Order response:", data); // Debug log

                    if (data.success) {
                        setStatus('success');
                        // Clear the cart and stored order after successful processing
                        dispatch(clearCart());
                        localStorage.removeItem('pendingOrder');
                        
                        toast({
                            title: "Order Placed Successfully",
                            description: "Your order has been received and is being processed.",
                        });
                    } else {
                        setStatus('error');
                        throw new Error(data.message || 'Failed to process order');
                    }
                } catch (error) {
                    console.error('Error processing order:', error);
                    setStatus('error');
                    toast({
                        title: "Error Processing Order",
                        description: error.message,
                        variant: "destructive",
                    });
                }
            };

            checkPayment();
        } else {
            setStatus('error');
            toast({
                title: "Invalid Order",
                description: "No order details found.",
                variant: "destructive",
            });
        }
    }, [dispatch, searchParams, toast]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Order Status</CardTitle>
                    <CardDescription>
                        {status === 'processing' && 'Processing your order...'}
                        {status === 'success' && 'Order placed successfully!'}
                        {status === 'error' && 'Error processing order'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'processing' && (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="text-center space-y-4">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <p className="text-gray-300">Thank you for your order!</p>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="text-center space-y-4">
                            <XCircle className="mx-auto h-12 w-12 text-red-500" />
                            <p className="text-gray-300">Something went wrong processing your order.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button 
                        onClick={() => navigate('/')}
                        variant="outline"
                    >
                        Return to Menu
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 