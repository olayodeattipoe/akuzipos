import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Add01Icon, MinusSignIcon } from 'hugeicons-react';
import { setContainer, removeItemFromContainer, setCurrentMainDish } from '@/gl_Var_Reducers';
import { useDispatch, useSelector } from 'react-redux';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Settings01Icon } from "hugeicons-react";
import CustomizePanel from './CustomizePanel';

import store from '@/gl_Var_Store';

export default function MenuCard({ item }){
    const dispatch = useDispatch();
    const customOptions = useSelector((state) => state.gl_variables.customOptions);
    const selectedCategory = useSelector((state)=>state.gl_variables.selectedCategory)
    const selectedContainer = useSelector((state) => state.gl_variables.selectedContainer);
    const container = useSelector((state) => state.gl_variables.container);
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [isLoading, setisloading] = useState('')
    const { name, description, image_url, base_price, id, is_available, food_type, pricing_type } = item;

    const isItemInContainer = container[selectedContainer]?.some(
        containerItem => containerItem.item_id === item.id
    );

    const handleAddItem = (e) => {
        e.stopPropagation();
        if (is_available) {
            if (item.food_type === 'MD' || item.food_type === 'PK') {
                console.log("pricing_type",pricing_type)
                dispatch(setContainer({
                    'Belonging_Category': selectedCategory,
                    'item_id': id,
                    'item_name': name,
                    'item_price': base_price,
                    'food_type': item.food_type,
                    'requires_protein': item.requires_protein,
                    'max_accompaniments': item.max_accompaniments,
                    'pricing_type': pricing_type,
                    'is_available': is_available,
                    'if_package_price_lock': item.if_package_price_lock,
                    'package_lock': item.package_lock
                }));
                setIsCustomizeOpen(true);
            } else {
                dispatch(setContainer({
                    'Belonging_Category': selectedCategory,
                    'item_id': id,
                    'item_name': name, 
                    'item_price': base_price,
                    'food_type': food_type,
                    'pricing_type': item.pricing_type,
                    'is_available': item.is_available
                }));
            }
        }
    }

    const handleRemoveItem = (e) => {
        e.stopPropagation();
        dispatch(removeItemFromContainer({
            containerId: selectedContainer,
            item_id: id,
            food_type: item.food_type,
            itemIndex: -1
        }));
    }

    useEffect(() => {
        if (isCustomizeOpen) {
            dispatch({ type: 'gl_variables/CLEAN_CARD_STATE' });
            store.dispatch({type: 'websocket/fetchCustomOptions', payload: id});
        }
    }, [isCustomizeOpen]);


    return (
        <div className="rounded-lg shadow-md bg-gray-800/50 backdrop-blur-md 
                      border border-gray-700/50 flex flex-col h-full min-w-[220px] 
                      overflow-hidden">
            {/* Image Section */}
            <div className="relative w-full aspect-[16/9] overflow-hidden">
                {image_url ? (
                    <img 
                        src={image_url} 
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800/50" />
                )}
            </div>

            {/* Content Section */}
            <div className="p-2.5 bg-gray-800/30 flex-grow flex flex-col gap-0.5">
                <h4 className="font-medium text-gray-100 text-xs">
                    <span className="capitalize hover:text-yellow-400 transition-colors 
                                   duration-200 block w-full overflow-hidden 
                                   whitespace-nowrap text-ellipsis">
                        {name}
                    </span>
                </h4>
                {description && (
                    <p className="text-[10px] text-gray-400 text-ellipsis 
                                whitespace-nowrap overflow-hidden">
                        {food_type}
                    </p>
                )}
                <div>
                    <span className="text-[10px] text-gray-400">
                        From <span className="text-yellow-400 font-medium">GHS {base_price}</span>
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-1 py-0.5 bg-gray-900/90 flex justify-between items-center border-t border-gray-700/30">
                {food_type === 'SA' && (
                    <Button 
                        variant="ghost" 
                        className="border-none focus:outline-none rounded-lg p-1 text-gray-400 
                                 hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-200" 
                        disabled={!is_available}
                        onClick={handleRemoveItem}
                    >
                        <MinusSignIcon className="w-3.5 h-3.5" />
                    </Button>
                )}

                <Button 
                    variant="ghost" 
                    className="border-none rounded-lg p-1 focus:outline-none text-gray-400 
                             hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-200" 
                    disabled={!is_available}
                    onClick={(food_type === 'MD' || food_type === 'PK') && isItemInContainer ? 
                        () => setIsCustomizeOpen(true) : 
                        handleAddItem}
                >
                    {(food_type === 'MD' || food_type === 'PK') && isItemInContainer ? (
                        <Settings01Icon className="w-3.5 h-3.5" />
                    ) : (
                        <Add01Icon className="w-3.5 w-3.5" />
                    )}
                </Button>
            </div>

            {/* Unavailable Overlay */}
            {!is_available && (
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm
                              flex items-center justify-center">
                    <span className="text-xs font-medium text-red-400">
                        Currently Unavailable
                    </span>
                </div>
            )}

            {/* Customize Sheet */}
            <Sheet open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                <SheetContent side="right" className="w-full sm:w-[540px] bg-gray-900 p-0">
                    <CustomizePanel />
                </SheetContent>
            </Sheet>
        </div>
    );
}
