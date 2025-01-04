import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from 'lucide-react';
import { clearCart } from '@/gl_Var_Reducers';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const reference = searchParams.get('reference');
        let retryCount = 0;
        const maxRetries = 5;
        
        if (reference) {
            const verifyPayment = async () => {
                try {
                    console.log('Verifying payment for reference:', reference);
                    const response = await fetch(
                        `https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/momo-status/${reference}/`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            mode: 'cors'
                        }
                    );

                    if (!response.ok) {
                        console.log('Payment verification failed:', response.status);
                        if (retryCount < maxRetries) {
                            retryCount++;
                            console.log(`Retrying (${retryCount}/${maxRetries})...`);
                            setTimeout(verifyPayment, 3000);
                            return;
                        }
                        throw new Error('Payment verification failed');
                    }

                    const data = await response.json();
                    console.log('Payment verification response:', data);

                    if (data.success) {
                        const storedOrder = localStorage.getItem('pendingOrder');
                        if (storedOrder) {
                            try {
                                const orderResponse = await fetch(
                                    'https://orders-management-control-centre-l52z5.ondigitalocean.app/orderManager/process_order/',
                                    {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Accept': 'application/json',
                                        },
                                        mode: 'cors',
                                        body: storedOrder
                                    }
                                );

                                if (!orderResponse.ok) {
                                    throw new Error('Failed to process order');
                                }
                            } catch (error) {
                                console.error('Error processing order:', error);
                            }
                        }

                        localStorage.removeItem('pendingOrder');

                        toast({
                            title: "Payment Successful",
                            description: "Your order has been confirmed",
                            duration: 5000,
                        });

                        dispatch(clearCart());
                        
                        setTimeout(() => {
                            navigate('/');
                        }, 3000);
                    } else {
                        if (retryCount < maxRetries) {
                            retryCount++;
                            console.log(`Retrying (${retryCount}/${maxRetries})...`);
                            setTimeout(verifyPayment, 3000);
                            return;
                        }
                        throw new Error(data.message || 'Payment not found or expired');
                    }
                } catch (error) {
                    console.error('Payment verification error:', error);
                    toast({
                        title: "Payment Verification Failed",
                        description: error.message,
                        variant: "destructive",
                        duration: 5000,
                    });
                    if (retryCount >= maxRetries) {
                        setTimeout(() => {
                            navigate('/');
                        }, 3000);
                    }
                }
            };

            verifyPayment();
        } else {
            toast({
                title: "Payment Failed",
                description: "No payment reference found",
                variant: "destructive",
                duration: 5000,
            });
            setTimeout(() => {
                navigate('/');
            }, 3000);
        }
    }, [navigate, dispatch, toast]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-semibold text-white mb-2">Processing Payment...</h2>
                <p className="text-gray-400">Please wait while we verify your payment...</p>
            </div>
        </div>
    );
} 