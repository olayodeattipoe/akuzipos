import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Loader2, Check, User, Phone, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useSelector, useDispatch } from 'react-redux';
import { removeItemFromContainer } from '@/gl_Var_Reducers';
import { useNavigate } from 'react-router-dom';
import Payment from './payment';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const EmptyCart = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Your cart is empty</h3>
            <p className="text-sm text-gray-500">
                Add some delicious items to your cart and they will appear here
            </p>
        </div>
    );
};

const generateUsernameAndPhonenumber = () =>{
    const timestamp = Date.now().toString().slice(-2); // last 2 digits of ms timestamp
    const randomPart = Math.floor(Math.random() * 90 + 10); // 2-digit random
  return `${timestamp}${randomPart}`; // 8-digit pseudo-unique
}

export default function Cart({ buttonClassName }) {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const container = useSelector((state) => state.gl_variables.container);
    const order = useSelector((state) => state.gl_variables.order);
    const userInfo = useSelector((state) => state.gl_variables.userInfo);
    const repeaters = useSelector((state) => state.gl_variables.repeater);
    const navigate = useNavigate();
    const [showPayment, setShowPayment] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [userPhone, setUserPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [commandOpen, setCommandOpen] = useState(false);
    const searchContainerRef = useRef(null);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [momoName, setMomoName] = useState('');

    useEffect(()=>{
        const generated = generateUsernameAndPhonenumber()
        setGuestName(generated)
        setUserPhone(generated)
    },[container])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setCommandOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Function to search for users
    const searchUsers = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 3) {
            setUserSearchResults([]);
            setCommandOpen(false);
            return;
        }

        setIsSearching(true);
        
        try {
            console.log("Searching for users with term:", searchTerm);
            
            const response = await axios.post('https://akuzi.calabash.online/mcc_primaryLogic/editables/', {
                action: "search_users",
                content: {
                    query: searchTerm
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                //withCredentials: true
            });

            console.log("Full API response:", response);
            
            if (response.data && response.data.status === "success") {
                const users = response.data.users || [];
                console.log("Users returned from API:", users);
                
                // Log the structure of the first user if available
                if (users && users.length > 0) {
                    console.log("First user structure:", JSON.stringify(users[0], null, 2));
                    console.log("User properties:", Object.keys(users[0]));
                }
                
                setUserSearchResults(users);
                setCommandOpen(true); // Always open if we made a search
            } else {
                console.log("API call succeeded but returned no results or error:", response.data);
                setUserSearchResults([]);
                setCommandOpen(true); // Keep open to show "No results" message
            }
        } catch (error) {
            console.error('Error searching for users:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : 'No response data',
                request: error.request ? 'Request made but no response received' : 'No request made'
            });
            
            setUserSearchResults([]);
            setCommandOpen(true); // Keep open to show error message
        } finally {
            setIsSearching(false);
        }
    };

    // New function to handle phone number search
    const handlePhoneSearch = (phoneValue) => {
        setUserPhone(phoneValue);
        
        if (phoneValue && phoneValue.length >= 3) {
            // Search based on phone number
            searchUsers(phoneValue);
        }
    };

    // New function to select a customer
    const selectCustomer = (user) => {
        if (user) {
            console.log("Selected customer:", user); // Debug log
            setGuestName(user.name || "");
            setUserPhone(user.phone || "");
            setUserEmail(user.email || "");
            setCommandOpen(false);
        }
    };

    // Explicit handler for customer item click
    const handleCustomerClick = (user) => {
        console.log("Customer clicked:", user); // Debug log
        console.log("User object type:", typeof user);
        console.log("User object properties:", Object.keys(user));
        console.log("User name property:", user.name);
        console.log("User phone property:", user.phone);
        console.log("User email property:", user.email);
        
        // Ensure we're handling the user object correctly
        if (user && typeof user === 'object') {
            selectCustomer({
                name: user.name || "", 
                phone: user.phone || "", 
                email: user.email || ""
            });
        } else {
            console.error("Invalid user object received:", user);
        }
    };

    const calculateItemTotal = (item) => {
        if (item.food_type === 'MD') {
            let customizationTotal = 0;
            if (item.customizations) {
                Object.values(item.customizations).forEach(choices => {
                    Object.values(choices).forEach(choiceData => {
                        customizationTotal += choiceData.price || 0;
                    });
                });
            }
            return (item.main_dish_price || 0) + customizationTotal;
        } else if (item.food_type === 'SA') {
            // For side items, multiply base_price by quantity
            return item.base_price * item.quantity;
        } else {
            return item.item_price || 0;
        }
    };

    const calculateBasketTotal = (items) => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const totalPrice = Object.values(container)
        .reduce((total, items) => total + calculateBasketTotal(items), 0)
        .toFixed(2);

    const handleRemoveItem = (containerId, itemIndex) => {
        dispatch(removeItemFromContainer({ containerId, itemIndex }));
    };

    const CartItem = ({ item }) => {
        // Calculate main product total based on food type and pricing type
        const mainProductTotal = useMemo(() => {
            if (item.food_type === 'SA') {
                return item.base_price * item.quantity;
            }
            return item.main_dish_price || item.base_price || 0;
        }, [item]);

        const calculateCustomizationsTotal = () => {
            let total = 0;
            if (item.customizations) {
                Object.entries(item.customizations).forEach(([optionId, choices]) => {
                    Object.entries(choices).forEach(([choiceName, choice]) => {
                        // Only include if the choice is available
                        if (choice.is_available) {
                            if (item.food_type === 'PK' && choice.pricing_type === 'INC') {
                                // For package INC items, always include their price
                                total += choice.price;
                            } else if (choice.quantity > 0) {
                                total += choice.price;
                            }
                        }
                    });
                });
            }
            return total;
        };

        const renderCustomizations = () => {
            if (!item.customizations) return null;

            return (
                <div className="mt-2 space-y-2">
                    {Object.entries(item.customizations).map(([category, choices]) => {
                        const availableChoices = Object.entries(choices)
                            .filter(([_, choice]) => choice.is_available && choice.quantity > 0);

                        if (availableChoices.length === 0) return null;

                        return (
                            <div key={category} className="space-y-1">
                                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                    {category}
                                </div>
                                <div className="pl-2 space-y-1">
                                    {availableChoices.map(([choiceName, choice]) => (
                                        <div key={choiceName} 
                                             className="flex justify-between items-center text-[11px]">
                                            <div className="text-gray-400">
                                                • {choiceName}
                                                {choice.quantity > 1 && ` ×${choice.quantity}`}
                                            </div>
                                            <span className="text-gray-500">
                                                GHS {choice.price.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        };

        const itemTotal = mainProductTotal + calculateCustomizationsTotal();

        return (
            <div className="p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800
                          transition-all duration-200 hover:bg-gray-900/70">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-col">
                                <h3 className="font-medium text-gray-200 mb-0.5">
                                    {item.item_name}
                                    {item.pricing_type === 'FIX' && item.quantity > 0 && 
                                        <span className="ml-2 text-sm text-gray-500">×{item.quantity}</span>
                                    }
                                </h3>
                                {item.pricing_type === 'FIX' && (
                                    <span className="text-[11px] text-gray-500">
                                        GHS {item.base_price.toFixed(2)} each
                                    </span>
                                )}
                            </div>
                            <span className="text-yellow-400 font-medium">
                                GHS {mainProductTotal.toFixed(2)}
                            </span>
                        </div>
                        {renderCustomizations()}
                        <div className="mt-2 pt-2 border-t border-gray-800/50 flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total</span>
                            <span className="text-sm font-medium text-yellow-400">
                                GHS {itemTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const BasketContainer = ({ containerId, items }) => {
        const dispatch = useDispatch();
        const repeater = repeaters[containerId] || 1;
        
        const handleRepeaterChange = (action) => {
            let newValue = repeater;
            if (action === 'increase') {
                newValue = repeater + 1;
            } else if (action === 'decrease' && repeater > 1) {
                newValue = repeater - 1;
            }
            
            dispatch({
                type: 'gl_variables/UPDATE_REPEATER',
                payload: { containerId, value: newValue }
            });
        };

        const calculateBasketTotal = () => {
            const itemsTotal = items.reduce((total, item) => {
                if (!item.is_available) return total;
                
                let customizationTotal = 0;

                if (item.customizations) {
                    Object.entries(item.customizations).forEach(([optionId, optionChoices]) => {
                        Object.entries(optionChoices).forEach(([choiceName, choice]) => {
                            if (choice.is_available) {
                                if (item.food_type === 'PK' && choice.pricing_type === 'INC') {
                                    customizationTotal += Number(choice.price) || 0;
                                } else {
                                    if (choice.quantity > 0) {
                                        customizationTotal += Number(choice.price) || 0;
                                    }
                                }
                            }
                        });
                    });
                }

                if (item.food_type === 'SA') {
                    return total + (Number(item.base_price) * Number(item.quantity) || 0);
                } else if (item.food_type === 'MD' || item.food_type === 'PK') {
                    if (item.pricing_type === 'INC') {
                        return total + Number(item.main_dish_price || 0) + customizationTotal;
                    } else {
                        return total + (Number(item.base_price || 0) * Number(item.quantity || 1)) + customizationTotal;
                    }
                }
                return total;
            }, 0);

            return itemsTotal || 0;
        };

        const basketTotal = calculateBasketTotal();
        const finalTotal = basketTotal * repeater;

        return (
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Badge className="px-2.5 py-0.5 bg-gray-900 text-gray-300 border-gray-800">
                            Basket {parseInt(containerId)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                            {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-800/50 rounded-lg border border-gray-700">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white"
                                onClick={() => handleRepeaterChange('decrease')}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm text-gray-200">
                                {repeater}×
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white"
                                onClick={() => handleRepeaterChange('increase')}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-lg font-medium text-yellow-400">
                            GHS {finalTotal.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <CartItem key={index} item={item} />
                    ))}
                </div>
            </div>
        );
    };

    const calculateGrandTotal = () => {
        return Object.entries(container).reduce((grandTotal, [containerId, items]) => {
            const basketTotal = items.reduce((total, item) => {
                if (!item.is_available) return total;
                
                let customizationTotal = 0;

                if (item.customizations) {
                    Object.entries(item.customizations).forEach(([optionId, optionChoices]) => {
                        Object.entries(optionChoices).forEach(([choiceName, choice]) => {
                            if (choice.is_available) {
                                if (item.food_type === 'PK' && choice.pricing_type === 'INC') {
                                    customizationTotal += choice.price;
                                } else {
                                    if (choice.quantity > 0) {
                                        customizationTotal += choice.price;
                                    }
                                }
                            }
                        });
                    });
                }

                if (item.food_type === 'SA') {
                    return total + (item.base_price * item.quantity);
                } else if (item.food_type === 'MD' || item.food_type === 'PK') {
                    if (item.pricing_type === 'INC') {
                        return total + item.main_dish_price + customizationTotal;
                    } else {
                        return total + (item.base_price * (item.quantity || 1)) + customizationTotal;
                    }
                }
                return total;
            }, 0);
            
            // Use the repeaters from props
            const repeater = repeaters[containerId] || 1;
            return grandTotal + (basketTotal * repeater);
        }, 0);
    };

    const handleProceedToCheckout = () => {
        // Validate guest name and phone
        const trimmedName = guestName.trim();
        const trimmedPhone = userPhone.trim();
        
        if (!trimmedName) {
            toast({
                title: "Name Required",
                description: "Please enter your name before proceeding to checkout",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }
        
        if (!trimmedPhone) {
            toast({
                title: "Phone Number Required",
                description: "Please enter your phone number before proceeding to checkout",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        // Optional: Encourage verification before checkout
        if (verificationStatus !== 'success') {
            toast({
                title: "Phone Not Verified",
                description: "We recommend verifying your mobile money number before checkout",
                variant: "warning",
                duration: 4000,
            });
            // Continue anyway - it's just a warning
        }
        
        // Log customer data before proceeding
        console.log("Customer data for checkout:", {
            name: trimmedName,
            phone: trimmedPhone,
            email: userEmail,
            verified: verificationStatus === 'success',
            momoName: momoName
        });
        
        console.log("Current Container State:", container);
        setShowPayment(true);
    };

    // New function to verify the mobile money number
    const verifyMomoNumber = async () => {
        if (!userPhone || userPhone.length < 10) {
            toast({
                title: "Invalid Phone Number",
                description: "Please enter a valid phone number",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        setIsVerifying(true);
        setVerificationStatus(null);
        
        try {
            const response = await axios.post('https://payment.calabash.online/payment/momo/name/', {
                phone: userPhone
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            console.log("MoMo verification response:", response.data);
            
            if (response.data.success) {
                setVerificationStatus('success');
                setMomoName(response.data.name || '');
                
                // Always use the MoMo name when verification is successful
                if (response.data.name) {
                    setGuestName(response.data.name);
                }
                
                toast({
                    title: "Verification Successful",
                    description: `Mobile money account verified: ${response.data.name}`,
                    duration: 3000,
                });
            } else {
                setVerificationStatus('error');
                toast({
                    title: "Verification Failed",
                    description: response.data.message || "Could not verify mobile money account",
                    variant: "destructive",
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error verifying MoMo number:', error);
            setVerificationStatus('error');
            toast({
                title: "Verification Error",
                description: "Failed to connect to verification service",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button className={buttonClassName}>
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg border-gray-800 bg-gray-950/95 backdrop-blur-xl">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-gray-200">Your Cart</SheetTitle>
                </SheetHeader>
                
                {Object.keys(container).length === 0 ? (
                    <EmptyCart />
                ) : (
                    <div className="flex flex-col h-[calc(100vh-8rem)]">
                        <div className="flex-1 overflow-y-auto pr-4 -mr-4 scrollbar-thin 
                                      scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            {Object.entries(container).map(([containerId, items]) => (
                                <BasketContainer 
                                    key={containerId} 
                                    containerId={containerId} 
                                    items={items} 
                                />
                            ))}
                        </div>
                        
                        <div className="mt-auto pt-2 space-y-2 sticky bottom-0 bg-gray-950/95 backdrop-blur-xl">
                            <div className="border-t border-gray-800 pt-2">
                                {/* Customer Selection */}
                                <div className="space-y-3 mb-4">
                                    <div className="relative" ref={searchContainerRef}>
                                        <Command className="rounded-lg border border-gray-800 overflow-visible">
                                            <div className="flex items-center border-b border-gray-800 px-3">
                                                <User className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
                                                <CommandInput
                                                    placeholder="Search customer name..." 
                                                    className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 text-gray-300"
                                                    value={guestName}
                                                    onValueChange={(value) => {
                                                        setGuestName(value);
                                                        if (value.length >= 3) {
                                                            searchUsers(value);
                                                        } else {
                                                            setCommandOpen(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </Command>
                                        
                                        {/* Phone Number Input */}
                                        <div className="flex items-center border border-gray-800 rounded-lg px-3 mt-2">
                                            <Phone className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
                                            <input
                                                id="phoneNumber"
                                                type="tel"
                                                required
                                                placeholder="Phone number (required)"
                                                className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 text-gray-300"
                                                value={userPhone}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setUserPhone(value);
                                                    // Reset verification status when phone changes
                                                    if (verificationStatus) {
                                                        setVerificationStatus(null);
                                                        setMomoName('');
                                                    }
                                                    if (value.length >= 3) {
                                                        setCommandOpen(true);
                                                        searchUsers(value);
                                                    } else {
                                                        setCommandOpen(false);
                                                    }
                                                }}
                                                onFocus={() => {
                                                    if (userPhone && userPhone.length >= 3) {
                                                        setCommandOpen(true);
                                                        searchUsers(userPhone);
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={verifyMomoNumber}
                                                disabled={isVerifying || !userPhone}
                                                className={`ml-2 flex items-center gap-1 px-2 py-1 h-8 transition-colors ${
                                                    verificationStatus === 'success' 
                                                        ? 'text-green-500 hover:text-green-600' 
                                                        : verificationStatus === 'error'
                                                        ? 'text-red-500 hover:text-red-600'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                {isVerifying ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : verificationStatus === 'success' ? (
                                                    <Check className="h-3.5 w-3.5" />
                                                ) : verificationStatus === 'error' ? (
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                ) : (
                                                    "Verify"
                                                )}
                                            </Button>
                                        </div>
                                        
                                        {/* Show MoMo name if verified */}
                                        {verificationStatus === 'success' && momoName && (
                                            <div className="mt-1 text-xs text-green-500 ml-2 flex items-center">
                                                <Check className="h-3 w-3 mr-1" />
                                                <span>Verified: {momoName}</span>
                                            </div>
                                        )}
                                        
                                        {verificationStatus === 'error' && (
                                            <div className="mt-1 text-xs text-red-500 ml-2 flex items-center">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                <span>Verification failed</span>
                                            </div>
                                        )}

                                        {commandOpen && (
                                            <div className="absolute top-full left-0 right-0 z-10 mt-1">
                                                <div className="rounded-md border border-gray-800 bg-gray-900 shadow-lg">
                                                    {isSearching ? (
                                                        <div className="py-3 px-4 text-sm text-gray-400 flex items-center">
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            Searching...
                                                        </div>
                                                    ) : userSearchResults.length === 0 ? (
                                                        <div className="py-3 px-4 text-sm text-gray-400 text-center">
                                                            No customer found. Please enter details manually.
                                                        </div>
                                                    ) : (
                                                        <div className="max-h-[200px] overflow-auto">
                                                            {userSearchResults.map((user) => (
                                                                <div
                                                                    key={user.id || user._id}
                                                                    className="flex items-center px-4 py-2 text-gray-200 hover:bg-gray-800 cursor-pointer"
                                                                    onClick={() => handleCustomerClick(user)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            //guestName === user.name ? "opacity-100 text-yellow-500" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <div className="font-medium">{user.name}</div>
                                                                        <div className="flex text-xs text-gray-400 gap-3">
                                                                            {user.phone && <span>{user.phone}</span>}
                                                                            {user.email && <span className="truncate max-w-[150px]">{user.email}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-base font-medium text-gray-300">Grand Total</span>
                                    <span className="text-xl font-semibold text-yellow-400">
                                        GHS {calculateGrandTotal().toFixed(2)}
                                    </span>
                                </div>
                                
                                <Button 
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 
                                             font-semibold py-4 rounded-xl
                                             transition-all duration-200 
                                             shadow-lg shadow-yellow-500/10
                                             active:scale-[0.98]"
                                    onClick={handleProceedToCheckout}
                                >
                                    Proceed to Checkout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <Payment 
                    isOpen={showPayment}
                    onClose={() => setShowPayment(false)}
                    totalAmount={calculateGrandTotal()}
                    guestName={guestName.trim()}
                    setGuestName={setGuestName}
                    userPhone={userPhone}
                    userEmail={userEmail}
                    verified={verificationStatus === 'success'}
                    momoName={momoName}
                />
            </SheetContent>
        </Sheet>
    );
}
