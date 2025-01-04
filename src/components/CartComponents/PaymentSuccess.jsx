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
        let retryCount = 0;
        const maxRetries = 3;
        
        if (reference) {
            const verifyPayment = async () => {
                try {
                    const response = await fetch(
                        `https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/momo-status/${reference}`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        }
                    );

                    if (!response.ok) {
                        if (retryCount < maxRetries) {
                            // Wait 2 seconds before retrying
                            retryCount++;
                            setTimeout(verifyPayment, 2000);
                            return;
                        }
                        throw new Error('Payment verification failed');
                    }

                    const data = await response.json();

                    if (data.success) {
                        toast({
                            title: "Payment Successful",
                            description: "Your order has been confirmed",
                        });

                        // Clear cart
                        dispatch(clearCart());
                        
                        // Navigate to home after 3 seconds
                        setTimeout(() => {
                            navigate('/');
                        }, 3000);
                    } else {
                        if (retryCount < maxRetries) {
                            // Wait 2 seconds before retrying
                            retryCount++;
                            setTimeout(verifyPayment, 2000);
                            return;
                        }
                        throw new Error('Payment not found or expired');
                    }
                } catch (error) {
                    toast({
                        title: "Payment Verification Failed",
                        description: error.message,
                        variant: "destructive",
                    });
                    // Only navigate away if we've exhausted all retries
                    if (retryCount >= maxRetries) {
                        navigate('/');
                    }
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