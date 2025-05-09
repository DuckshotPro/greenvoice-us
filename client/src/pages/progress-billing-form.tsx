import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Plus, Trash2, Save, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation, useParams } from 'wouter';
import { DatePicker } from '@/components/ui/date-picker';

// Form schema for progress contracts and milestones
const formSchema = z.object({
  name: z.string().min(1, 'Contract name is required'),
  contractNumber: z.string().min(1, 'Contract number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Valid email is required'),
  clientAddress: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  description: z.string().optional(),
  totalValue: z.number().min(0, 'Total value must be a positive number'),
  currency: z.string().min(1, 'Currency is required'),
  taxRate: z.number().min(0, 'Tax rate must be a positive number').optional().nullable(),
  status: z.string().min(1, 'Status is required'),
  milestones: z.array(z.object({
    id: z.number().optional(),
    name: z.string().min(1, 'Milestone name is required'),
    description: z.string().optional().nullable(),
    amount: z.number().min(0, 'Amount must be a positive number'),
    status: z.string().default('pending'),
    orderIndex: z.number().optional(),
  })),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProgressBillingForm() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const isEditMode = !!id;

  // Form setup with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contractNumber: `C-${Date.now().toString().slice(-6)}`,
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      startDate: new Date(),
      endDate: null,
      description: '',
      totalValue: 0,
      currency: 'USD',
      taxRate: 0,
      status: 'active',
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'milestones',
  });

  // Calculate remaining amount
  const values = form.watch();
  const totalAmount = values.milestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
  const remainingAmount = values.totalValue - totalAmount;

  // Fetch contract data in edit mode
  const { isLoading: isFetchingContract } = useQuery({
    queryKey: ['/api/progress-billing', id],
    enabled: isEditMode,
    onSuccess: (data) => {
      // Convert string dates to Date objects
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      };
      
      // Update form values
      form.reset(formattedData);
    },
    onError: (error: any) => {
      toast({
        title: "Error loading contract",
        description: error.message || "Failed to load contract data",
        variant: "destructive",
      });
      navigate('/progress-billing');
    },
  });

  // Create contract mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest('POST', '/api/progress-billing', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress-billing'] });
      toast({
        title: "Contract created",
        description: "New progress contract has been created successfully",
      });
      navigate('/progress-billing');
    },
    onError: (error: any) => {
      toast({
        title: "Error creating contract",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update contract mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest('PATCH', `/api/progress-billing/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress-billing'] });
      toast({
        title: "Contract updated",
        description: "Progress contract has been updated successfully",
      });
      navigate('/progress-billing');
    },
    onError: (error: any) => {
      toast({
        title: "Error updating contract",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    // Ensure all milestone amounts add up to the total
    const milestonesTotal = data.milestones.reduce((sum, m) => sum + m.amount, 0);
    
    if (Math.abs(milestonesTotal - data.totalValue) > 0.01) {
      toast({
        title: "Milestone amounts mismatch",
        description: `The sum of milestone amounts (${milestonesTotal}) does not match the total contract value (${data.totalValue})`,
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Add an empty milestone
  const addMilestone = () => {
    append({
      name: '',
      description: '',
      amount: remainingAmount > 0 ? remainingAmount : 0,
      status: 'pending'
    });
  };

  // Automatically add a milestone when there are none
  useEffect(() => {
    if (fields.length === 0 && !isFetchingContract) {
      addMilestone();
    }
  }, [fields.length, isFetchingContract]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isFetchingContract) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/progress-billing')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? 'Edit' : 'Create'} Progress Contract</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Contract Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Contract Name</Label>
                <FormInput 
                  id="name" 
                  placeholder="Project name or description"
                  {...form.register('name')}
                  error={form.formState.errors.name?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractNumber">Contract Number</Label>
                <FormInput 
                  id="contractNumber" 
                  placeholder="Unique identifier"
                  {...form.register('contractNumber')}
                  error={form.formState.errors.contractNumber?.message}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <FormTextarea 
                  id="description" 
                  placeholder="Describe the contract scope"
                  rows={3}
                  {...form.register('description')}
                  error={form.formState.errors.description?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Controller
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      id="startDate"
                      date={field.value}
                      setDate={field.onChange}
                      error={form.formState.errors.startDate?.message}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Controller
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      id="endDate"
                      date={field.value}
                      setDate={field.onChange}
                      error={form.formState.errors.endDate?.message}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalValue">Total Contract Value</Label>
                <FormInput
                  id="totalValue"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register('totalValue', { valueAsNumber: true })}
                  error={form.formState.errors.totalValue?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <FormInput
                  id="currency"
                  placeholder="USD"
                  {...form.register('currency')}
                  error={form.formState.errors.currency?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate % (Optional)</Label>
                <FormInput
                  id="taxRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register('taxRate', { valueAsNumber: true })}
                  error={form.formState.errors.taxRate?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register('status')}
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Client Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <FormInput 
                  id="clientName" 
                  placeholder="Client name"
                  {...form.register('clientName')}
                  error={form.formState.errors.clientName?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input 
                  id="clientEmail" 
                  type="email"
                  placeholder="client@example.com"
                  {...form.register('clientEmail')}
                  error={form.formState.errors.clientEmail?.message}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientAddress">Client Address (Optional)</Label>
                <Textarea 
                  id="clientAddress" 
                  placeholder="Client address"
                  rows={2}
                  {...form.register('clientAddress')}
                  error={form.formState.errors.clientAddress?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Milestones</h2>
              <div className="flex items-center space-x-2">
                <div className={`text-sm ${remainingAmount < 0 ? 'text-red-500' : remainingAmount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {values.currency} {remainingAmount.toFixed(2)} remaining
                </div>
                <Button 
                  type="button" 
                  onClick={addMilestone} 
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Milestone
                </Button>
              </div>
            </div>
            
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No milestones added yet. Click "Add Milestone" to create one.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md bg-secondary/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Milestone {index + 1}</h3>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`milestones.${index}.name`}>Name</Label>
                        <Input 
                          id={`milestones.${index}.name`}
                          placeholder="Milestone name"
                          {...form.register(`milestones.${index}.name`)}
                          error={form.formState.errors.milestones?.[index]?.name?.message}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`milestones.${index}.amount`}>Amount</Label>
                        <Input 
                          id={`milestones.${index}.amount`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...form.register(`milestones.${index}.amount`, { valueAsNumber: true })}
                          error={form.formState.errors.milestones?.[index]?.amount?.message}
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`milestones.${index}.description`}>Description (Optional)</Label>
                        <Textarea 
                          id={`milestones.${index}.description`}
                          placeholder="Describe what this milestone covers"
                          rows={2}
                          {...form.register(`milestones.${index}.description`)}
                          error={form.formState.errors.milestones?.[index]?.description?.message}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {Math.abs(totalAmount - values.totalValue) > 0.01 && (
              <div className={`mt-4 p-3 rounded ${totalAmount > values.totalValue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                <p>
                  {totalAmount > values.totalValue 
                    ? `Milestone amounts exceed the total contract value by ${values.currency} ${(totalAmount - values.totalValue).toFixed(2)}` 
                    : `Milestone amounts are ${values.currency} ${(values.totalValue - totalAmount).toFixed(2)} less than the total contract value`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/progress-billing')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || fields.length === 0}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? 'Update Contract' : 'Create Contract'}
          </Button>
        </div>
      </form>
    </div>
  );
}