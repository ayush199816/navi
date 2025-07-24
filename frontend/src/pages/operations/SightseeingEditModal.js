import React, { useState, useEffect, useCallback } from 'react';

// Default currency mapping based on country
const COUNTRY_CURRENCY_MAP = {
  'India': 'INR',
  'Singapore': 'SGD',
  'United Arab Emirates': 'AED',
  'Indonesia': 'IDR',
  'Thailand': 'THB',
  'Vietnam': 'VND',
  'Malaysia': 'MYR',
  'France': 'EUR',
  'Germany': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'Australia': 'AUD',
  'Canada': 'CAD',
  'Japan': 'JPY',
  'China': 'CNY',
  'South Korea': 'KRW',
  'Russia': 'RUB',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'Saudi Arabia': 'SAR',
  'South Africa': 'ZAR',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'Turkey': 'TRY',
  'Egypt': 'EGP',
  'Philippines': 'PHP',
  'Bangladesh': 'BDT',
  'Pakistan': 'PKR',
  'Sri Lanka': 'LKR',
  'Nepal': 'NPR',
  'Bhutan': 'BTN',
  'Maldives': 'MVR',
  'Mauritius': 'MUR',
  'Seychelles': 'SCR',
  'Oman': 'OMR',
  'Qatar': 'QAR',
  'Kuwait': 'KWD',
  'Bahrain': 'BHD',
  'Jordan': 'JOD',
  'Lebanon': 'LBP',
  'Israel': 'ILS',
  'Iraq': 'IQD',
  'Iran': 'IRR',
  'Afghanistan': 'AFN',
  'Kazakhstan': 'KZT',
  'Uzbekistan': 'UZS',
  'Azerbaijan': 'AZN',
  'Georgia': 'GEL',
  'Armenia': 'AMD',
  'Kyrgyzstan': 'KGS',
  'Tajikistan': 'TJS',
  'Turkmenistan': 'TMT',
  'Mongolia': 'MNT',
  'North Korea': 'KPW',
  'Taiwan': 'TWD',
  'Hong Kong': 'HKD',
  'Macau': 'MOP',
  'Cambodia': 'KHR',
  'Laos': 'LAK',
  'Myanmar': 'MMK',
  'Brunei': 'BND',
  'Timor-Leste': 'USD',
  'Papua New Guinea': 'PGK',
  'Fiji': 'FJD',
  'Solomon Islands': 'SBD',
  'Vanuatu': 'VUV',
  'Samoa': 'WST',
  'Tonga': 'TOP',
  'Kiribati': 'AUD',
  'Tuvalu': 'AUD',
  'Nauru': 'AUD',
  'Palau': 'USD',
  'Marshall Islands': 'USD',
  'Micronesia': 'USD',
  'Cook Islands': 'NZD',
  'Niue': 'NZD',
  'Tokelau': 'NZD',
  'Pitcairn Islands': 'NZD',
  'Wallis and Futuna': 'XPF',
  'French Polynesia': 'XPF',
  'New Caledonia': 'XPF',
  'American Samoa': 'USD',
  'Guam': 'USD',
  'Northern Mariana Islands': 'USD',
  'Puerto Rico': 'USD',
  'US Virgin Islands': 'USD',
  'British Virgin Islands': 'USD',
  'Anguilla': 'XCD',
  'Antigua and Barbuda': 'XCD',
  'Dominica': 'XCD',
  'Grenada': 'XCD',
  'Montserrat': 'XCD',
  'Saint Kitts and Nevis': 'XCD',
  'Saint Lucia': 'XCD',
  'Saint Vincent and the Grenadines': 'XCD',
  'Aruba': 'AWG',
  'Bahamas': 'BSD',
  'Barbados': 'BBD',
  'Bermuda': 'BMD',
  'Cayman Islands': 'KYD',
  'Cuba': 'CUP',
  'Dominican Republic': 'DOP',
  'Haiti': 'HTG',
  'Jamaica': 'JMD',
  'Trinidad and Tobago': 'TTD',
  'Belize': 'BZD',
  'Costa Rica': 'CRC',
  'El Salvador': 'SVC',
  'Guatemala': 'GTQ',
  'Honduras': 'HNL',
  'Nicaragua': 'NIO',
  'Panama': 'PAB',
  'Argentina': 'ARS',
  'Bolivia': 'BOB',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Ecuador': 'USD',
  'Guyana': 'GYD',
  'Paraguay': 'PYG',
  'Peru': 'PEN',
  'Suriname': 'SRD',
  'Uruguay': 'UYU',
  'Venezuela': 'VES',
  'Albania': 'ALL',
  'Andorra': 'EUR',
  'Austria': 'EUR',
  'Belarus': 'BYN',
  'Belgium': 'EUR',
  'Bosnia and Herzegovina': 'BAM',
  'Bulgaria': 'BGN',
  'Croatia': 'HRK',
  'Cyprus': 'EUR',
  'Czech Republic': 'CZK',
  'Denmark': 'DKK',
  'Estonia': 'EUR',
  'Finland': 'EUR',
  'Greece': 'EUR',
  'Hungary': 'HUF',
  'Iceland': 'ISK',
  'Ireland': 'EUR',
  'Latvia': 'EUR',
  'Liechtenstein': 'CHF',
  'Lithuania': 'EUR',
  'Luxembourg': 'EUR',
  'Malta': 'EUR',
  'Moldova': 'MDL',
  'Monaco': 'EUR',
  'Montenegro': 'EUR',
  'Netherlands': 'EUR',
  'North Macedonia': 'MKD',
  'Norway': 'NOK',
  'Poland': 'PLN',
  'Portugal': 'EUR',
  'Romania': 'RON',
  'San Marino': 'EUR',
  'Serbia': 'RSD',
  'Slovakia': 'EUR',
  'Slovenia': 'EUR',
  'Sweden': 'SEK',
  'Ukraine': 'UAH',
  'Vatican City': 'EUR',
  'Algeria': 'DZD',
  'Angola': 'AOA',
  'Benin': 'XOF',
  'Botswana': 'BWP',
  'Burkina Faso': 'XOF',
  'Burundi': 'BIF',
  'Cabo Verde': 'CVE',
  'Cameroon': 'XAF',
  'Central African Republic': 'XAF',
  'Chad': 'XAF',
  'Comoros': 'KMF',
  'Congo': 'XAF',
  'Côte d\'Ivoire': 'XOF',
  'Djibouti': 'DJF',
  'Equatorial Guinea': 'XAF',
  'Eritrea': 'ERN',
  'Eswatini': 'SZL',
  'Ethiopia': 'ETB',
  'Gabon': 'XAF',
  'Gambia': 'GMD',
  'Ghana': 'GHS',
  'Guinea': 'GNF',
  'Guinea-Bissau': 'XOF',
  'Kenya': 'KES',
  'Lesotho': 'LSL',
  'Liberia': 'LRD',
  'Libya': 'LYD',
  'Madagascar': 'MGA',
  'Malawi': 'MWK',
  'Mali': 'XOF',
  'Mauritania': 'MRU',
  'Morocco': 'MAD',
  'Mozambique': 'MZN',
  'Namibia': 'NAD',
  'Niger': 'XOF',
  'Nigeria': 'NGN',
  'Rwanda': 'RWF',
  'Sao Tome and Principe': 'STN',
  'Senegal': 'XOF',
  'Seychelles': 'SCR',
  'Sierra Leone': 'SLL',
  'Somalia': 'SOS',
  'South Africa': 'ZAR',
  'South Sudan': 'SSP',
  'Sudan': 'SDG',
  'Tanzania': 'TZS',
  'Togo': 'XOF',
  'Tunisia': 'TND',
  'Uganda': 'UGX',
  'Zambia': 'ZMW',
  'Zimbabwe': 'ZWL'
};

