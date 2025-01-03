import React, { useState, useEffect } from 'react';
import MenuCard from './menuCard';
import MenuCardSkeleton from './MenuCardSkeleton';
import { useSelector } from 'react-redux';
import { Search, Package } from 'lucide-react';

export default function Content() {
    const [isLoading, setIsLoading] = useState(true);
    const currentArray = useSelector((state) => state.gl_variables.currentArray);
    const filteredArray = useSelector((state) => state.gl_variables.filteredArray);
    const selectedCategory = useSelector((state) => state.gl_variables.selectedCategory);
    const searchQuery = useSelector((state) => state.gl_variables.searchQuery);
    const displayArray = searchQuery ? filteredArray : currentArray;

    useEffect(() => {
        setIsLoading(true);
        console.log("Pain",currentArray)
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [selectedCategory]);

    const hasItems = displayArray && Array.isArray(displayArray) && displayArray.length > 0;

    return (
        <div className="relative">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 
                              bg-yellow-400/10 rounded-full 
                              mix-blend-overlay filter blur-[100px] 
                              opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 
                              bg-gray-700/20 rounded-full 
                              mix-blend-overlay filter blur-[100px] 
                              opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative bg-transparent px-4">
                {selectedCategory && !searchQuery && (
                    <div className="mb-4">
                        <div className="w-fit mx-auto py-1.5 px-4 rounded-lg
                                    bg-yellow-400/5 backdrop-blur-md
                                    border border-yellow-400/20">
                            <span className="text-sm text-yellow-400 font-medium">
                                {selectedCategory}
                            </span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
                              gap-5 mx-auto">
                    {isLoading ? (
                        [...Array(6)].map((_, index) => (
                            <div key={index} 
                                 className="transform transition-all duration-300 
                                          active:scale-95">
                                <MenuCardSkeleton />
                            </div>
                        ))
                    ) : hasItems ? (
                        displayArray.map((item) => (
                            <div key={item.id} 
                                 className="transform transition-all duration-300 
                                          active:scale-95">
                                <MenuCard item={item} />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 flex items-center justify-center py-12">
                            <div className="text-center space-y-3 px-5 py-6 rounded-xl 
                                          bg-gray-900/80 backdrop-blur-md
                                          border border-gray-800/50
                                          shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full 
                                              bg-gray-800/50 flex items-center justify-center
                                              border border-gray-700/30">
                                    {searchQuery ? (
                                        <Search className="w-6 h-6 text-gray-500" />
                                    ) : (
                                        <Package className="w-6 h-6 text-gray-500" />
                                    )}
                                </div>
                                <p className="text-gray-400 text-xs font-medium">
                                    {searchQuery ? (
                                        "No items found matching your search"
                                    ) : (
                                        "No items available"
                                    )}
                                </p>
                                <p className="text-gray-600 text-[10px]">
                                    {searchQuery ? 
                                        "Try adjusting your search terms" : 
                                        "Please check back later"
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pointer-events-none sticky bottom-0 h-20 
                          bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>
    );
}
