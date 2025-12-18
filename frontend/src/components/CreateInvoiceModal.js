import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const CreateInvoiceModal = ({ 
  open, 
  onClose, 
  onInvoiceCreated,
  quoteId: initialQuoteId = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteSearch, setShowQuoteSearch] = useState(!initialQuoteId);
  
  // Form state
  const [formData, setFormData] = useState({
    quoteId: initialQuoteId,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerGstin: '',
    items: [
      { description: '', quantity: 1, rate: 0, amount: 0, details: '' }
    ],
    subtotal: 0,
    tax: 0,
    taxRate: 18,
    tcs: 0,
    tcsRate: 5, // Default TCS rate of 5%
    tcsClaimed: false, // Whether TCS is claimed or not
    total: 0,
    notes: '',
    terms: 'Payment due within 15 days of invoice date.',
    dueDate: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    // Payment details
    paymentReceived: false,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    installments: [
      { amount: 0, dueDate: format(new Date(), 'yyyy-MM-dd'), status: 'pending' }
    ],
    // Company details
    companyName: 'Navi Travels',
    companyAddress: '123 Travel Street\nNew Delhi, 110001',
    companyGstin: '07AACCN1234F1Z5',
    companyLogo: '',
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  });

  // Fetch quotes for search
  useEffect(() => {
    if (showQuoteSearch && searchTerm.length > 2) {
      const fetchQuotes = async () => {
        try {
          const response = await axios.get(`/api/quotes?search=${searchTerm}`);
          setQuotes(response.data.data || []);
        } catch (error) {
          console.error('Error fetching quotes:', error);
          toast.error('Failed to fetch quotes');
        }
      };
      
      const debounceTimer = setTimeout(fetchQuotes, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, showQuoteSearch]);

  // Load quote data if quoteId is provided
  useEffect(() => {
    if (initialQuoteId) {
      const fetchQuote = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/quotes/${initialQuoteId}`);
          const quoteData = response.data.data;
          setQuote(quoteData);
          
          // Pre-fill form with quote data
          setFormData(prev => ({
            ...prev,
            quoteId: initialQuoteId,
            customerName: quoteData.customerName || '',
            customerEmail: quoteData.customerEmail || '',
            customerPhone: quoteData.customerPhone || '',
            customerAddress: quoteData.customerAddress || '',
            customerGstin: quoteData.customerGstin || '',
            items: quoteData.items?.length > 0 
              ? quoteData.items.map(item => ({
                  description: item.description || '',
                  quantity: item.quantity || 1,
                  rate: item.rate || 0,
                  amount: (item.quantity || 1) * (item.rate || 0),
                  details: item.details || ''
                }))
              : [{ description: '', quantity: 1, rate: 0, amount: 0, details: '' }],
            notes: quoteData.notes || '',
            terms: quoteData.terms || 'Payment due within 15 days of invoice date.'
          }));
        } catch (error) {
          console.error('Error fetching quote:', error);
          toast.error('Failed to load quote data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchQuote();
    }
  }, [initialQuoteId]);

  // Calculate totals when items, tax rate, or TCS changes
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    
    // Calculate TCS based on the TCS rate if claimed
    const tcsRate = parseFloat(formData.tcsRate) || 5; // Default 5% if not set
    const tcs = formData.tcsClaimed ? (subtotal * (tcsRate / 100)) : 0;
    
    const total = subtotal + tax + tcs;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      taxRate,
      tcs,
      tcsRate,
      total,
      // Update the first installment amount if it's the only one
      installments: prev.installments.length === 1 ? [
        { ...prev.installments[0], amount: total }
      ] : prev.installments
    }));
  }, [formData.items, formData.taxRate, formData.tcsClaimed, formData.tcsRate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle installment changes
  const handleInstallmentChange = (index, field, value) => {
    const newInstallments = [...formData.installments];
    newInstallments[index] = {
      ...newInstallments[index],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value
    };
    
    setFormData(prev => ({
      ...prev,
      installments: newInstallments
    }));
  };

  // Add a new installment
  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [
        ...prev.installments,
        { amount: 0, dueDate: format(new Date(), 'yyyy-MM-dd'), status: 'pending' }
      ]
    }));
  };

  // Remove an installment
  const removeInstallment = (index) => {
    if (formData.installments.length <= 1) return; // Keep at least one installment
    
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index)
    }));
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const currentItem = { ...newItems[index] };
    
    // Update the changed field
    currentItem[field] = field === 'quantity' || field === 'rate' ? parseFloat(value) || 0 : value;
    
    // Calculate amount, total, and unitPrice when quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(currentItem.quantity) || 0;
      const rate = parseFloat(currentItem.rate) || 0;
      const amount = quantity * rate;
      
      currentItem.amount = parseFloat(amount.toFixed(2));
      currentItem.total = parseFloat(amount.toFixed(2));
      currentItem.unitPrice = rate;
    }
    
    newItems[index] = currentItem;
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0, details: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const selectQuote = (selectedQuote) => {
    setQuote(selectedQuote);
    setShowQuoteSearch(false);
    
    // Pre-fill form with quote data
    setFormData(prev => ({
      ...prev,
      quoteId: selectedQuote._id,
      customerName: selectedQuote.customerName || '',
      customerEmail: selectedQuote.customerEmail || '',
      customerPhone: selectedQuote.customerPhone || '',
      customerAddress: selectedQuote.customerAddress || '',
      customerGstin: selectedQuote.customerGstin || '',
      items: selectedQuote.items?.length > 0 
        ? selectedQuote.items.map(item => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            amount: (item.quantity || 1) * (item.rate || 0),
            details: item.details || ''
          }))
        : [{ description: '', quantity: 1, rate: 0, amount: 0, details: '' }],
      notes: selectedQuote.notes || '',
      terms: selectedQuote.terms || 'Payment due within 15 days of invoice date.'
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          companyLogo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Format currency with Rupee symbol
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('₹', '₹ '); // Ensure space after Rupee symbol
  };

  const generateInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${formData.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10px; 
            line-height: 1.3; 
            margin: 0; 
            padding: 10px; 
            color: #333; 
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
          }
          .company-logo { 
            max-width: 100px; 
            max-height: 60px; 
            margin-bottom: 10px; 
          }
          .company-details { 
            margin-bottom: 10px; 
            font-size: 9px;
          }
          .invoice-title { 
            text-align: center; 
            margin: 10px 0; 
            font-size: 12px;
          }
          .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
            font-size: 9px;
          }
          .invoice-info { 
            flex: 1; 
            font-size: 9px;
          }
          .customer-info { 
            flex: 1; 
            font-size: 9px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0; 
            font-size: 9px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px; 
            text-align: left; 
            font-size: 9px;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: 600; 
          }
          .text-right { 
            text-align: right; 
          }
          .total-row { 
            font-weight: bold; 
            background-color: #f9f9f9; 
          }
          .terms { 
            margin-top: 20px; 
            padding-top: 10px; 
            border-top: 1px solid #eee; 
            font-size: 8px;
          }
          .footer { 
            margin-top: 25px; 
            text-align: center; 
            font-size: 8px; 
            color: #777; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              ${formData.companyLogo ? `<img src="${formData.companyLogo}" alt="Company Logo" class="company-logo">` : ''}
              <div class="company-details">
                <h2>${formData.companyName}</h2>
                <p>${formData.companyAddress.replace(/\n/g, '<br>')}</p>
                ${formData.companyGstin ? `<p><strong>GSTIN:</strong> ${formData.companyGstin}</p>` : ''}
              </div>
            </div>
            <div>
              <h1 class="invoice-title" style="font-size: 14px; margin: 5px 0;">TAX INVOICE</h1>
              <p style="margin: 2px 0; font-size: 9px;"><strong>Invoice #:</strong> ${formData.invoiceNumber}</p>
              <p style="margin: 2px 0; font-size: 9px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 2px 0; font-size: 9px;"><strong>Due Date:</strong> ${new Date(formData.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="invoice-details">
            <div class="customer-info">
              <h3 style="font-size: 10px; margin: 5px 0;">Bill To:</h3>
              <p><strong>${formData.customerName}</strong></p>
              <p>${formData.customerEmail}</p>
              <p>${formData.customerPhone}</p>
              ${formData.customerAddress ? `<p>${formData.customerAddress.replace(/\n/g, '<br>')}</p>` : ''}
              ${formData.customerGstin ? `<p><strong>GSTIN:</strong> ${formData.customerGstin}</p>` : ''}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate (₹)</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${formData.items.map(item => `
                <tr>
                  <td>${item.description}${item.details ? `<br><small>${item.details}</small>` : ''}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.rate)}</td>
                  <td class="text-right" style="font-size: 9px;">${formatCurrency(item.quantity * item.rate)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                <td class="text-right">${formatCurrency(formData.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right"><strong>Tax (${formData.taxRate}%):</strong></td>
                <td class="text-right">${formatCurrency(formData.tax)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">
                  <strong>${formData.tcsClaimed ? `TCS (${formData.tcsRate}%):` : 'TCS:'}</strong>
                  ${!formData.tcsClaimed ? '<br><small class="text-gray-500">Not claimed on this invoice</small>' : ''}
                </td>
                <td class="text-right">${formData.tcsClaimed ? formatCurrency(formData.tcs) : 'N/A'}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" class="text-right"><strong>Total Amount:</strong></td>
                <td class="text-right">${formatCurrency(formData.total)}</td>
              </tr>
              <tr>
                <td colspan="4" class="text-right py-2">
                  <div class="text-sm text-gray-600">
                    ${formData.paymentReceived 
                      ? `<span style="color: #15803d; font-size: 9px;">✓ Payment received on ${new Date(formData.paymentDate).toLocaleDateString()}</span>` 
                      : '<span style="font-size: 9px;">Payment pending</span>'}
                  </div>
                </td>
              </tr>
              ${formData.installments.length > 1 ? `
                <tr>
                  <td colspan="4" class="py-2">
                    <div class="text-sm">
                      <strong style="font-size: 9px;">Payment Schedule:</strong>
                      <ul class="list-disc pl-5 mt-1">
                        ${formData.installments.map(inst => `
                          <li class="${inst.status === 'paid' ? 'text-green-600' : inst.status === 'overdue' ? 'text-red-600' : ''}">
                            ${formatCurrency(inst.amount)} due on ${new Date(inst.dueDate).toLocaleDateString()}
                            <span style="font-size: 8px; ${inst.status === 'paid' ? 'color: #15803d;' : inst.status === 'overdue' ? 'color: #b91c1c;' : ''}">
                              ${inst.status === 'paid' ? ' (Paid)' : inst.status === 'overdue' ? ' (Overdue)' : ''}
                            </span>
                          </li>
                        `).join('')}
                      </ul>
                    </div>
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          ${formData.notes ? `
            <div class="terms">
              <h3 style="font-size: 10px; margin: 5px 0;">Notes:</h3>
              <p>${formData.notes.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
          
          <div class="terms">
            <h3 style="font-size: 10px; margin: 5px 0;">Terms & Conditions:</h3>
            <p>${formData.terms.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>${formData.companyName} | ${formData.companyAddress.replace(/\n/g, ' | ')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Generate the invoice HTML
      const invoiceContent = generateInvoiceHTML();
      
      // Create a temporary div to render the invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '20mm';
      tempDiv.style.background = 'white';
      tempDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
      tempDiv.innerHTML = invoiceContent;
      document.body.appendChild(tempDiv);
      
      // Use html2canvas to capture the invoice as an image
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        scrollY: -window.scrollY
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Save the PDF
      pdf.save(`invoice-${formData.invoiceNumber}.pdf`);
      
      // Clean up
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    
    // Calculate final values with proper number handling
    const subtotal = formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (quantity * rate);
    }, 0);

    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
    const tcsRate = parseFloat(formData.tcsRate) || 0;
    const tcs = formData.tcsClaimed ? parseFloat((subtotal * (tcsRate / 100)).toFixed(2)) : 0;
    
    // Calculate total tax (TCS + tax) when TCS is claimed
    const totalTax = formData.tcsClaimed ? taxAmount + tcs : taxAmount;
    const total = parseFloat((subtotal + totalTax).toFixed(2));

    // Prepare items in the expected format
    const items = formData.items.map(item => ({
      description: item.description || 'No description',
      quantity: parseFloat(item.quantity) || 1,
      unitPrice: parseFloat(item.rate) || 0,
      total: parseFloat((parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)).toFixed(2))
    }));

    // Prepare the invoice data in the expected format
    const invoiceData = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      customerGstin: formData.customerGstin || '',
      items,
      total,
      tax: totalTax, // This now includes both tax and TCS when applicable
      taxRate,
      tcsRate: formData.tcsClaimed ? tcsRate : undefined,
      tcs: formData.tcsClaimed ? tcs : undefined,
      currency: 'INR',
      status: 'draft',
      dueDate: formData.dueDate,
      issueDate: new Date().toISOString(),
      notes: formData.notes || '',
      terms: formData.terms || 'Payment due within 15 days of invoice date.'
    };

    // Remove undefined values
    Object.keys(invoiceData).forEach(key => invoiceData[key] === undefined && delete invoiceData[key]);

    // Save the invoice
    const response = await axios.post('/api/invoices', invoiceData);
    toast.success('Invoice created successfully!');
    onInvoiceCreated(response.data);
    onClose();
  } catch (error) {
    console.error('Error creating invoice:', error);
    toast.error(error.response?.data?.message || 'Failed to create invoice');
  } finally {
    setLoading(false);
  }
};
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Create New Invoice</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {loading && !quote ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            <span className="ml-2">Loading quote data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Quote Selection */}
            {showQuoteSearch && (
              <div className="mb-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-lg font-medium mb-3">Select a Quote</h3>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search quotes by ID, customer name, or email..."
                    className="w-full p-2 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {quotes.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quote ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quotes.map((quote) => (
                          <tr key={quote._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">{quote.quoteId}</td>
                            <td className="px-4 py-2 text-sm">
                              <div>{quote.customerName}</div>
                              <div className="text-xs text-gray-500">{quote.customerEmail}</div>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                minimumFractionDigits: 2
                              }).format(quote.total || 0)}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {quote.createdAt ? format(new Date(quote.createdAt), 'dd MMM yyyy') : 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <button
                                type="button"
                                onClick={() => selectQuote(quote)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : searchTerm.length > 2 ? (
                  <div className="text-center py-4 text-gray-500">
                    No quotes found matching "{searchTerm}"
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {searchTerm.length > 0 
                      ? 'Type at least 3 characters to search' 
                      : 'Search for a quote to pre-fill invoice details'}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowQuoteSearch(false)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Or, create invoice without a quote
                  </button>
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    name="customerGstin"
                    value={formData.customerGstin}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    name="companyGstin"
                    value={formData.companyGstin}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Address *</label>
                  <textarea
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-1" /> Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate (₹)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full p-1 border rounded"
                            placeholder="Item description"
                            required
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.details}
                            onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                            className="w-full p-1 border rounded"
                            placeholder="Details (optional)"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-20 p-1 border rounded text-right"
                            required
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            className="w-24 p-1 border rounded text-right"
                            required
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 2
                          }).format(item.amount)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={formData.items.length <= 1}
                          >
                            <Minus size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Invoice Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="paymentReceived"
                        name="paymentReceived"
                        checked={formData.paymentReceived}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="paymentReceived" className="ml-2 block text-sm font-medium text-gray-700">
                        Payment Received
                      </label>
                    </div>
                    
                    {formData.paymentReceived && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                        <input
                          type="date"
                          name="paymentDate"
                          value={formData.paymentDate}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    )}
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Installments</label>
                        <button
                          type="button"
                          onClick={addInstallment}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Add Installment
                        </button>
                      </div>
                      
                      {formData.installments.map((installment, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2 mb-2 items-end">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
                            <input
                              type="number"
                              value={installment.amount}
                              onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                              className="w-full p-2 border rounded-md"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                            <input
                              type="date"
                              value={installment.dueDate}
                              onChange={(e) => handleInstallmentChange(idx, 'dueDate', e.target.value)}
                              className="w-full p-2 border rounded-md"
                            />
                          </div>
                          <div className="flex items-end">
                            <select
                              value={installment.status}
                              onChange={(e) => handleInstallmentChange(idx, 'status', e.target.value)}
                              className="w-full p-2 border rounded-md mr-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </select>
                            {formData.installments.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInstallment(idx)}
                                className="p-2 text-red-500 hover:text-red-700"
                                title="Remove installment"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TCS Rate (%)</label>
                    <div className="flex items-center">
                      <div className="w-full p-2 border rounded-l-md bg-gray-50 text-gray-500">
                        5% of subtotal
                      </div>
                      <label className="bg-gray-100 p-2 border border-l-0 rounded-r-md">
                        <input
                          type="checkbox"
                          name="tcsClaimed"
                          checked={formData.tcsClaimed}
                          onChange={handleInputChange}
                          className="mr-1"
                        />
                        Apply TCS (5% of subtotal)
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full p-2 border rounded-md"
                      placeholder="Additional notes or terms..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          minimumFractionDigits: 2
                        }).format(formData.subtotal || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <span>Tax ({formData.taxRate}%):</span>
                      </div>
                      <span>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          minimumFractionDigits: 2
                        }).format(formData.tax || 0)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          minimumFractionDigits: 2
                        }).format(formData.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax and TCS Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Tax Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Tax Information</h3>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Tax Amount: </span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR'
                    }).format(formData.tax || 0)}
                  </span>
                </div>
              </div>

              {/* TCS Information */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">TCS Information</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.tcsClaimed}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        tcsClaimed: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Apply TCS</span>
                  </label>
                </div>
                
                {formData.tcsClaimed && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">TCS Rate (%)</label>
                      <input
                        type="number"
                        name="tcsRate"
                        value={formData.tcsRate}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">TCS Amount: </span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(formData.tcs || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR'
                    }).format(formData.subtotal || 0)}
                  </span>
                </div>
                
                {formData.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
                    <span>
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(formData.tax || 0)}
                    </span>
                  </div>
                )}
                
                {formData.tcsClaimed && formData.tcs > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TCS ({formData.tcsRate}%):</span>
                    <span>
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(formData.tcs || 0)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR'
                    }).format(formData.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Terms & Conditions</h3>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-2 border rounded-md"
                placeholder="Payment terms and conditions..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create & Save Invoice'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
