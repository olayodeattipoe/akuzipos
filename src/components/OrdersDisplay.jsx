import { useSelector } from 'react-redux';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle2, XCircle, AlertCircle, Timer } from 'lucide-react';

const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    'pending': {
      color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
      icon: Clock,
      label: 'Pending'
    },
    'preparing': {
      color: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
      icon: Timer,
      label: 'Preparing'
    },
    'completed': {
      color: 'bg-green-400/10 text-green-400 border-green-400/20',
      icon: CheckCircle2,
      label: 'Completed'
    },
    'cancelled': {
      color: 'bg-red-400/10 text-red-400 border-red-400/20',
      icon: XCircle,
      label: 'Cancelled'
    }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1.5`}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

const OrderCard = ({ order }) => {
  const calculateItemTotal = (item) => {
    if (item.food_type === 'MD' || item.food_type === 'PK') {
      return (item.main_dish_price || 0) + (item.customization_price || 0);
    } else if (item.food_type === 'SA') {
      return item.base_price * item.quantity;
    } else {
      return item.item_price || 0;
    }
  };

  const calculateContainerTotal = (items) => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  return (
    <div className="p-3 sm:p-4 bg-gray-900/50 border border-gray-800 rounded-lg space-y-2 sm:space-y-3">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm font-medium text-gray-200">
            Order #{order.uuid.slice(0, 8)}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <span className="text-[10px] sm:text-xs text-gray-400">
          {new Date(order.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Order Items - Updated with container totals */}
      <div className="space-y-1.5 sm:space-y-2">
        {Object.entries(order.containers).map(([containerId, items]) => (
          <div key={containerId} className="pl-2 sm:pl-3 border-l-2 border-gray-800">
            <div className="flex justify-between items-center mb-0.5 sm:mb-1">
              <div className="text-[10px] sm:text-xs font-medium text-gray-300">
                Container {containerId}
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-yellow-400">
                GHS {calculateContainerTotal(items).toFixed(2)}
              </div>
            </div>
            {items.map((item, itemIdx) => (
              <div key={itemIdx} className="space-y-1">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <span className="text-gray-300 text-xs sm:text-sm">{item.item_name}</span>
                      <span className="text-gray-400 text-[10px] sm:text-xs ml-2">
                        GHS {(item.main_dish_price || item.base_price || 0).toFixed(2)}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customizations */}
                {item.customizations && (
                  <div className="ml-2 sm:ml-3 space-y-1">
                    {Object.entries(item.customizations).map(([category, options]) => (
                      <div key={category} className="space-y-0.5">
                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          {category}
                        </div>
                        <div className="pl-2 space-y-0.5">
                          {Object.values(options).map((option, optionIdx) => (
                            <div key={optionIdx} className="flex justify-between items-center text-[10px] sm:text-xs">
                              <div className="text-gray-500">
                                • {option.name}
                                {option.quantity > 1 && ` ×${option.quantity}`}
                              </div>
                              {option.price > 0 && (
                                <span className="text-gray-500">
                                  GHS {option.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Order Footer */}
      <div className="pt-1.5 sm:pt-2 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-gray-400">{order.order_type}</span>
          {order.location && (
            <span className="text-[10px] sm:text-xs text-gray-400">• {order.location}</span>
          )}
        </div>
        <div className="text-sm sm:text-base font-semibold text-yellow-400">
          GHS {Object.values(order.containers).reduce((total, items) => 
            total + calculateContainerTotal(items), 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default function OrdersDisplay() {
  const orders = useSelector(state => state.gl_variables.orders);
  console.log('Orders in component:', orders); // Debug log

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center px-4">
        <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mb-2 sm:mb-3" />
        <h3 className="text-sm sm:text-base text-gray-300 font-medium">No Orders Today</h3>
        <p className="text-xs sm:text-sm text-gray-500">Orders you make today will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] pr-2 sm:pr-4">
      <div className="space-y-2 sm:space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.uuid} order={order} />
        ))}
      </div>
    </ScrollArea>
  );
} 