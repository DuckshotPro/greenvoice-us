import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Create utility functions to handle auto-selection of text on focus
const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select();
};

// Handler for text area focus
const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
  e.target.select();
};

// Specialized handlers for number inputs that only select when the value is zero
const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  if (parseFloat(e.target.value) === 0) {
    e.target.select();
  }
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { type Invoice, CURRENCY_OPTIONS, formatCurrency } from '@/types/invoice';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Form schema
const formSchema = z.object({
  // Your details
  senderName: z.string().min(1, 'Business name is required'),
  senderEmail: z.string().email('Must be a valid email'),
  senderAddress: z.string().min(1, 'Address is required'),
  senderPhone: z.string().min(1, 'Phone number is required'),

  // Client details
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Must be a valid email'),
  clientAddress: z.string().min(1, 'Client address is required'),

  // Invoice details
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string().min(1, 'Currency is required'),

  // Additional info
  notes: z.string().optional(),

  // Discount fields
  discountType: z.enum(['none', 'percentage', 'fixed', 'coupon']).default('none'),
  discountValue: z.number().min(0).default(0),
  discountTotal: z.number().min(0).default(0),
  couponCode: z.string().optional(),

  // These are calculated fields
  subtotal: z.number().min(0),
  taxRate: z.number().min(0),
  taxAmount: z.number().min(0),
  total: z.number().min(0),
});

type FormSchema = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  defaultValues?: Partial<FormSchema>;
  onFormChange: (data: FormSchema & { items: LineItem[] }) => void;
}

