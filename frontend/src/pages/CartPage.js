import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { removeFromCart, updateQuantity } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import { useCurrency } from '../contexts/CurrencyContext';

export default function CartPage() {
  const { items, total, count } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const updateQuantity = (id, quantity) => {
    dispatch(updateQuantity({ id, quantity }));
  };

  if (count === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Start adding some amazing tours to your cart!</p>
            <div className="mt-6">
              <Link
                to="/tours"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Tours
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Shopping Cart ({count} {count === 1 ? 'item' : 'items'})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-24 w-24 rounded-md overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.name}
                      </h4>
                      <p className="ml-4 text-sm font-medium text-gray-900">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                      <span className="mx-2 text-gray-700">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiPlus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
                    >
                      <FiTrash2 className="mr-1 h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Subtotal</p>
              <p>{formatPrice(total)}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  if (items.length === 0) {
                    toast.error('Your cart is empty');
                    return;
                  }
                  
                  // Get the first item's ID for checkout
                  const firstItemId = items[0].id;
                  navigate(`/guest/checkout/${firstItemId}`);
                }}
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Proceed to Checkout
              </button>
            </div>
            <div className="mt-4 flex justify-center text-sm text-center text-gray-500">
              <p>
                or{' '}
                <Link to="/tours" className="text-blue-600 font-medium hover:text-blue-500">
                  Continue Shopping<span aria-hidden="true"> &rarr;</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
