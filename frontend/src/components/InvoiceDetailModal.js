import React, { useState } from 'react';
import { X, Printer, Download, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceDetailModal = ({ 
  open, 
  onClose, 
  invoice, 
  onMarkAsPaid,
  onDelete,
  loading 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!open) return null;
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount || 0);
  };

  // Calculate subtotal for display fallback
  const calculatedSubtotal = invoice?.items?.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const rateValue = item.rate ?? item.unitPrice ?? 0;
    const rate = parseFloat(rateValue) || 0;
    return sum + (quantity * rate);
  }, 0) || 0;
  const displaySubtotal = (typeof invoice?.subtotal === 'number' && !Number.isNaN(invoice.subtotal))
    ? invoice.subtotal
    : calculatedSubtotal;

  const handleMarkAsPaid = async () => {
    try {
      await onMarkAsPaid(invoice._id);
      toast.success('Invoice marked as paid successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error marking invoice as paid');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await onDelete(invoice._id);
        toast.success('Invoice deleted successfully');
        onClose();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting invoice');
      }
    }
  };

  const generateInvoiceHTML = () => {
    const hasStoredSubtotal = typeof invoice?.subtotal === 'number' && !Number.isNaN(invoice?.subtotal);
    const subtotal = hasStoredSubtotal
      ? invoice.subtotal
      : (invoice?.items?.reduce((sum, item) => {
          const quantity = parseFloat(item.quantity) || 0;
          const rateValue = item.rate ?? item.unitPrice ?? 0;
          const rate = parseFloat(rateValue) || 0;
          return sum + (quantity * rate);
        }, 0) || 0);
    
    // Rates from invoice or defaults
    const taxRate = parseFloat(invoice?.taxRate) || 0;
    const tcsRate = parseFloat(invoice?.tcsRate) || 0;
    
    // Prefer stored tax/tcs values, fall back to recalculation
    const storedTax = typeof invoice?.tax === 'number' ? invoice.tax : 0;
    const storedTcs = typeof invoice?.tcs === 'number' ? invoice.tcs : 0;
    const computedTax = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
    const computedTcs = invoice?.tcsClaimed ? parseFloat(((subtotal * tcsRate) / 100).toFixed(2)) : 0;
    
    const taxAmount = storedTax
      ? Math.max(storedTax - storedTcs, 0)
      : computedTax;
    const tcsAmount = storedTcs || computedTcs;
    const totalTax = taxAmount + tcsAmount;
    
    const total = typeof invoice?.total === 'number'
      ? invoice.total
      : parseFloat((subtotal + totalTax).toFixed(2));
    
    const formatDate = (date) => (date ? format(new Date(date), 'dd MMM yyyy') : 'N/A');
    const issueDate = formatDate(invoice?.createdAt || invoice?.issueDate);
    const dueDate = formatDate(invoice?.dueDate);
    const customerAddress = invoice?.customerAddress
      ? invoice.customerAddress.split('\n').map(line => `<p style="margin: 2px 0; color: #7f8c8d; font-size: 13px;">${line}</p>`).join('')
      : '';
    const travelDetails = invoice?.travelDetails ? `
      <div style="margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 14px;">Travel Details</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #34495e;">
          <div><strong>From:</strong> ${invoice.travelDetails.from || 'N/A'}</div>
          <div><strong>To:</strong> ${invoice.travelDetails.to || 'N/A'}</div>
          <div><strong>Travel Date:</strong> ${formatDate(invoice.travelDetails.travelDate)}</div>
          ${invoice.travelDetails.passengers ? `<div><strong>Passengers:</strong> ${invoice.travelDetails.passengers}</div>` : ''}
        </div>
      </div>
    ` : '';
    const itemsRows = (invoice?.items && invoice.items.length > 0)
      ? invoice.items.map(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const rateValue = item.rate ?? item.unitPrice ?? 0;
          const rate = parseFloat(rateValue) || 0;
          const amount = rate * quantity;
          return `
            <tr>
              <td style="padding: 10px; border: 1px solid #e1e4e8;">
                <div style="font-weight: 600;">${item.description || 'Item'}</div>
                ${item.details ? `<div style="font-size: 11px; color: #6c757d; margin-top: 4px;">${item.details}</div>` : ''}
              </td>
              <td style="padding: 10px; border: 1px solid #e1e4e8; text-align: right;">${quantity}</td>
              <td style="padding: 10px; border: 1px solid #e1e4e8; text-align: right;">${formatCurrency(rate).replace('₹ ', '')}</td>
              <td style="padding: 10px; border: 1px solid #e1e4e8; text-align: right; font-weight: 600;">${formatCurrency(amount).replace('₹ ', '')}</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="4" style="padding: 12px; border: 1px solid #e1e4e8; text-align: center; color: #6c757d;">
            No items added
          </td>
        </tr>
      `;

    const notesTermsBlock = (invoice?.notes || invoice?.terms) ? `
      <div style="display: flex; gap: 18px; margin-top: 24px;">
        ${invoice?.notes ? `
          <div style="flex: 1;">
            <h4 style="margin: 0 0 6px; font-size: 13px; color: #1f2937;">Notes</h4>
            <p style="margin: 0; color: #6b7280; white-space: pre-line;">${invoice.notes}</p>
          </div>
        ` : ''}
        ${invoice?.terms ? `
          <div style="flex: 1;">
            <h4 style="margin: 0 0 6px; font-size: 13px; color: #1f2937;">Terms & Conditions</h4>
            <p style="margin: 0; color: #6b7280; white-space: pre-line;">${invoice.terms}</p>
          </div>
        ` : ''}
      </div>
    ` : '';

    return `
      <div style="width: 210mm; max-width: 210mm; min-height: 287mm; padding: 12mm 15mm; margin: 0 auto; background: #ffffff; font-size: 12px; line-height: 1.55; font-family: 'Inter', Arial, sans-serif; color: #1f2933; box-sizing: border-box;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 18px;">
          <h1 style="font-size: 26px; margin: 0; color: #1f2933; letter-spacing: 1.2px;">TAX INVOICE</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #6b7280;">${invoice?.companyName || 'Navi Travels'}</p>
        </div>

        <!-- Invoice Meta -->
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 18px;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Invoice #</p>
            <p style="margin: 2px 0 0; font-weight: 600;">${invoice?.invoiceId || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            ${invoice?.companyGstin ? `
              <p style="margin: 0; font-size: 12px; color: #6b7280;">GSTIN</p>
              <p style="margin: 2px 0 0; font-weight: 600;">${invoice.companyGstin}</p>
            ` : ''}
          </div>
          <div>
            <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">Date</p>
            <p style="margin: 2px 0 0; font-weight: 600;">${issueDate}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">Due Date</p>
            <p style="margin: 2px 0 0; font-weight: 600;">${dueDate}</p>
          </div>
        </div>

        <!-- Parties -->
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 20px;">
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
            <h3 style="margin: 0 0 8px; font-size: 13px; color: #1f2937;">From</h3>
            <p style="margin: 0 0 4px; font-weight: 600;">${invoice?.companyName || 'Navi Travels'}</p>
            ${(invoice?.companyAddress || '123 Travel Street<br/>New Delhi, 110001').replace(/\n/g, '<br/>')}
          </div>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
            <h3 style="margin: 0 0 8px; font-size: 13px; color: #1f2937;">Bill To</h3>
            <p style="margin: 0 0 4px; font-weight: 600;">${invoice?.customerName || 'N/A'}</p>
            ${customerAddress || '<p style="margin: 0; color: #6b7280;">No address provided</p>'}
            ${invoice?.customerEmail ? `<p style="margin: 6px 0 0; color: #6b7280;">${invoice.customerEmail}</p>` : ''}
            ${invoice?.customerPhone ? `<p style="margin: 2px 0 0; color: #6b7280;">${invoice.customerPhone}</p>` : ''}
          </div>
        </div>

        ${travelDetails}

        <!-- Items -->
        <div style="margin-top: 18px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc; color: #1f2937;">
                <th style="padding: 9px 10px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
                <th style="padding: 9px 10px; text-align: right; border: 1px solid #e5e7eb; width: 80px;">Qty</th>
                <th style="padding: 9px 10px; text-align: right; border: 1px solid #e5e7eb; width: 110px;">Rate (₹)</th>
                <th style="padding: 9px 10px; text-align: right; border: 1px solid #e5e7eb; width: 120px;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
          <div style="width: 260px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
              <span>Subtotal</span>
              <span>${formatCurrency(subtotal).replace('₹ ', '₹')}</span>
            </div>
            ${taxAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                <span style="color: #6b7280;">Tax (${invoice?.taxRate || 0}%)</span>
                <span>${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(taxAmount)}</span>
              </div>
            ` : ''}
            ${tcsAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                <span style="color: #6b7280;">TCS (${invoice?.tcsRate || 0}%)</span>
                <span>${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(tcsAmount)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9; font-weight: 700; font-size: 14px;">
              <span>Total Amount</span>
              <span>${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(total)}</span>
            </div>
            ${invoice?.amountInWords ? `
              <div style="margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 4px; font-size: 11px; color: #6b7280; font-style: italic;">
                ${invoice.amountInWords}
              </div>
            ` : ''}
          </div>
        </div>

        ${notesTermsBlock}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 22px; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #94a3b8; font-size: 11px;">
          <p style="margin: 0 0 4px;">Thank you for your business!</p>
          <p style="margin: 0;">This is a computer-generated invoice. No signature is required.</p>
        </div>
      </div>
    `;
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
    try {
      setIsGenerating(true);
      
      // Generate the invoice HTML
      const invoiceContent = generateInvoiceHTML();
      
      // Create a temporary div to render the invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '0';
      tempDiv.style.margin = '0';
      tempDiv.style.background = 'white';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.innerHTML = invoiceContent;
      document.body.appendChild(tempDiv);
      
      // Generate PDF with higher quality
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        scrollY: -window.scrollY
      });
      
      // Clean up
      document.body.removeChild(tempDiv);

      // Create PDF with proper dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Add image to PDF with proper scaling
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Save the PDF with the invoice number
      pdf.save(`invoice-${invoice.invoiceId || 'new'}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Invoice #{invoice?.invoiceId}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : (
          <div className="p-6">
            {/* Invoice Header */}
            <div className="flex justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold">From</h3>
                <p>Navi Travels</p>
                <p>123 Travel Street</p>
                <p>New Delhi, 110001</p>
                <p>GST: 07AACCN1234F1Z5</p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="font-medium">Invoice #: </span>
                  <span>{invoice?.invoiceId}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Date: </span>
                  <span>{invoice?.createdAt ? format(new Date(invoice.createdAt), 'PP') : 'N/A'}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Due Date: </span>
                  <span>{invoice?.dueDate ? format(new Date(invoice.dueDate), 'PP') : 'N/A'}</span>
                </div>
                <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-md inline-block">
                  {invoice?.status?.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Bill To</h3>
              <p>{invoice?.customerName}</p>
              <p>{invoice?.customerEmail}</p>
              <p>{invoice?.customerPhone}</p>
              {invoice?.customerAddress && <p>{invoice.customerAddress}</p>}
              {invoice?.customerGstin && <p>GSTIN: {invoice.customerGstin}</p>}
            </div>

            {/* Travel Details */}
            {invoice?.travelDetails && (
              <div className="mb-8 bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Travel Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-medium">From</p>
                    <p>{invoice.travelDetails.from || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">To</p>
                    <p>{invoice.travelDetails.to || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Travel Date</p>
                    <p>{invoice.travelDetails.travelDate ? format(new Date(invoice.travelDetails.travelDate), 'PP') : 'N/A'}</p>
                  </div>
                  {invoice.travelDetails.passengers && (
                    <div className="col-span-3">
                      <p className="font-medium">Passengers</p>
                      <p>{invoice.travelDetails.passengers} person(s)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice?.items?.map((item, index) => {
                      const quantity = parseFloat(item.quantity) || 0;
                      const rateValue = item.rate ?? item.unitPrice ?? 0;
                      const rate = parseFloat(rateValue) || 0;
                      const amount = rate * quantity;

                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{item.description || 'Item'}</div>
                            {item.details && <div className="text-sm text-gray-500">{item.details}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">{quantity || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              minimumFractionDigits: 2
                            }).format(rate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              minimumFractionDigits: 2
                            }).format(amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Subtotal:</span>
                  <span>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2
                    }).format(displaySubtotal)}
                  </span>
                </div>
                {invoice?.tax > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Tax ({invoice?.taxRate || 0}%):</span>
                    <span>
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2
                      }).format(invoice?.tax || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2
                    }).format(invoice?.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice?.notes && (
              <div className="mb-6">
                <h4 className="font-medium mb-1">Notes:</h4>
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice?.terms && (
              <div className="mb-6">
                <h4 className="font-medium mb-1">Terms & Conditions:</h4>
                <p className="text-gray-700">{invoice.terms}</p>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <h4 className="font-medium mb-2">Payment Information</h4>
              <p className="text-sm text-gray-700">
                Please make payment to the following account:
              </p>
              <div className="mt-2 text-sm">
                <p>Bank Name: Example Bank</p>
                <p>Account Name: Navi Travels</p>
                <p>Account Number: 1234567890</p>
                <p>IFSC Code: EXMP0123456</p>
                <p>UPI ID: navitravels@examplebank</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleMarkAsPaid}
                disabled={loading || invoice?.status === 'paid'}
                className={`flex items-center px-4 py-2 rounded-md ${invoice?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'} ${(loading || invoice?.status === 'paid') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {invoice?.status === 'paid' ? 'Paid' : 'Mark as Paid'}
                  </>
                )}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={() => {}}
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || invoice?.status === 'paid'}
                className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${(loading || invoice?.status === 'paid') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetailModal;
