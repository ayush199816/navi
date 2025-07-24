import React, { useState, useCallback } from 'react';

// Default currency mapping based on country
const COUNTRY_CURRENCY_MAP = {
  'India': 'INR',
  'Singapore': 'SGD',
  'United Arab Emirates': 'AED',
  'Dubai': 'AED', // Adding Dubai as a separate entry that also uses AED
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

const SightseeingAddModal = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState({
    name: '',
    country: '',
    type: 'activity',
    transferType: 'SIC',
    details: '',
    sellingPrice: '',
    costPrice: '',
    currency: 'INR',
    picture: null
  });
  
  // List of countries for the dropdown
  const countries = [
    'India',
    'United Arab Emirates',
    'Dubai',
    'Singapore',
    'Thailand',
    'Indonesia',
    'Malaysia',
    'Vietnam',
    'Sri Lanka',
    'Maldives',
    'Mauritius',
    'Nepal',
    'Bhutan',
    'France',
    'Italy',
    'Spain',
    'United Kingdom',
    'United States',
    'Canada',
    'Australia',
    'New Zealand',
    'Japan',
    'South Korea',
    'China',
    'Russia'
  ].sort();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(e => {
    const { name, value, files } = e.target;
    
    setForm(prevForm => {
      const newForm = { ...prevForm };
      
      if (name === 'picture') {
        newForm.picture = files[0];
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

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Debug: Log form data before creating FormData
      console.log('Form data before submission:', {
        name: form.name,
        type: form.type,
        country: form.country,
        transferType: form.transferType,
        details: form.details,
        sellingPrice: form.sellingPrice,
        costPrice: form.costPrice,
        currency: form.currency,
        hasPicture: !!form.picture
      });

      // Prepare form data for file upload
      const fd = new FormData();
      fd.append('name', form.name || '');
      fd.append('type', form.type || 'activity');
      fd.append('country', form.country || '');
      fd.append('transferType', form.transferType || 'SIC');
      fd.append('details', form.details || '');
      fd.append('sellingPrice', form.sellingPrice !== '' ? String(form.sellingPrice) : '0');
      fd.append('costPrice', form.costPrice !== '' ? String(form.costPrice) : '0');
      fd.append('currency', form.currency || 'INR');
      
      if (form.picture) {
        fd.append('picture', form.picture);
      }
      
      // Debug: Log all entries in FormData
      console.log('FormData entries:');
      for (let pair of fd.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }
      
      console.log('Submitting form with currency:', form.currency);
      await onAdd(fd);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add sightseeing');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-semibold">Add New Sightseeing</h2>
        {error && <div className="text-red-500 text-sm">{error}</div>}
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
              <select name="currency" value={form.currency} onChange={handleChange} required className="form-select w-full">
                <option value="INR">Indian Rupees (INR)</option>
                <option value="SGD">Singapore Dollar (SGD)</option>
                <option value="AED">UAE Dirham (AED)</option>
                <option value="IDR">Indonesian Rupiah (IDR)</option>
                <option value="THB">Thai Baht (THB)</option>
                <option value="VND">Vietnamese Dong (VND)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="MYR">Malaysian Ringgit (MYR)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Picture</label>
            <input type="file" name="picture" accept="image/*" onChange={handleChange} className="form-input w-full" />
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn-outline mr-2" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SightseeingAddModal;
