import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const order = useSelector((state) => state.gl_variables.order);

    useEffect(() => {
        const reference = searchParams.get('reference');
        const userParams = localStorage.getItem('userParams') || '';

        if (reference) {
            // Poll for payment confirmation
            const checkPayment = async () => {
                try {
                    const response = await fetch(
                        `https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/momo-status/${reference}`
                    );
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            // Send order to order manager
                            await fetch('https://orders-management-control-centre-l52z5.ondigitalocean.app/orderManager/process_order/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                },
                                body: JSON.stringify({
                                    ...order,
                                    payment_reference: reference,
                                    payment_method: 'momo'
                                })
                            });

                            toast({
                                title: "Payment Successful",
                                description: "Your order has been confirmed",
                            });

                            // Clear data and redirect
                            dispatch({ type: 'gl_variables/CLEAR_CART' });
                            localStorage.removeItem('userParams');
                            localStorage.removeItem('userInfo');
                            sessionStorage.removeItem('hasAttemptedRedirect');
                            dispatch({ type: 'gl_variables/CLEAR_USER_INFO' });

                            setTimeout(() => {
                                window.location.href = `https://pasara.netlify.app?returnUrl=${encodeURIComponent(window.location.origin)}`;
                            }, 3000);
                            
                            return;
                        }
                    }
                    // If we get here, keep polling
                    setTimeout(checkPayment, 2000);
                } catch (error) {
                    console.error('Error:', error);
                    toast({
                        title: "Error",
                        description: "Failed to confirm payment",
                        variant: "destructive",
                    });
                }
            };

            checkPayment();
        } else {
            toast({
                title: "Payment Failed",
                description: "Your payment was not successful",
                variant: "destructive",
            });
            navigate(`/${userParams}`);
        }
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-semibold text-white mb-2">Processing Payment...</h2>
                <p className="text-gray-400">Please wait while we confirm your payment...</p>
            </div>
        </div>
    );
} 