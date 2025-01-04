import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useDispatch } from 'react-redux';
import { regenerateUserId } from '@/gl_Var_Reducers';

export default function CashPaymentRequests() {
    const [pendingPayments, setPendingPayments] = useState([]);
    const { toast } = useToast();
    const dispatch = useDispatch();

    // Fetch pending payments
    const fetchPendingPayments = async () => {
        try {
            const response = await fetch('https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/cash-payment/pending/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
            });
            
            if (!response.ok) throw new Error('Failed to fetch payments');
            const data = await response.json();
            setPendingPayments(data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast({
                title: "Error",
                description: "Failed to fetch payments",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchPendingPayments();
        const interval = setInterval(fetchPendingPayments, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePaymentResponse = async (requestId, status) => {
        try {
            const response = await fetch('https://calabash-payment-control-centre-tuuve.ondigitalocean.app/payment/cash-payment/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({ requestId, status })
            });

            if (!response.ok) throw new Error('Failed to update payment');
            const data = await response.json();

            if (data.success) {
                toast({
                    title: status === 'approved' ? "Payment Approved" : "Payment Rejected",
                    description: `Payment request ${status}`,
                });

                if (status === 'approved') {
                    dispatch(regenerateUserId());
                }

                fetchPendingPayments();
            } else {
                throw new Error(data.message || 'Failed to update payment');
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-4 p-4">
            <h2 className="text-xl font-bold text-gray-200 mb-4">
                Pending Cash Payments ({pendingPayments.length})
            </h2>
            
            {pendingPayments.map(payment => (
                <div key={payment.requestId} 
                     className="p-4 border border-gray-800 rounded-lg bg-gray-900">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-200">{payment.name}</p>
                            <p className="text-yellow-400 text-lg">
                                GHS {payment.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-400">
                                Order Type: {payment.order_type}
                            </p>
                            {payment.location && (
                                <p className="text-sm text-gray-400">
                                    Location: {payment.location}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePaymentResponse(payment.requestId, 'approved')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 
                                         text-white rounded-lg transition-colors"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handlePaymentResponse(payment.requestId, 'rejected')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 
                                         text-white rounded-lg transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            
            {pendingPayments.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No pending cash payments
                </div>
            )}
        </div>
    );
} 