import { Button } from "@/components/ui/button";
import { 
  UserCircle, 
  Clock, 
  ShoppingBasket, 
  History, 
  CreditCard,
  Building2
} from 'lucide-react';
import Cart from "../CartComponents/cart";
import { useSelector, useDispatch } from "react-redux";
import { addNewContainer, setActiveTab } from "@/gl_Var_Reducers";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";

export default function Header() {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.gl_variables.userInfo);
  const activeTab = useSelector((state) => state.gl_variables.activeTab);

  const handleAddContainer = () => {
    dispatch(addNewContainer());
  };

  return (
    <div className="relative border-b border-gray-800/50">
      <div className="relative px-8 py-4">
        <div className="max-w-[1920px] mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            {/* Brand Section */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500
                                flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <span className="text-3xl font-bold text-gray-900">C</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full 
                                bg-green-500 border-2 border-gray-900" />
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Calabash
                  </h1>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full 
                                  bg-green-500/10 border border-green-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-400">Open Now</span>
                    </div>
                    <span className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Operating until 10 PM
                    </span>
                    <span className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      Main Branch
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            {userInfo.name && (
              <div className="flex items-center gap-4 px-6 py-3 rounded-xl
                            bg-gradient-to-r from-gray-800/50 to-gray-800/30
                            border border-gray-700/50 backdrop-blur-sm">
                <UserCircle className="h-12 w-12 text-yellow-400" />
                <div className="flex flex-col">
                  <span className="text-base font-medium text-gray-200">{userInfo.name}</span>
                  <span className="text-sm text-yellow-400/80">System Administrator</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="grid grid-cols-2 gap-8">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => dispatch(setActiveTab(value))} 
              className="w-full"
            >
              <TabsList className="w-full bg-gray-800/30 p-2 rounded-xl">
                <TabsTrigger 
                  value="place-order"
                  className="flex-1 py-3 data-[state=active]:bg-gradient-to-br 
                           data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-400
                           data-[state=active]:text-gray-900 data-[state=active]:font-medium
                           data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20"
                >
                  <ShoppingBasket className="h-5 w-5 mr-2" />
                  Place Order
                </TabsTrigger>
                <TabsTrigger 
                  value="cash-payments"
                  className="flex-1 py-3 data-[state=active]:bg-gradient-to-br 
                           data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-400
                           data-[state=active]:text-gray-900 data-[state=active]:font-medium
                           data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/20"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Cash Payments
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center justify-end gap-4">
              <Button 
                variant="outline"
                size="lg"
                className="bg-gray-800/50 border-gray-700/50 text-gray-300
                         hover:bg-gray-800 hover:text-yellow-400
                         transition-all duration-200"
                onClick={handleAddContainer}
              >
                <ShoppingBasket className="h-5 w-5 mr-2" />
                New Container
              </Button>
              <Cart 
                buttonClassName="bg-gradient-to-r from-yellow-500 to-yellow-400 
                               text-gray-900 hover:from-yellow-400 hover:to-yellow-500
                               transition-all duration-200 shadow-lg shadow-yellow-500/20
                               h-11 px-6" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
