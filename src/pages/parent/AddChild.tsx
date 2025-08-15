import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import MobileLayout from '@/components/mobile/MobileLayout';

const addChildSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required',
  }),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select a gender',
  }),
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  studentId: z.string().min(1, 'Student ID is required'),
});

type AddChildForm = z.infer<typeof addChildSchema>;

const AddChild = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddChildForm>({
    resolver: zodResolver(addChildSchema),
    defaultValues: {
      fullName: '',
      schoolName: '',
      studentId: '',
    },
  });

  const handleBack = () => {
    navigate('/parent/dashboard');
  };

  const onSubmit = async (data: AddChildForm) => {
    setIsLoading(true);
    try {
      // Store child data temporarily and navigate to map for location selection
      sessionStorage.setItem('childFormData', JSON.stringify(data));
      navigate('/parent/add-child/locations');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to proceed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <MobileLayout
      title="Add Your Child's Details"
      showBack={true}
      onBack={handleBack}
      theme="parent"
    >
      <div className="p-4 space-y-6 min-h-screen">
        <Card className="shadow-xl rounded-2xl border border-blue-100 bg-white">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
            <CardTitle className="font-nunito text-xl text-center text-blue-900">
              Child Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-blue-800">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter child's full name"
                          className="rounded-xl h-12 border-blue-200 focus:border-blue-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-medium text-blue-800">Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-12 rounded-xl text-left font-normal border-blue-200 hover:bg-blue-50",
                                !field.value && "text-blue-500"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-blue-800">Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-12 border-blue-200">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* School Name */}
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-blue-800">School Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter school name"
                          className="rounded-xl h-12 border-blue-200 focus:border-blue-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Student ID */}
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-blue-800">Student ID Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter student ID"
                          className="rounded-xl h-12 border-blue-200 focus:border-blue-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold text-base mt-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Add Locations'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default AddChild;