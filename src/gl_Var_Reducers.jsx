import {createSlice} from "@reduxjs/toolkit"; 
import { v4 as uuidv4 } from 'uuid';

const generateValidUserId = () => {
    return uuidv4();
};

const initialState = {
    selectedCategory: '',
    currentArray: [],
    filteredArray: [],
    NavMenuArray:[],
    container: {},
    container_id: 1,
    selectedContainer: 1,
    searchQuery: '',
    currentMainDish: null,
    customOptions: {},
    activeTab: 'place-order',
    order: {
        user_id: "",
        name: "",
        email: "",
        order_type: "",
        location: "",
        phone: "",
        containers: {},
        Payment: "",
        isLoggedIn: false,
    },
    userInfo: {},
    orders: []
};

const HandleContainerEntries = (state, action) => {
    const { 
        Belonging_Category, 
        item_id, 
        item_name, 
        item_price, 
        food_type,
        pricing_type,
        is_available,
        if_package_price_lock,
        package_lock,
    } = action.payload;

    // Initialize container if it doesn't exist
    if (!state.container[state.selectedContainer]) {
        state.container[state.selectedContainer] = [];
    }

    // For MD or PK type, check if one already exists in current container
    if (food_type === 'MD' || food_type === 'PK') {
        const existingMDorPK = state.container[state.selectedContainer]
            .find(item => item.food_type === 'MD' || item.food_type === 'PK');
        
        if (existingMDorPK) {
            // Create new container for the new main dish or package
            const newContainerId = Math.max(...Object.keys(state.container).map(Number)) + 1;
            state.container[newContainerId] = [];
            state.selectedContainer = newContainerId;
        }

        // Add new MD or PK item with customization properties
        state.container[state.selectedContainer].push({
            item_name,
            item_id,
            item_price,
            base_price: item_price,
            main_dish_price: item_price,
            Belonging_Category,
            food_type,
            pricing_type,
            is_available,
            if_package_price_lock,
            package_lock,
            quantity: 1,
            customizations: {},
            customization_price: 0,
            current_price: item_price
        });

        // Set customization mode
        state.currentMainDish = action.payload;
    } else {
        // For SA type, handle quantity increment if item exists
        const existingItemIndex = state.container[state.selectedContainer]
            .findIndex(item => item.item_id === item_id);
        
        if (existingItemIndex !== -1) {
            const existingItem = state.container[state.selectedContainer][existingItemIndex];
            existingItem.quantity += 1;
            existingItem.item_price = existingItem.base_price * existingItem.quantity;
            return;
        }

        // Add new SA item with quantity handling
        state.container[state.selectedContainer].push({
            item_name,
            item_id,
            item_price,
            base_price: item_price,
            Belonging_Category,
            food_type,
            pricing_type,
            is_available,
            if_package_price_lock,
            package_lock,
            quantity:1
        });
    }
}



