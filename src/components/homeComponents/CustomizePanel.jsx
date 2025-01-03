'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { createSelector } from 'reselect'
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

// Selectors
const selectMainDish = createSelector(
  [state => state.gl_variables.container, state => state.gl_variables.selectedContainer],
  (container, selectedContainer) => 
    container[selectedContainer]?.find(item => item.food_type === 'MD' || item.food_type === 'PK')
)

// Add this near the top with other UI elements
const PriceDisplay = ({ price, pricingType, isSelected }) => (
  <Badge 
    variant="secondary" 
    className={cn(
      "text-[10px]",
      pricingType === 'INC' 
        ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
        : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
      pricingType === 'FIX' && "flex items-center gap-1",
      !isSelected && "opacity-50"
    )}
  >
    {pricingType === 'FIX' && (
      <svg 
        viewBox="0 0 24 24" 
        className="w-2.5 h-2.5 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z"/>
      </svg>
    )}
    GHS {price}
    {pricingType === 'FIX' && ' (fixed)'}
  </Badge>
);

const CustomizePanel = () => {
  const dispatch = useDispatch()
  const mainDish = useSelector(selectMainDish)
  const selectedContainer = useSelector(state => state.gl_variables.selectedContainer)
  const customOptions = useSelector(state => state.gl_variables.customOptions)
  const customOptionsData = customOptions.customOptions
  
  // Add these debug logs
  console.log('CustomOptions:', customOptions);
  console.log('Is Available:', customOptions.is_available);
  console.log('CustomOptions structure:', {
    directAccess: customOptions.is_available,
    customOptionsData: customOptionsData,
    fullObject: customOptions
  });

  // Handle customization changes (for options)
  const handleCustomizationChange = useCallback((optionId, choiceName, action) => {
    const option = customOptionsData[optionId]
    const choice = option.choices.find(c => c.name === choiceName)
    if (!choice) return

    const isPackage = mainDish?.food_type === 'PK'
    const isRadio = option.option_type === 'radio'
    
    const currentQuantity = mainDish?.customizations?.[optionId]?.[choiceName]?.quantity || 0
    const currentPrice = mainDish?.customizations?.[optionId]?.[choiceName]?.price || choice.price
    const baseQuantity = choice.if_package_price_lock || 1

    let newQuantity = currentQuantity
    let newPrice = currentPrice

    if (isPackage && isRadio) {
      if (currentQuantity === 0 && action === 'increase') {
        // First touch - initialize with base values
        if (choice.pricing_type === 'INC') {
          newQuantity = 1
          newPrice = choice.price
        } else if (choice.pricing_type === 'FIX') {
          newQuantity = baseQuantity
          newPrice = choice.price * baseQuantity
        }
      } else if (currentQuantity > 0) {
        // Already selected - handle modifications
        if (choice.pricing_type === 'INC' && !choice.package_lock) {
          if (action === 'increase') {
            newPrice = currentPrice + 1
          } else if (action === 'decrease') {
            if (currentPrice > choice.price) {
              newPrice = currentPrice - 1
            } else {
              // Deselect if trying to go below base price
              newQuantity = 0
              newPrice = choice.price
            }
          }
        } else if (choice.pricing_type === 'FIX' && !choice.package_lock) {
          if (action === 'increase') {
            newQuantity = currentQuantity + 1
            newPrice = choice.price * newQuantity
          } else if (action === 'decrease') {
            if (currentQuantity > baseQuantity) {
              newQuantity = currentQuantity - 1
              newPrice = choice.price * newQuantity
            } else {
              // Deselect if trying to go below base quantity
              newQuantity = 0
              newPrice = choice.price
            }
          }
        }
      }
    } else if (isPackage) {
      // Non-radio package items - existing logic
      if (choice.pricing_type === 'INC') {
        newQuantity = 1
        if (choice.package_lock) {
          newPrice = choice.price
        } else {
          if (action === 'increase') {
            newPrice = currentPrice + 1
          } else if (action === 'decrease' && currentPrice > choice.price) {
            newPrice = currentPrice - 1
          } else {
            newPrice = choice.price
          }
        }
      } else if (choice.pricing_type === 'FIX') {
        if (choice.package_lock) {
          newQuantity = choice.if_package_price_lock || 1
        } else {
          const minQuantity = choice.if_package_price_lock || 1
          if (action === 'increase') {
            newQuantity = currentQuantity + 1
          } else if (action === 'decrease') {
            newQuantity = Math.max(minQuantity, currentQuantity - 1)
          }
        }
        newPrice = choice.price * newQuantity
      }
    } else {
      // Original main dish logic unchanged
      if (choice.price === 0) {
        newQuantity = currentQuantity > 0 ? 0 : 1
        newPrice = 0
      } else if (choice.pricing_type === 'FIX') {
        if (action === 'increase') {
          newQuantity = currentQuantity + 1
          newPrice = choice.price * newQuantity
        } else if (action === 'decrease' && currentQuantity > 0) {
          newQuantity = currentQuantity - 1
          newPrice = choice.price * newQuantity
        }
      } else {  // INC pricing type for main dishes
        if (action === 'increase') {
          if (currentQuantity === 0) {
            newQuantity = 1
            newPrice = choice.price
          } else {
            newPrice = currentPrice + 1
            newQuantity = 1
          }
        } else if (action === 'decrease') {
          if (currentPrice > choice.price) {
            newPrice = currentPrice - 1
            newQuantity = 1
          } else {
            newQuantity = 0
            newPrice = choice.price
          }
        }
      }
    }

    dispatch({
      type: 'gl_variables/UPDATE_CUSTOMIZATION',
      payload: {
        containerId: selectedContainer,
        optionId,
        choice: {
          id: choiceName,
          name: choice.name,
          quantity: newQuantity,
          price: newPrice,
          pricing_type: choice.pricing_type,
          is_available: choice.is_available,
          option_type: option.option_type
        }
      }
    })
  }, [dispatch, selectedContainer, customOptionsData, mainDish])

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!mainDish) return 0;

    const basePrice = mainDish.main_dish_price || mainDish.base_price || 0;
    let customizationTotal = 0;

    // Sum up all customization prices
    if (mainDish.customizations) {
        Object.entries(mainDish.customizations).forEach(([optionId, optionChoices]) => {
            Object.entries(optionChoices).forEach(([choiceName, choice]) => {
                const originalChoice = customOptionsData[optionId]?.choices?.find(c => c.name === choiceName);
                
                // Only include price if the choice is available
                if (originalChoice?.is_available) {
                    if (mainDish.food_type === 'PK' && originalChoice?.pricing_type === 'INC') {
                        // For package INC items, always include their price (since quantity is always 1)
                        customizationTotal += choice.price;
                    } else {
                        // For other items, only add if they have a quantity
                        if (choice.quantity > 0) {
                            customizationTotal += choice.price;
                        }
                    }
                }
            });
        });
    }

    console.log('Total calculation:', {
        basePrice,
        customizationTotal,
        total: (basePrice + customizationTotal).toFixed(2)
    });

    return (basePrice + customizationTotal).toFixed(2);
  }, [mainDish, customOptionsData]);

  // Add this handler for base product changes
  const handleBaseProductChange = useCallback((action) => {
    if (!mainDish || !customOptions) return;

    const currentQuantity = mainDish.quantity || 1;
    const currentPrice = mainDish.main_dish_price || mainDish.base_price || customOptions.base_price;
    
    let newQuantity = currentQuantity;
    let newPrice = currentPrice;

    if (mainDish.food_type === 'PK') {
        // Apply package lock rules for main dish
        if (customOptions.base_product_pricing_type === 'FIX') {
            if (customOptions.base_product_package_lock) {
                // If locked, keep at initial quantity
                newQuantity = customOptions.base_product_if_package_price_lock || 1;
                newPrice = customOptions.base_price * newQuantity;
            } else {
                const minQuantity = customOptions.base_product_if_package_price_lock || 1;
                if (action === 'increase') {
                    newQuantity = currentQuantity + 1;
                } else if (action === 'decrease') {
                    // Can't go below minimum quantity
                    newQuantity = Math.max(minQuantity, currentQuantity - 1);
                }
                newPrice = customOptions.base_price * newQuantity;
            }
        } else { // INC pricing
            newQuantity = 1; // Always 1 for INC
            if (customOptions.base_product_package_lock) {
                newPrice = customOptions.base_price;
            } else {
                if (action === 'increase') {
                    newPrice = currentPrice + 1;
                } else if (action === 'decrease' && currentPrice > customOptions.base_price) {
                    newPrice = currentPrice - 1;
                } else {
                    newPrice = customOptions.base_price;
                }
            }
        }
    } else {
        // Keep existing logic for non-package items
        if (customOptions.base_product_pricing_type === 'FIX') {
            if (action === 'increase') {
                newQuantity = currentQuantity + 1;
                newPrice = customOptions.base_price * newQuantity;
            } else if (action === 'decrease' && currentQuantity > 1) {
                newQuantity = currentQuantity - 1;
                newPrice = customOptions.base_price * newQuantity;
            }
        } else { // INC pricing
            if (action === 'increase') {
                newPrice = currentPrice + 1;
                newQuantity = 1;
            } else if (action === 'decrease' && currentPrice > customOptions.base_price) {
                newPrice = currentPrice - 1;
                newQuantity = 1;
            }
        }
    }

    dispatch({
        type: 'gl_variables/UPDATE_MAIN_DISH',
        payload: {
            containerId: selectedContainer,
            quantity: newQuantity,
            price: newPrice
        }
    });
  }, [dispatch, selectedContainer, mainDish, customOptions]);

  // Add useEffect to initialize package INC items
  useEffect(() => {
    if (mainDish?.food_type === 'PK' && customOptionsData) {
      // Initialize all package items
      Object.entries(customOptionsData).forEach(([optionId, option]) => {
        option.choices.forEach(choice => {
          if (choice.pricing_type === 'INC' || choice.pricing_type === 'FIX') {
            const initialQuantity = choice.pricing_type === 'FIX' 
              ? (choice.if_package_price_lock || 1)  // Use locked quantity or 1 for FIX
              : 1  // Always 1 for INC

            dispatch({
              type: 'gl_variables/UPDATE_CUSTOMIZATION',
              payload: {
                containerId: selectedContainer,
                optionId,
                choice: {
                  id: choice.name,
                  name: choice.name,
                  quantity: initialQuantity,
                  price: choice.price * initialQuantity,  // Calculate initial price
                  pricing_type: choice.pricing_type,
                  is_available: choice.is_available,
                  option_type: option.option_type
                }
              }
            })
          }
        })
      })
    }
  }, [mainDish?.food_type, customOptionsData, dispatch, selectedContainer])

  // Show loading state and debug infoO
  if (!customOptions || Object.keys(customOptions).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin h-6 w-6 border-2 border-yellow-400 border-t-transparent rounded-full" />
        <div className="text-sm text-gray-400">
          Debug Info: {JSON.stringify(customOptions)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Regular Header for Non-Packages */}
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-100">
            Customize Your Order
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Total:</span>
            <span className="text-sm font-medium text-yellow-400">
              GHS {totalPrice}
            </span>
          </div>
        </div>
      </div>

      {/* Base Product Info Box */}
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800">
        <div className={cn(
          "rounded-lg",
          "border border-gray-800/50",
          "bg-gray-800/20 backdrop-blur-sm",
          mainDish?.quantity > 0 && "bg-yellow-400/5 border-yellow-400/20"
        )}>
          <div className="p-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <h3 className="text-[15px] font-medium text-gray-100">
                  {customOptions.name}
                </h3>
                <div className="flex items-center gap-2">
                  {!(mainDish?.food_type === 'PK' && customOptions.base_product_package_lock) && (
                    <PriceDisplay 
                      price={customOptions.base_price}
                      pricingType={customOptions.base_product_pricing_type}
                      isSelected={mainDish?.quantity > 0}
                    />
                  )}
                  {mainDish?.food_type === 'PK' && (
                    <span className="ml-2">
                      {customOptions.base_product_package_lock ? (
                        <Lock className="h-3 w-3 text-yellow-400" />
                      ) : (
                        <Unlock className="h-3 w-3 text-gray-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Base Product Controls */}
              {(!mainDish?.food_type === 'PK' || !customOptions.base_product_package_lock) && (
                <div className={cn(
                  "flex items-center gap-2 ml-4",
                )}>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                    disabled={!customOptions?.is_available}
                    onClick={() => handleBaseProductChange('decrease')}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  
                  <span className={cn(
                    "min-w-[60px] text-center text-sm font-medium",
                    mainDish?.quantity > 0 ? "text-gray-200" : "text-gray-500/50"
                  )}>
                    {customOptions.base_product_pricing_type === 'FIX' 
                      ? (mainDish?.quantity || 1)
                      : `GHS ${mainDish?.main_dish_price || customOptions.base_price}`
                    }
                  </span>
                  
                  <button 
                    className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                    disabled={!customOptions?.is_available}
                    onClick={() => handleBaseProductChange('increase')}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Show only quantity for locked packages */}
              {mainDish?.food_type === 'PK' && customOptions.base_product_package_lock && (
                <div className="ml-4">
                  <span className="text-sm font-medium text-gray-200">
                    {mainDish?.quantity || 1}x
                  </span>
                </div>
              )}
            </div>
            
            {customOptions.base_product_description && (
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                {customOptions.base_product_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Custom Options */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-6">
          {mainDish?.food_type === 'PK' && (
            <div className="space-y-6">
              {/* Get all locked choices first */}
              {(() => {
                const lockedChoices = Object.entries(customOptionsData)
                  .filter(([_, option]) => 
                    option.choices.some(choice => choice.package_lock)
                  );

                return lockedChoices.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Included in Package
                    </h3>
                    <div className="space-y-2">
                      {lockedChoices.map(([optionName, option]) => (
                        <div key={optionName} 
                             className="p-3 bg-gray-800/20 border border-gray-700/30 rounded-lg">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-300">
                              {optionName}
                            </h4>
                            <div className="space-y-1.5">
                              {option.choices.filter(choice => choice.package_lock).map(choice => (
                                <div key={choice.name} 
                                     className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Lock className="h-3 w-3 text-yellow-400" />
                                    <span className="text-sm text-gray-400">
                                      {choice.name}
                                    </span>
                                  </div>
                                  <Badge variant="outline" 
                                         className="bg-yellow-400/5 text-yellow-400 
                                                  border-yellow-400/20 text-[10px]">
                                    {choice.pricing_type === 'FIX' 
                                      ? `${choice.if_package_price_lock || 1}x` 
                                      : 'Included'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Get all customizable choices */}
              {(() => {
                const customizableChoices = Object.entries(customOptionsData)
                  .filter(([_, option]) => 
                    option.choices.some(choice => !choice.package_lock)
                  );

                return customizableChoices.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Customize Your Package
                    </h3>
                    {customizableChoices.map(([optionName, option]) => (
                      <div key={optionName} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-white">
                              {optionName}
                              {option.is_required && (
                                <span className="ml-2 text-xs text-red-400">Required</span>
                              )}
                            </h4>
                            {option.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {option.choices.filter(choice => !choice.package_lock).map((choice) => (
                            <div
                              key={choice.name}
                              className={cn(
                                "p-3 rounded-xl transition-all duration-200",
                                "border border-gray-800/50",
                                "bg-gray-800/20 backdrop-blur-sm",
                                (mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0) && "bg-yellow-400/5 border-yellow-400/20",
                                !choice.is_available && "opacity-50 cursor-not-allowed",
                                (mainDish?.food_type === 'PK' && option.option_type === 'radio') && "cursor-pointer"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-200">
                                    {choice.name}
                                    {choice.price === 0 && (
                                      <span className="ml-2 text-xs text-green-400">(Free)</span>
                                    )}
                                  </p>
                                  
                                  {choice.price !== 0 && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-400">
                                        {choice.pricing_type === 'INC' ? 'Starting from' : 'Fixed price'}:
                                      </span>
                                      <Badge 
                                        variant="secondary" 
                                        className={cn(
                                          "text-[10px]",
                                          choice.pricing_type === 'INC' 
                                            ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                                            : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
                                          choice.pricing_type === 'FIX' && "flex items-center gap-1",
                                          !mainDish?.customizations?.[optionName]?.[choice.name]?.quantity && "opacity-50"
                                        )}
                                      >
                                        {choice.pricing_type === 'FIX' && (
                                          <svg 
                                            viewBox="0 0 24 24" 
                                            className="w-2.5 h-2.5 fill-current"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z"/>
                                          </svg>
                                        )}
                                        GHS {choice.price}
                                        {choice.pricing_type === 'FIX' && ' (fixed)'}
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                {choice.price === 0 ? (
                                  <Button 
                                    variant="outline"
                                    className={cn(
                                      "p-1.5 text-gray-400 hover:text-gray-200 transition-colors",
                                      mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0 && "text-green-400"
                                    )}
                                    onClick={() => {
                                      const currentQuantity = mainDish?.customizations?.[optionName]?.[choice.name]?.quantity || 0;
                                      handleCustomizationChange(optionName, choice.name, currentQuantity > 0 ? 'decrease' : 'increase');
                                    }}
                                    disabled={!choice.is_available}
                                  >
                                    {mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0 ? 'Added' : 'Add'}
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2 bg-gray-800/30 rounded-lg px-2">
                                    {mainDish?.food_type === 'PK' && (
                                      <span className="mr-1">
                                        {choice.package_lock ? (
                                          <Lock className="h-3 w-3 text-yellow-400" />
                                        ) : (
                                          <Unlock className="h-3 w-3 text-gray-400" />
                                        )}
                                      </span>
                                    )}
                                    
                                    <button 
                                      className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                                      disabled={!choice.is_available || (mainDish?.food_type === 'PK' && choice.package_lock)}
                                      onClick={() => handleCustomizationChange(optionName, choice.name, 'decrease')}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>

                                    <span className={cn(
                                      "min-w-[60px] text-center text-sm font-medium",
                                      mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0 
                                        ? "text-gray-200" 
                                        : "text-gray-500/50"
                                    )}>
                                      {choice.pricing_type === 'FIX' 
                                        ? (mainDish?.customizations?.[optionName]?.[choice.name]?.quantity || 0)
                                        : `GHS ${mainDish?.customizations?.[optionName]?.[choice.name]?.price || choice.price}`
                                      }
                                    </span>

                                    <button 
                                      className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                                      disabled={!choice.is_available || (mainDish?.food_type === 'PK' && choice.package_lock)}
                                      onClick={() => handleCustomizationChange(optionName, choice.name, 'increase')}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Regular Options for Non-Packages */}
          {mainDish?.food_type !== 'PK' && (
            Object.entries(customOptionsData).map(([optionName, option]) => {
              if (!option || !option.choices) return null;

              return (
                <div key={optionName} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        {optionName}
                        {option.is_required && (
                          <span className="ml-2 text-xs text-red-400">Required</span>
                        )}
                      </h4>
                      {option.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {option.choices.map((choice) => (
                      <div
                        key={choice.name}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          "border border-gray-800/50",
                          "bg-gray-800/20 backdrop-blur-sm",
                          (mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0) && "bg-yellow-400/5 border-yellow-400/20",
                          !choice.is_available && "opacity-50 cursor-not-allowed",
                          (mainDish?.food_type === 'PK' && option.option_type === 'radio') && "cursor-pointer"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-200">
                              {choice.name}
                              {choice.price === 0 && (
                                <span className="ml-2 text-xs text-green-400">(Free)</span>
                              )}
                            </p>
                            
                            {choice.price !== 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">
                                  {choice.pricing_type === 'INC' ? 'Starting from' : 'Fixed price'}:
                                </span>
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px]",
                                    choice.pricing_type === 'INC' 
                                      ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                                      : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
                                    choice.pricing_type === 'FIX' && "flex items-center gap-1",
                                    !mainDish?.customizations?.[optionName]?.[choice.name]?.quantity && "opacity-50"
                                  )}
                                >
                                  {choice.pricing_type === 'FIX' && (
                                    <svg 
                                      viewBox="0 0 24 24" 
                                      className="w-2.5 h-2.5 fill-current"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z"/>
                                    </svg>
                                  )}
                                  GHS {choice.price}
                                  {choice.pricing_type === 'FIX' && ' (fixed)'}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {choice.price === 0 ? (
                            <Button 
                              variant="outline"
                              className={cn(
                                "p-1.5 text-gray-400 hover:text-gray-200 transition-colors",
                                mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0 && "text-green-400"
                              )}
                              onClick={() => {
                                const currentQuantity = mainDish?.customizations?.[optionName]?.[choice.name]?.quantity || 0;
                                handleCustomizationChange(optionName, choice.name, currentQuantity > 0 ? 'decrease' : 'increase');
                              }}
                              disabled={!choice.is_available}
                            >
                              {mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0 ? 'Added' : 'Add'}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 bg-gray-800/30 rounded-lg px-2">
                              {mainDish?.food_type === 'PK' && (
                                <span className="mr-1">
                                  {choice.package_lock ? (
                                    <Lock className="h-3 w-3 text-yellow-400" />
                                  ) : (
                                    <Unlock className="h-3 w-3 text-gray-400" />
                                  )}
                                </span>
                              )}
                              
                              <button 
                                className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                                disabled={!choice.is_available || (mainDish?.food_type === 'PK' && choice.package_lock)}
                                onClick={() => handleCustomizationChange(optionName, choice.name, 'decrease')}
                              >
                                <Minus className="h-3 w-3" />
                              </button>

                              <span className={cn(
                                "min-w-[60px] text-center text-sm font-medium",
                                mainDish?.customizations?.[optionName]?.[choice.name]?.quantity > 0 
                                  ? "text-gray-200" 
                                  : "text-gray-500/50"
                              )}>
                                {choice.pricing_type === 'FIX' 
                                  ? (mainDish?.customizations?.[optionName]?.[choice.name]?.quantity || 0)
                                  : `GHS ${mainDish?.customizations?.[optionName]?.[choice.name]?.price || choice.price}`
                                }
                              </span>

                              <button 
                                className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                                disabled={!choice.is_available || (mainDish?.food_type === 'PK' && choice.package_lock)}
                                onClick={() => handleCustomizationChange(optionName, choice.name, 'increase')}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default CustomizePanel