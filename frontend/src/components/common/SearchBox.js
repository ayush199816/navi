import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBox = ({
  placeholder = 'Search...',
  value = '',
  onChange = () => {},
  onSubmit = () => {},
  className = '',
  inputClassName = '',
  buttonClassName = '',
  showClearButton = true,
  autoFocus = false
}) => {
  const [searchValue, setSearchValue] = useState(value);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    // Call onChange with the event object to match standard input behavior
    if (onChange) {
      // Create a synthetic event with the expected structure
      const syntheticEvent = {
        target: {
          value: newValue,
          name: e.target.name
        },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(syntheticEvent);
    }
  };

  const handleSubmit = (e) => {
    // Check if e is an event object and has preventDefault method
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (onSubmit) {
      // Call with just the value to match parent's expectation
      // The parent's handleSearch will be called with the search value directly
      onSubmit(searchValue);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onChange) {
      onChange('');
    }
    if (onSubmit) {
      onSubmit('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          className={`block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${inputClassName}`}
          placeholder={placeholder}
          value={searchValue}
          onChange={handleChange}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        {showClearButton && searchValue && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <button
        type="submit"
        className={`absolute right-0.5 top-0.5 bottom-0.5 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${buttonClassName}`}
      >
        Search
      </button>
    </form>
  );
};

export default SearchBox;
