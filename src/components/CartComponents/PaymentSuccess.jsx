import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useToast } from "@/hooks/use-toast";
import { clearCart } from '@/gl_Var_Reducers';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get('reference');

    useEffect(() => {
        if (!reference) {
            toast({
                title: "Payment Failed",
                description: "No payment reference found",
                variant: "destructive",
            });
            navigate('/');
            return;
        }

        const verifyPayment = async () => {
            let retryCount = 0;
            const maxRetries = 5;
            const retryDelay = 3000;

            while (retryCount < maxRetries) {
                try {
                    const response = await fetch(
                        `https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/momo-status/${reference}/`
                    );

                    if (!response.ok) {
                        throw new Error('Verification failed');
                    }

                    const data = await response.json();
                    
                    if (data.success) {
                        toast({
                            title: "Payment Successful",
                            description: "Your order has been confirmed",
                            duration: 5000,
                        });
                        
                        dispatch(clearCart());
                        navigate('/');
                        return;
                    }

                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));

                } catch (error) {
                    console.error('Verification attempt failed:', error);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }

            toast({
                title: "Payment Verification Failed",
                description: "Please contact support if payment was deducted",
                variant: "destructive",
                duration: 5000,
            });
            navigate('/');
        };

        verifyPayment();
    }, [reference, navigate, dispatch, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="text-center">
                <h2 className="text-xl text-white mb-4">Verifying Payment...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
            </div>
        </div>
    );
} 