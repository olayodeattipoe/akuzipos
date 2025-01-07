import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="text-center max-w-2xl mx-auto">
                <div className="flex justify-center mb-8">
                    <AlertTriangle className="h-16 w-16 text-yellow-500" />
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    System Maintenance
                </h1>
                
                <p className="text-gray-400 text-lg mb-8">
                    We're currently performing scheduled maintenance to improve our services. 
                    We'll be back shortly.
                </p>
                
                <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <h2 className="text-yellow-500 font-semibold mb-2">
                        Expected Duration
                    </h2>
                    <p className="text-gray-300">
                        Our maintenance is expected to be completed within the next few hours.
                    </p>
                </div>
                
                <p className="text-gray-500">
                    We apologize for any inconvenience.
                </p>
            </div>
        </div>
    );
} 