const gl_variables = createSlice({
    name:'gl_variables',

    initialState,

    reducers:{
        setSelectedCategory: (state, action)=>{
            state.selectedCategory = action.payload;
            state.currentArray = [];
        },

        setCustomOptions: (state, action) => {
            state.customOptions = action.payload;
            state.currentMainDish = [];
        },

        setCurrentArray: (state, action) => {state.currentArray = action.payload},
        setNavMenuArray: (state, action)=>{state.NavMenuArray = action.payload},
        setContainer:(state,action)=> {HandleContainerEntries(state,action)},

        setSelectedContainer:(state,action)=>{
            state.selectedContainer = action.payload;
            
            // Find main dish or package in the new selected container
            const container = state.container[action.payload];
            if (container) {
                const mainDishOrPackage = container.find(item => 
                    item.food_type === 'MD' || item.food_type === 'PK'
                );
                if (mainDishOrPackage) {
                    // Find the complete item data from currentArray
                    const completeItemData = state.currentArray.find(item => 
                        item.id === mainDishOrPackage.item_id
                    );
                    
                    // Update currentMainDish with the complete data
                    state.currentMainDish = {
                        ...mainDishOrPackage,
                        id: mainDishOrPackage.item_id,
                        name: mainDishOrPackage.item_name,
                    };
                }
            }
        },

        addNewContainer: (state) => {
            const newContainerId = Object.keys(state.container).length + 1;
            state.container[newContainerId] = [];
            state.selectedContainer = newContainerId;
        },

        removeContainer: (state, action) => {
            const containerId = action.payload;
            delete state.container[containerId];
            if (state.selectedContainer === containerId) {
                state.selectedContainer = Object.keys(state.container)[0] || 1;
            }
        },

        removeItemFromContainer: (state, action) => {
            const { containerId, itemIndex, item_id, food_type, forceRemove } = action.payload;
            
            const container = state.container[containerId];
            if (!container) {
                return;
            }

            // If itemIndex is -1, find the item by id
            const targetIndex = itemIndex === -1 
                ? container.findIndex(item => item.item_id === item_id)
                : itemIndex;

            if (targetIndex === -1) {
                return;
            }

            const item = container[targetIndex];
            if (forceRemove) {
                container.splice(targetIndex, 1);
            } else if (item.quantity > 1) {
                item.quantity -= 1;
                item.item_price = item.base_price * item.quantity;
            } else {
                container.splice(targetIndex, 1);
            }

            // Clean up empty containers
            if (container.length === 0) {
                delete state.container[containerId];
                state.selectedContainer = Object.keys(state.container)[0] || 1;
            }
        },

        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
            // Filter currentArray based on search query
            if (action.payload.trim() === '') {
                state.filteredArray = state.currentArray;
            } else {
                state.filteredArray = state.currentArray.filter(item =>
                    item.name.toLowerCase().includes(action.payload.toLowerCase()) ||
                    (item.description && item.description.toLowerCase().includes(action.payload.toLowerCase()))
                );
            }
        },

        clearSearch: (state) => {
            state.searchQuery = '';
            state.filteredArray = state.currentArray;
        },

        setCurrentMainDish: (state, action) => {
            state.currentMainDish = action.payload;
            
            
        },


        UPDATE_CUSTOMIZATION: (state, action) => {
            const { containerId, optionId, choice } = action.payload;
            const currentContainer = state.container[containerId];
            const mainDishIndex = currentContainer.findIndex(item => 
                item.food_type === 'MD' || item.food_type === 'PK'
            );
            
            if (mainDishIndex === -1) return;
            
            const mainDish = currentContainer[mainDishIndex];
            if (!mainDish.customizations[optionId]) {
                mainDish.customizations[optionId] = {};
            }
            
            // Fix: Access the correct path to get the option
            const option = state.customOptions.customOptions[optionId];
            if (option?.option_type === 'radio' && choice.quantity > 0) {
                Object.keys(mainDish.customizations[optionId]).forEach(existingChoiceId => {
                    delete mainDish.customizations[optionId][existingChoiceId];
                });
            }
            
            // Update or remove choice based on quantity
            if (choice.quantity === 0) {
                delete mainDish.customizations[optionId][choice.id];
                if (Object.keys(mainDish.customizations[optionId]).length === 0) {
                    delete mainDish.customizations[optionId];
                }
            } else {
                mainDish.customizations[optionId][choice.id] = {
                    quantity: choice.quantity,
                    name: choice.name,
                    price: choice.price,
                    pricing_type: choice.pricing_type,
                    is_available: choice.is_available
                };
            }
            
            // Calculate only customization total
            let customizationTotal = 0;
            Object.entries(mainDish.customizations).forEach(([optId, choices]) => {
                Object.entries(choices).forEach(([choiceId, choiceData]) => {
                    customizationTotal += choiceData.price;
                });
            });
            
            mainDish.customization_price = customizationTotal;
        },

        UPDATE_MAIN_DISH_QUANTITY: (state, action) => {
            const { containerId, action: quantityAction, mainDish } = action.payload;
            const currentContainer = state.container[containerId];
            const mainDishIndex = currentContainer.findIndex(item => 
                item.food_type === 'MD' || item.food_type === 'PK'
            );
            
            if (mainDishIndex === -1) return;
            
            const currentMainDish = currentContainer[mainDishIndex];
            
            // Handle main dish price only
            if ((mainDish.pricing_type || 'FIX') === 'INC') {
                if (quantityAction === 'increase') {
                    if (!currentMainDish.main_dish_price || currentMainDish.main_dish_price === 0) {
                        currentMainDish.main_dish_price = mainDish.base_price;
                    } else {
                        currentMainDish.main_dish_price += 1;
                    }
                } else if (quantityAction === 'decrease' && currentMainDish.main_dish_price > mainDish.base_price) {
                    currentMainDish.main_dish_price -= 1;
                }
                currentMainDish.quantity = 1;
            } else {
                if (quantityAction === 'increase') {
                    currentMainDish.quantity += 1;
                } else if (quantityAction === 'decrease' && currentMainDish.quantity > 1) {
                    currentMainDish.quantity -= 1;
                }
                currentMainDish.main_dish_price = mainDish.base_price * currentMainDish.quantity;
            }
            
            // Update final price by combining main dish price and existing customization price
            currentMainDish.current_price = currentMainDish.main_dish_price + (currentMainDish.customization_price || 0);
        },

        SET_USER_INFO: (state, action) => {
            // Only update if not in POS mode
            if (action.payload.userId?.startsWith('POS_')) {
                return state;
            }
            return {
                ...state,
                userInfo: action.payload
            };
        },

        SET_DELIVERY_PHONE: (state, action) => {
            return {
                ...state,
                deliveryPhone: action.payload
            }
        },

        clearCart: (state) => { 
            state.container = {};
            state.selectedContainer = 1;
            // Generate new POS user ID after cart is cleared
            state.userInfo.userId = generateValidUserId();
            state.userInfo.email = `${generateValidUserId()}@gmail.com`;
        },

        UPDATE_MAIN_DISH: (state, action) => {
            const { containerId, quantity, price } = action.payload;
            const currentContainer = state.container[containerId];
            const mainDishIndex = currentContainer.findIndex(item => 
                item.food_type === 'MD' || item.food_type === 'PK'
            );
            
            if (mainDishIndex === -1) return;
            
            const mainDish = currentContainer[mainDishIndex];
            mainDish.quantity = quantity;
            mainDish.main_dish_price = price;
            mainDish.current_price = price + (mainDish.customization_price || 0);
        },

        CLEAN_CARD_STATE: (state) => {
            state.currentMainDish = null;
            state.customOptions = {
                customOptions: {},  // Initialize with empty object structure
                is_available: true,
                base_price: 0,
                base_product_pricing_type: 'FIX'
            };
            state.filteredArray = state.currentArray;
            state.searchQuery = '';
        },

        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },

        clearUserInfo: (state) => {
            state.userInfo = {
                name: '',
                userId: '',
                isLoggedIn: false,
                email: '',
                phone: ''
            };
        },

        regenerateUserId: (state) => {
            const newUserId = generateValidUserId();
            state.userInfo = {
                ...state.userInfo,
                userId: newUserId,
                email: `${newUserId}@gmail.com`,
                isLoggedIn: state.userInfo.isLoggedIn
            };
        },

        setOrders: (state, action) => {
            state.orders = action.payload;
        },

        addOrder: (state, action) => {
            if (!state.orders) {
                state.orders = [];
            }
            state.orders.unshift(action.payload);
        },

        updateOrder: (state, action) => {
            const { uuid, ...updates } = action.payload;
            const orderIndex = state.orders?.findIndex(order => order.uuid === uuid);
            if (orderIndex !== -1 && state.orders) {
                state.orders[orderIndex] = { ...state.orders[orderIndex], ...updates };
            }
        },

        setUserInfo: (state, action) => {
            state.userInfo = {
                ...state.userInfo,
                ...action.payload
            };
        }
    }
})

export const {
    setCurrentArray,
    setNavMenuArray,
    setCustomOptions,
    setSelectedCategory,
    setContainer,
    setSelectedContainer,
    addNewContainer,
    removeContainer,
    removeItemFromContainer,
    setSearchQuery,
    clearSearch,
    setCurrentMainDish,
    UPDATE_CUSTOMIZATION,
    UPDATE_MAIN_DISH_QUANTITY,
    SET_USER_INFO,
    SET_DELIVERY_PHONE,
    clearCart,
    UPDATE_MAIN_DISH,
    CLEAN_CARD_STATE,
    setActiveTab,
    clearUserInfo,
    regenerateUserId,
    setOrders,
    addOrder,
    updateOrder,
    setUserInfo
} = gl_variables.actions;
export default gl_variables.reducer;
