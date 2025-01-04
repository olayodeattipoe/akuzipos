import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const reference = searchParams.get('reference');
        
        if (reference) {
            // Verify payment status with backend
            const verifyPayment = async () => {
                try {
                    const response = await fetch(
                        `https://orders-management-control-centre-l52z5.ondigitalocean.app/payment/check-momo-payment-status/${reference}`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Payment verification failed');
                    }

                    const data = await response.json();

                    if (data.success) {
                        toast({
                            title: "Payment Successful",
                            description: "Your order has been confirmed",
                        });

                        // Clear cart
                        dispatch({ type: 'gl_variables/CLEAR_CART' });
                        
                        // Navigate to home after 3 seconds
                        setTimeout(() => {
                            navigate('/');
                        }, 3000);
                    } else {
                        throw new Error('Payment not found or expired');
                    }
                } catch (error) {
                    toast({
                        title: "Payment Verification Failed",
                        description: error.message,
                        variant: "destructive",
                    });
                    navigate('/');
                }
            };

            verifyPayment();
        } else {
            toast({
                title: "Payment Failed",
                description: "Your payment was not successful",
                variant: "destructive",
            });
            navigate('/');
        }
    }, []);

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