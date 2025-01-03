import React from 'react';
import Header from './components/homeComponents/header';
import NavMenu from './components/homeComponents/navMenu';
import Content from './components/homeComponents/content';
import Container from './components/homeComponents/container';
import CashPaymentRequests from './components/homeComponents/CashPaymentRequests';
import { useSelector } from "react-redux";

export default function Home() {
    const container = useSelector((state) => state.gl_variables.container);
    const containerCount = Object.keys(container).length;
    const activeTab = useSelector((state) => state.gl_variables.activeTab);

    return (
        <div className="fixed inset-0 text-white">
            <div className="h-full flex flex-col">
                <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md w-full border-b border-gray-800">
                    <Header />
                </div>
                <div className="flex-1 flex">
                    {activeTab === 'place-order' && (
                        <div className="w-72 bg-gray-900/50 border-r border-gray-800">
                            <div className="p-4 border-b border-gray-800">
                                <h2 className="text-lg font-semibold text-gray-100">Categories</h2>
                            </div>
                            <div className="py-2">
                                <NavMenu />
                            </div>
                        </div>
                    )}
                    <div className="flex-1 flex flex-col min-h-0 bg-gray-900/30">
                        <div className={`bg-gradient-to-r from-gray-900 to-gray-800 
                                    border-b border-gray-700/50 shadow-lg
                                    transition-all duration-300 ease-in-out 
                                    ${containerCount > 0 && activeTab === 'place-order' ? 'h-24' : 'h-0'} 
                                    overflow-hidden`}>
                            <div className="h-full px-6 py-4">
                                <Container />
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <div className="p-6">
                                {activeTab === 'place-order' ? (
                                    <Content />
                                ) : (
                                    <CashPaymentRequests />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

