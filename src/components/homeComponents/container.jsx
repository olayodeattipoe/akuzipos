import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedContainer, removeContainer } from "@/gl_Var_Reducers";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeItemFromContainer } from "@/gl_Var_Reducers";

export default function Container() {
    const dispatch = useDispatch();
    const container = useSelector((state) => state.gl_variables.container);
    const selectedContainer = useSelector((state) => state.gl_variables.selectedContainer);
    const scrollContainerRef = useRef(null);
    const containerRefs = useRef({});

    const handleRemoveContainer = (containerId, e) => {
        e.stopPropagation();
        dispatch(removeContainer(Number(containerId)));
    };

    useEffect(() => {
        if (containerRefs.current[selectedContainer]) {
            containerRefs.current[selectedContainer].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'start'
            });
        }
    }, [selectedContainer, container]);

    const handleRemoveItem = (containerId, itemIndex) => {
        dispatch(removeItemFromContainer({ containerId, itemIndex, forceRemove: true }));
    };

    // Check if there are any containers
    const hasContainers = Object.keys(container).length > 0;

    return (
        <div className="relative bg-gray-900/50 border-b border-gray-800/50 py-2">
            <div className="overflow-x-auto flex gap-3 px-4 hide-scrollbar"
                 style={{ 
                     WebkitOverflowScrolling: 'touch',
                     msOverflowStyle: 'none',
                     scrollbarWidth: 'none'
                 }}>
                <div className="flex gap-3 min-w-max">
                    {container && Object.entries(container).map(([containerId, items]) => (
                        <div 
                            key={containerId}
                            ref={el => containerRefs.current[containerId] = el}
                            onClick={() => dispatch(setSelectedContainer(Number(containerId)))}
                            className={`
                                flex-shrink-0 w-[250px] 
                                transition-all duration-300 
                                transform hover:translate-y-[-2px]
                                ${selectedContainer === Number(containerId) 
                                    ? 'scale-[1.02]' 
                                    : 'scale-100'
                                }
                            `}
                        >
                            <div className={`
                                h-full p-3 rounded-xl border
                                backdrop-blur-md shadow-lg
                                ${selectedContainer === Number(containerId)
                                    ? 'bg-yellow-400/5 border-yellow-400/20 shadow-lg shadow-yellow-400/5'
                                    : 'bg-gray-800/30 border-gray-700/30 shadow-sm shadow-black/5'
                                }
                            `}>
                                <div className="flex items-center justify-between mb-2">
                                    <Badge 
                                        variant="outline" 
                                        className={`
                                            px-2.5 py-0.5 text-xs font-medium
                                            ${selectedContainer === Number(containerId)
                                                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                                                : 'bg-gray-800/50 text-gray-300 border-gray-700/50'
                                            }
                                        `}
                                    >
                                        Basket {containerId}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">
                                            {items.length} item{items.length !== 1 ? 's' : ''}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full hover:bg-red-500/20 
                                                     hover:text-red-400 transition-colors"
                                            onClick={(e) => handleRemoveContainer(containerId, e)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="max-h-[80px] overflow-hidden">
                                    <div className="flex flex-wrap gap-1.5">
                                        {items.map((order, index) => (
                                            <div 
                                                key={index}
                                                className="group relative"
                                            >
                                                <Badge 
                                                    variant="secondary" 
                                                    className={`
                                                        text-xs py-0.5 pr-6
                                                        max-w-[180px] truncate
                                                        transition-all duration-200
                                                        ${selectedContainer === Number(containerId)
                                                            ? 'bg-yellow-400/5 text-yellow-400 hover:bg-yellow-400/10'
                                                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                                                        }
                                                    `}
                                                >
                                                    {order.item_name}
                                                    {order.quantity > 1 && ` (${order.quantity})`}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-1/2 -translate-y-1/2
                                                             h-4 w-4 rounded-full
                                                             opacity-0 group-hover:opacity-100
                                                             hover:bg-red-500/20 hover:text-red-400
                                                             transition-all duration-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveItem(containerId, index);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