const InvoiceForm = ({ defaultValues, onFormChange }: InvoiceFormProps) => {
  // Initial line items with helpful example item for new users
  const [items, setItems] = useState<LineItem[]>([
    { description: 'Professional services', quantity: 1, rate: 100, amount: 100 }
  ]);

  // Generate a new invoice number with current date prefix
  const generateInvoiceNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `INV-${year}${month}-001`;
  };

  // Setup form with schema validation
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: 'Your Business Name',
      senderEmail: 'your@email.com',
      senderAddress: '123 Business Street\nSan Francisco, CA 94103\nUnited States',
      senderPhone: '(555) 123-4567',
      clientName: 'Acme Corporation',
      clientEmail: 'billing@acmecorp.com',
      clientAddress: '456 Client Avenue\nNew York, NY 10001\nUnited States',
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'USD',
      notes: 'Thank you for your business. Payment is due within 30 days.',
      
      // Default values for discount
      discountType: 'none',
      discountValue: 0,
      discountTotal: 0,
      
      // Financial calculations
      subtotal: 0,
      taxRate: 8,
      taxAmount: 0,
      total: 0,
      ...defaultValues,
    },
  });

  // Calculate totals with discount
  const calculateTotals = (
    items: LineItem[], 
    taxRate: number, 
    discountType = form.getValues('discountType'), 
    discountValue = form.getValues('discountValue')
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate discount
    let discountTotal = 0;
    if (discountType === 'percentage' && discountValue > 0) {
      // Limit percentage discount to 100%
      const adjustedDiscountValue = Math.min(discountValue, 100);
      discountTotal = (subtotal * adjustedDiscountValue) / 100;
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountTotal = Math.min(discountValue, subtotal); // Can't discount more than subtotal
    }
    
    // Apply discount before tax (ensure we don't have negative values)
    const discountedSubtotal = Math.max(0, subtotal - discountTotal);
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + taxAmount;

    return { subtotal, discountTotal, taxAmount, total };
  };

  // Update item fields and handle bidirectional calculations
  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    // Ensure value is a valid number
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

    const newItems = [...items];

    // Make a copy of the current item to work with
    const updatedItem = { ...newItems[index] };

    // Update the specified field with the new value
    if (field === 'description') {
      updatedItem.description = value as string;
    } else if (field === 'quantity' || field === 'rate' || field === 'amount') {
      updatedItem[field] = numericValue;
    }

    // Handle different update scenarios
    if (field === 'quantity' || field === 'rate') {
      // If quantity or rate changed, recalculate amount
      // Ensure we're using the updated values, not the old ones
      const quantity = updatedItem.quantity;
      const rate = updatedItem.rate;

      // Calculate and round to 2 decimal places
      updatedItem.amount = Math.round((quantity * rate) * 100) / 100;
    } else if (field === 'amount') {
      // If amount changed, update quantity based on rate (if rate is non-zero)
      const rate = updatedItem.rate;

      if (rate > 0) {
        // Calculate new quantity based on amount ÷ rate
        const newQuantity = numericValue / rate;
        // Round to 2 decimal places for better usability
        updatedItem.quantity = Math.round(newQuantity * 100) / 100;
      } else {
        // If rate is zero, set rate to 1 and quantity to amount
        if (numericValue > 0) {
          updatedItem.rate = 1;
          updatedItem.quantity = numericValue;
        } else {
          // If amount is also zero, just set quantity to 0
          updatedItem.quantity = 0;
        }
      }
    }

    // Update the item in the array
    newItems[index] = updatedItem;
    setItems(newItems);

    // Recalculate totals
    const { subtotal, discountTotal, taxAmount, total } = calculateTotals(newItems, form.getValues('taxRate'));

    // Update form values
    form.setValue('subtotal', subtotal);
    form.setValue('discountTotal', discountTotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('total', total);

    // Notify parent of form changes
    const currentValues = form.getValues();
    onFormChange({ ...currentValues, items: newItems });
  };

  // Add new item with sensible defaults for better UX
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 50, amount: 50 }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length === 1) return; // Keep at least one item

    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);

    // Recalculate totals
    const { subtotal, discountTotal, taxAmount, total } = calculateTotals(newItems, form.getValues('taxRate'));

    // Update form values
    form.setValue('subtotal', subtotal);
    form.setValue('discountTotal', discountTotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('total', total);

    // Notify parent of form changes
    const currentValues = form.getValues();
    onFormChange({ ...currentValues, items: newItems });
  };

  // When tax rate changes
  const handleTaxRateChange = (value: string) => {
    const taxRate = parseFloat(value) || 0;
    form.setValue('taxRate', taxRate);

    // Recalculate totals
    const { subtotal, discountTotal, taxAmount, total } = calculateTotals(items, taxRate);

    // Update form values
    form.setValue('discountTotal', discountTotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('total', total);

    // Notify parent of form changes
    const currentValues = form.getValues();
    onFormChange({ ...currentValues, items });
  };
  
  // Handle discount changes
  const handleDiscountChange = (type: 'none' | 'percentage' | 'fixed' | 'coupon', value?: number) => {
    // Update discount type
    form.setValue('discountType', type);
    
    // Update discount value if provided
    if (value !== undefined) {
      form.setValue('discountValue', value);
    }
    
    // Recalculate totals with new discount
    const { subtotal, discountTotal, taxAmount, total } = calculateTotals(
      items, 
      form.getValues('taxRate'), 
      type, 
      value !== undefined ? value : form.getValues('discountValue')
    );
    
    // Update form values
    form.setValue('discountTotal', discountTotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('total', total);
    
    // Notify parent of form changes
    const currentValues = form.getValues();
    onFormChange({ ...currentValues, items });
  };

  // Listen for form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Only notify if we have valid data
      if (form.formState.isValid) {
        onFormChange({ ...value as FormSchema, items });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, items, onFormChange]);

  // Set initial values on mount and calculate totals from pre-populated items
  useEffect(() => {
    // Calculate initial totals from our pre-filled items
    const { subtotal, discountTotal, taxAmount, total } = calculateTotals(items, form.getValues('taxRate'));

    // Update form values
    form.setValue('subtotal', subtotal);
    form.setValue('discountTotal', discountTotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('total', total);

    // Notify parent of form changes
    const currentValues = form.getValues();
    onFormChange({ ...currentValues, items });
  }, []);

  return (
    <Form {...form}>
      <div className="lg:col-span-1">
        <div className="px-4 sm:px-0">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Create Invoice</h3>
          <p className="mt-1 text-sm text-gray-600">
            Welcome! Enter your details below to generate a professional invoice. We've pre-filled the date fields and invoice number for you.
          </p>
          <div className="mt-2 flex items-center">
            <div className="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 text-primary-600 text-xs font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Pro Tip: All numeric fields will auto-select when clicked for faster editing</span>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            {/* Your Details */}
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h4 className="text-base font-medium text-gray-900">Your Details</h4>
                <div className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business/Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} onFocus={handleInputFocus} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} onFocus={handleInputFocus} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senderAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} onFocus={handleTextareaFocus} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senderPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} onFocus={handleInputFocus} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h4 className="text-base font-medium text-gray-900">Client Details</h4>
                <div className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} onFocus={handleInputFocus} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} onFocus={handleInputFocus} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Address</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h4 className="text-base font-medium text-gray-900">Invoice Details</h4>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-1">
                            <FormLabel>Invoice #</FormLabel>
                            <div className="group relative inline-block">
                              <span className="cursor-help text-primary-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                                Format: INV-YYYYMM-###. Pre-filled with current year/month.
                              </div>
                            </div>
                          </div>
                          <FormControl>
                            <Input 
                              {...field} 
                              onFocus={handleInputFocus}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              onFocus={(e) => e.target.select()}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              onFocus={(e) => e.target.select()}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CURRENCY_OPTIONS.map(currency => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-medium text-gray-900">Line Items</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="text-primary bg-primary/10 hover:bg-primary/20 border-transparent"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Item
                  </Button>
                </div>

                {/* Line items */}
                {items.map((item, index) => (
                  <div key={index} className="mt-4 border border-gray-200 rounded-md p-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium text-gray-700">Description</label>
                        <Input
                          className="mt-1 w-full cursor-text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          readOnly={false}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Quantity</label>
                        <Input
                          type="number"
                          className="mt-1"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          onFocus={(e) => {
                            if (parseFloat(e.target.value) === 0) {
                              e.target.select();
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Rate</label>
                        <Input
                          type="number"
                          className="mt-1"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          onFocus={(e) => {
                            if (parseFloat(e.target.value) === 0) {
                              e.target.select();
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Amount</label>
                        <div className="mt-1 relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                            onFocus={(e) => {
                              if (parseFloat(e.target.value) === 0) {
                                e.target.select();
                              }
                            }}
                            className="pr-8"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">{form.getValues('currency')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-1 flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-gray-400 hover:text-gray-500"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="mt-4 space-y-2 px-3 py-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(form.getValues('subtotal'), form.getValues('currency'))}
                    </span>
                  </div>
                  
                  {/* Discount Section */}
                  <div className="flex flex-col space-y-2 border-t border-gray-200 pt-2 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Discount</span>
                      <div className="flex space-x-2">
                        <Button 
                          type="button" 
                          variant={form.getValues('discountType') === 'none' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDiscountChange('none')}
                          className="h-7 text-xs"
                        >
                          None
                        </Button>
                        <Button 
                          type="button" 
                          variant={form.getValues('discountType') === 'percentage' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDiscountChange('percentage')}
                          className="h-7 text-xs"
                        >
                          %
                        </Button>
                        <Button 
                          type="button" 
                          variant={form.getValues('discountType') === 'fixed' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDiscountChange('fixed')}
                          className="h-7 text-xs"
                        >
                          Fixed
                        </Button>
                      </div>
                    </div>
                    
                    {form.getValues('discountType') !== 'none' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            className="w-20 h-7 text-xs"
                            min="0"
                            max={form.getValues('discountType') === 'percentage' ? "100" : undefined}
                            step={form.getValues('discountType') === 'percentage' ? "1" : "0.01"}
                            value={form.getValues('discountValue')}
                            onChange={(e) => {
                              // Ensure valid values
                              let value = parseFloat(e.target.value) || 0;
                              
                              // Enforce limits
                              if (form.getValues('discountType') === 'percentage') {
                                value = Math.min(value, 100);
                              } else if (form.getValues('discountType') === 'fixed') {
                                value = Math.min(value, form.getValues('subtotal'));
                              }
                              
                              handleDiscountChange(
                                form.getValues('discountType') as 'percentage' | 'fixed', 
                                value
                              );
                            }}
                            onFocus={(e) => {
                              if (parseFloat(e.target.value) === 0) {
                                e.target.select();
                              }
                            }}
                          />
                          {form.getValues('discountType') === 'percentage' && (
                            <span className="text-sm text-gray-600 ml-1">%</span>
                          )}
                          {form.getValues('discountType') === 'fixed' && (
                            <span className="text-sm text-gray-600 ml-1">{form.getValues('currency')}</span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          -{formatCurrency(form.getValues('discountTotal'), form.getValues('currency'))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Tax</span>
                      <Input
                        type="number"
                        className="ml-2 w-16 h-7 text-xs"
                        min="0"
                        step="0.1"
                        value={form.getValues('taxRate')}
                        onChange={(e) => handleTaxRateChange(e.target.value)}
                        onFocus={(e) => {
                          if (parseFloat(e.target.value) === 0) {
                            e.target.select();
                          }
                        }}
                      />
                      <span className="text-sm text-gray-600 ml-1">%</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(form.getValues('taxAmount'), form.getValues('currency'))}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(form.getValues('total'), form.getValues('currency'))}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes/Terms</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Form>
  );
};

export default InvoiceForm;