import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useToast } from "@/hooks/use-toast";
import { clearCart } from '@/gl_Var_Reducers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from 'lucide-react';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get('reference') || localStorage.getItem('hubtelReference');
    const [status, setStatus] = useState('pending'); // pending, success, failed
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 5; // Reduced from 10 to 5
    const timerRef = useRef(null);
    const isVerifyingRef = useRef(false);

    // Cleanup function to clear any pending timers
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

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

        // Only start verification if not already verifying
        if (!isVerifyingRef.current) {
            verifyPayment();
        }
        
        // Cleanup on unmount
        return () => {
            isVerifyingRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [reference, navigate, dispatch, toast]);

    const verifyPayment = async () => {
        // Set flag to prevent multiple concurrent verifications
        if (isVerifyingRef.current) return;
        isVerifyingRef.current = true;
        
        try {
            setIsLoading(true);
            console.log("Checking payment status for reference:", reference);
            
            // Use mode: 'cors' and include credentials
            const response = await fetch(
                `https://payment.calabash.online/payment/hubtel/status/${reference}/`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    mode: 'cors',
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error('Verification failed');
            }

            const data = await response.json();
            console.log("Payment status response:", data);
            console.log("Checking conditions:", {
                responseCode: data.responseCode,
                status: data.data.status,
                isSuccess: data.responseCode === '0000' && data.data.status === 'Paid'
            });
            
            // Check if payment is successful based on actual response structure
            if (data.responseCode === '0000' && data.data.status === 'Paid') {
                console.log("Payment verification successful, updating status");
                setStatus('success');
                toast({
                    title: "Payment Successful",
                    description: "Your order has been confirmed",
                    duration: 5000,
                });
                
                dispatch(clearCart());
                
                // Clear the reference from localStorage
                localStorage.removeItem('hubtelReference');
                
                // Navigate after a short delay to show success message
                setTimeout(() => {
                    navigate('/');
                }, 3000);
                
                return;
            } else if (retryCount >= maxRetries) {
                setStatus('failed');
                toast({
                    title: "Payment Verification Failed",
                    description: "Please contact support if payment was deducted",
                    variant: "destructive",
                    duration: 5000,
                });
            } else {
                // If payment is still processing, retry after a delay
                setRetryCount(prev => prev + 1);
                isVerifyingRef.current = false;
                timerRef.current = setTimeout(() => verifyPayment(), 5000); // Increased from 3000 to 5000ms
            }
        } catch (error) {
            console.error('Verification attempt failed:', error);
            if (retryCount >= maxRetries) {
                setStatus('failed');
                toast({
                    title: "Payment Verification Failed",
                    description: "Please contact support if payment was deducted",
                    variant: "destructive",
                    duration: 5000,
                });
            } else {
                // Retry on error
                setRetryCount(prev => prev + 1);
                isVerifyingRef.current = false;
                timerRef.current = setTimeout(() => verifyPayment(), 5000); // Increased from 3000 to 5000ms
            }
        } finally {
            setIsLoading(false);
            // Reset flag only if we're not already marked as failed
            if (status !== 'failed') {
                isVerifyingRef.current = false;
            }
        }
    };

    const handleGoHome = () => {
        // Clear any ongoing verification attempts
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        isVerifyingRef.current = false;
        navigate('/');
    };

    const handleRetry = () => {
        setStatus('pending');
        setRetryCount(0);
        setIsLoading(true);
        isVerifyingRef.current = false;
        verifyPayment();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">
                        {status === 'pending' ? 'Verifying Payment...' : 
                         status === 'success' ? 'Payment Successful!' : 
                         'Payment Verification Failed'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {status === 'pending' ? 'We are confirming your mobile money payment.' : 
                         status === 'success' ? 'Your order has been confirmed.' : 
                         'We could not verify your payment.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    {status === 'pending' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-12 w-12 text-yellow-500 animate-spin mb-4" />
                            <p className="text-gray-400 text-sm mt-2">
                                Attempt {retryCount} of {maxRetries}...
                            </p>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <Check className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="text-gray-300">Thank you for your order!</p>
                        </div>
                    )}
                    {status === 'failed' && (
                        <div className="flex flex-col items-center">
                            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-gray-300 text-center">
                                We couldn't verify your payment. If money was deducted from your account, please contact support.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center gap-3">
                    {status === 'failed' && (
                        <Button onClick={handleRetry} className="bg-yellow-500 text-gray-900 hover:bg-yellow-600">
                            Retry Verification
                        </Button>
                    )}
                    <Button onClick={handleGoHome} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                        {status === 'success' ? 'Continue Shopping' : 'Go Back Home'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 