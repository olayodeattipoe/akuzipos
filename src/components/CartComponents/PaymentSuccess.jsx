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
        const trxref = searchParams.get('trxref');
        const userParams = localStorage.getItem('userParams') || '';

        if (reference) {
            toast({
                title: "Payment Successful",
                description: "Your order has been confirmed",
            });

            // Clear cart
            dispatch({ type: 'gl_variables/CLEAR_CART' });
            
            // Clear stored parameters
            localStorage.removeItem('userParams');
            
            // Clear user info from localStorage and Redux
            localStorage.removeItem('userInfo');
            sessionStorage.removeItem('hasAttemptedRedirect');
            dispatch({ type: 'gl_variables/CLEAR_USER_INFO' });

            // Redirect to authentication after 3 seconds
            const timer = setTimeout(() => {
                window.location.href = `https://pasara.netlify.app?returnUrl=${encodeURIComponent(window.location.origin)}`;
            }, 3000);

            return () => clearTimeout(timer);
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
                <h2 className="text-2xl font-semibold text-white mb-2">Payment Successful!</h2>
                <p className="text-gray-400">Redirecting you shortly...</p>
            </div>
        </div>
    );
} 