// Get default currency for a country, fallback to USD if not found
const getDefaultCurrency = (country) => {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
};

const SightseeingEditModal = ({ open, onClose, onEdit, sightseeing }) => {
  const [form, setForm] = useState({
    name: '',
    country: '',
    type: 'activity',
    transferType: 'SIC',
    details: '',
    sellingPrice: '',
    costPrice: '',
    currency: 'INR',
    picture: null,
    picturePreview: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(e => {
    const { name, value, files } = e.target;
    
    setForm(prevForm => {
      const newForm = { ...prevForm };
      
      if (name === 'picture') {
        newForm.picture = files[0];
        newForm.picturePreview = files[0] ? URL.createObjectURL(files[0]) : newForm.picturePreview;
      } else if (name === 'country') {
        // When country changes, update the currency to match the country's default
        newForm.country = value;
        const newCurrency = getDefaultCurrency(value);
        console.log(`Country changed to ${value}, setting currency to ${newCurrency}`);
        newForm.currency = newCurrency;
      } else if (name === 'currency') {
        // Allow manual currency selection
        newForm.currency = value;
      } else if (name === 'type') {
        // When type changes, update the form
        newForm.type = value;
        // If type is 'transfer', set default transfer type to 'PVT'
        if (value === 'transfer') {
          newForm.transferType = 'PVT';
        }
      } else {
        newForm[name] = value;
      }
      
      console.log('Form state after change:', newForm);
      return newForm;
    });
  }, []);

  useEffect(() => {
    if (sightseeing) {
      setForm({
        name: sightseeing.name || '',
        country: sightseeing.country || '',
        type: sightseeing.type || 'activity',
        transferType: sightseeing.transferType || 'SIC',
        details: sightseeing.details || '',
        sellingPrice: sightseeing.sellingPrice || '',
        costPrice: sightseeing.costPrice || '',
        currency: sightseeing.currency || 'INR',
        picture: null,
        picturePreview: sightseeing.picture || ''
      });
    }
  }, [sightseeing]);

  if (!open) return null;



  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Create FormData object
      const fd = new FormData();
      
      // Add all form fields to FormData
      fd.append('name', form.name || '');
      fd.append('type', form.type || 'activity');
      fd.append('country', form.country || '');
      fd.append('transferType', form.transferType || 'SIC');
      fd.append('details', form.details || '');
      fd.append('sellingPrice', form.sellingPrice !== '' ? String(form.sellingPrice) : '0');
      fd.append('costPrice', form.costPrice !== '' ? String(form.costPrice) : '0');
      
      // Explicitly set the currency from the form state
      const currencyToSave = form.currency || 'INR';
      fd.append('currency', currencyToSave);
      
      // Handle picture upload if a new file is selected
      if (form.picture && form.picture instanceof File) {
        fd.append('picture', form.picture);
      }
      
      // Debug: Log all form data being sent
      console.log('Submitting form with data:', {
        name: form.name,
        type: form.type,
        country: form.country,
        transferType: form.transferType,
        details: form.details,
        sellingPrice: form.sellingPrice,
        costPrice: form.costPrice,
        currency: currencyToSave,
        hasPicture: !!form.picture
      });
      
      // Log FormData entries
      console.log('FormData entries:');
      for (let pair of fd.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }
      
      // Call the onEdit function with the form data
      await onEdit(fd);
      onClose();
    } catch (err) {
      console.error('Error updating sightseeing:', err);
      setError(err.message || 'Failed to update sightseeing');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h3 className="text-xl font-bold mb-4">Edit Sightseeing</h3>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="activity"
                  checked={form.type === 'activity'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span className="ml-2">Activity/Sightseeing</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="transfer"
                  checked={form.type === 'transfer'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span className="ml-2">Transfer</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sightseeing Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required className="form-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country *</label>
            <select 
              name="country" 
              value={form.country} 
              onChange={handleChange} 
              required 
              className="form-select w-full"
            >
              <option value="">Select a country</option>
              {Object.keys(COUNTRY_CURRENCY_MAP)
                .sort((a, b) => a.localeCompare(b))
                .map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transfer Type *</label>
            <select 
              name="transferType" 
              value={form.transferType} 
              onChange={handleChange} 
              className="form-select w-full"
              disabled={form.type === 'activity'}
            >
              <option value="SIC">SIC</option>
              <option value="PVT">PVT</option>
            </select>
            {form.type === 'activity' && (
              <p className="text-xs text-gray-500 mt-1">Transfer type is only applicable for Transfers</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sightseeing Details *</label>
            <textarea name="details" value={form.details} onChange={handleChange} required className="form-textarea w-full" rows={3}></textarea>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Selling Price *</label>
              <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} required className="form-input w-full" min="0" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Cost Price *</label>
              <input type="number" name="costPrice" value={form.costPrice} onChange={handleChange} required className="form-input w-full" min="0" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Currency *</label>
              <select 
                name="currency" 
                value={form.currency} 
                onChange={handleChange} 
                required 
                className="form-select w-full"
              >
                <option value="">Select currency</option>
                <option value="INR">Indian Rupees (INR)</option>
                <option value="SGD">Singapore Dollar (SGD)</option>
                <option value="AED">UAE Dirham (AED)</option>
                <option value="IDR">Indonesian Rupiah (IDR)</option>
                <option value="THB">Thai Baht (THB)</option>
                <option value="VND">Vietnamese Dong (VND)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="MYR">Malaysian Ringgit (MYR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Picture</label>
            <input type="file" name="picture" accept="image/*" onChange={handleChange} className="form-input w-full" />
            {form.picturePreview && (
              <img src={form.picturePreview} alt="Preview" className="mt-2 rounded w-full h-32 object-cover border" />
            )}
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn-outline mr-2" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SightseeingEditModal;
