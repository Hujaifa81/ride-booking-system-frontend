/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Car,
  FileText,
  CheckCircle,
  Loader2,
  Shield,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router";
import * as z from "zod";
import { useCreateVehicleMutation } from "@/redux/features/vehicle/vehicle.api";
import { useCreateDriverMutation, useGetDriverProfileQuery } from "@/redux/features/driver/driver.api";
import type { Driver } from "@/types";


type APIDriverProfile = Driver & {
  approved?: boolean | null;
  approve?: boolean | null;
  createdAt?: string | null;
  vehicles?: Array<{ model?: string | null; licensePlate?: string | null }>;
};

// Schemas per step
const step1Schema = z.object({
  licenseNumber: z
    .string()
    .min(5, "License number must be at least 5 characters")
    .max(20, "License number must not exceed 20 characters")
    .regex(/^[A-Z0-9-]+$/, "License number must contain only uppercase letters, numbers, and hyphens"),
});

const step2Schema = z.object({
  vehicleModel: z
    .string()
    .min(2, "Vehicle model must be at least 2 characters")
    .max(50, "Vehicle model must not exceed 50 characters"),
  licensePlate: z
    .string()
    .min(3, "License plate must be at least 3 characters")
    .max(15, "License plate must not exceed 15 characters")
    .regex(/^[A-Z0-9-]+$/, "License plate must contain only uppercase letters, numbers, and hyphens"),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type FormValues = Step1Values & Step2Values;

const Step1Form = ({
  defaultValue,
  onNext,
}: {
  defaultValue: string;
  onNext: (licenseNumber: string) => void;
}) => {
  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { licenseNumber: defaultValue ?? "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  useEffect(() => {
    form.reset({ licenseNumber: defaultValue ?? "" });
  }, [defaultValue]);

  const submit = (values: Step1Values) => {
    onNext(values.licenseNumber);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
        <Controller
          name="licenseNumber"
          control={form.control}
          render={({ field, fieldState }) => {
            const hasError = !!fieldState.error;
            return (
              <FormItem>
                <FormLabel className={`text-base font-semibold flex items-center gap-2 ${hasError ? "text-destructive" : ""}`}>
                  <FileText className={`w-5 h-5 ${hasError ? "text-destructive" : "text-blue-600"}`} />
                  Driver's License Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., DL-123456789"
                    {...field}
                    aria-invalid={hasError}
                    className={`h-14 text-lg ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    autoFocus
                  />
                </FormControl>
                <FormDescription>
                  Enter your valid driver's license number (uppercase letters and numbers only)
                </FormDescription>
                {hasError && <p className="text-sm font-medium text-destructive">{fieldState.error?.message}</p>}
              </FormItem>
            );
          }}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

const Step2Form = ({
  defaults,
  onBack,
  onSubmitStep,
  onDraftChange,
  isSubmitting,
}: {
  defaults: Step2Values;
  onBack: () => void;
  onSubmitStep: (data: Step2Values) => Promise<void>;
  onDraftChange: (data: Partial<Step2Values>) => void;
  isSubmitting: boolean;
}) => {
  const form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { ...defaults },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults]);

  const submit = async (values: Step2Values) => {
    await onSubmitStep(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
        <Controller
          name="vehicleModel"
          control={form.control}
          render={({ field, fieldState }) => {
            const hasError = !!fieldState.error;
            return (
              <FormItem>
                <FormLabel className={`text-base font-semibold flex items-center gap-2 ${hasError ? "text-destructive" : ""}`}>
                  <Car className={`w-5 h-5 ${hasError ? "text-destructive" : "text-blue-600"}`} />
                  Vehicle Model
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Toyota Corolla, Honda Civic"
                    {...field}
                    aria-invalid={hasError}
                    className={`h-14 text-lg ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v);
                      onDraftChange({ vehicleModel: v });
                    }}
                    autoFocus
                  />
                </FormControl>
                <FormDescription>Enter your vehicle make and model</FormDescription>
                {hasError && <p className="text-sm font-medium text-destructive">{fieldState.error?.message}</p>}
              </FormItem>
            );
          }}
        />

        <Controller
          name="licensePlate"
          control={form.control}
          render={({ field, fieldState }) => {
            const hasError = !!fieldState.error;
            return (
              <FormItem>
                <FormLabel className={`text-base font-semibold flex items-center gap-2 ${hasError ? "text-destructive" : ""}`}>
                  <Car className={`w-5 h-5 ${hasError ? "text-destructive" : "text-blue-600"}`} />
                  License Plate Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., ABC-1234"
                    {...field}
                    aria-invalid={hasError}
                    className={`h-14 text-lg ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase();
                      field.onChange(v);
                      onDraftChange({ licensePlate: v });
                    }}
                  />
                </FormControl>
                <FormDescription>Enter your vehicle's license plate number</FormDescription>
                {hasError && <p className="text-sm font-medium text-destructive">{fieldState.error?.message}</p>}
              </FormItem>
            );
          }}
        />

        <div className="flex justify-between items-center pt-6">
          <Button type="button" variant="outline" onClick={onBack} className="h-12 px-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const SuccessView = ({
  data,
  onGoDashboard,
}: {
  data: FormValues;
  onGoDashboard: () => void;
}) => {
  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-2xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 h-28" />
        <CardContent className="p-8 -mt-16">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center ring-8 ring-white">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <h2 className="text-2xl font-bold text-gray-900">Application Submitted!</h2>
            <p className="text-gray-600 mt-2">
              You’re all set. We’ll review your details and contact you within 2–5 business days.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">License Number</p>
              <p className="font-semibold text-gray-900 break-all">{data.licenseNumber}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Vehicle Model</p>
              <p className="font-semibold text-gray-900">{data.vehicleModel}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">License Plate</p>
              <p className="font-semibold text-gray-900">{data.licensePlate}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onGoDashboard}
              className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Tip: Keep your phone nearby. We may reach out if we need anything else.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PendingView = ({
  profile,
  onGoDashboard,
}: {
  profile: APIDriverProfile;
  onGoDashboard: () => void;
}) => {
  const licenseNumber = profile?.licenseNumber ?? "-";
  const vehicleModel = profile?.vehicles?.[0]?.model ?? "-";
  const licensePlate = profile?.vehicles?.[0]?.licensePlate ?? "-";
  const appliedAt = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-";

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-2xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-28" />
        <CardContent className="p-8 -mt-16">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center ring-8 ring-white">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <h2 className="text-2xl font-bold text-gray-900">Application Under Review</h2>
            <p className="text-gray-600 mt-2">
              Thanks for applying! We’re reviewing your details. Expect an update within 2–5 business days.
            </p>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              {["Received", "Under Review", "Approval", "Ready to Drive"].map((label, idx) => {
                const current = 1;
                const isDone = idx <= current;
                return (
                  <div key={label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDone ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isDone ? <CheckCircle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs mt-2 ${isDone ? "text-amber-600" : "text-gray-500"}`}>{label}</span>
                    </div>
                    {idx < 3 && (
                      <div className={`h-1 flex-1 mx-3 rounded ${idx < current ? "bg-amber-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">License Number</p>
              <p className="font-semibold text-gray-900 break-all">{licenseNumber}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Vehicle Model</p>
              <p className="font-semibold text-gray-900">{vehicleModel}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">License Plate</p>
              <p className="font-semibold text-gray-900">{licensePlate}</p>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-gray-50 border p-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Submitted on</span>
              <span className="font-medium text-gray-800">{appliedAt}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onGoDashboard}
              className="h-12 px-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              Go to Dashboard
            </Button>
            <Button variant="outline" className="h-12 px-8">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BeDriver = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [createVehicle] = useCreateVehicleMutation();
  const [createDriver] = useCreateDriverMutation();

  // Get driver profile; support both {data: X} and X shapes
  const {
    data: driverRes,
    isLoading,
    isFetching,
    refetch,
  } = useGetDriverProfileQuery(undefined);

  const driverProfile: APIDriverProfile | undefined =
    (driverRes)?.data ?? (driverRes);

  const isPending =
    !!driverProfile && (driverProfile.approved === false || driverProfile.approve === false);

  // Persist values between steps
  const [data, setData] = useState<FormValues>({
    licenseNumber: "",
    vehicleModel: "",
    licensePlate: "",
  });

  // Show success screen data
  const [successData, setSuccessData] = useState<FormValues | null>(null);

  const steps = [
    { number: 1, title: "License Information", icon: FileText },
    { number: 2, title: "Vehicle Details", icon: Car },
  ];

  const handleNext = (licenseNumber: string) => {
    setData((d) => ({ ...d, licenseNumber }));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDraftChange = (draft: Partial<Step2Values>) => {
    setData((d) => ({ ...d, ...draft }));
  };

  const submitApplication = async (step2: Step2Values) => {
    setIsSubmitting(true);
    try {
      const payload: FormValues = { ...data, ...step2 };

      await createVehicle({
        model: payload.vehicleModel,
        licensePlate: payload.licensePlate,
      }).unwrap();

      await createDriver({ licenseNumber: payload.licenseNumber }).unwrap();

      toast.success("Application submitted successfully!");
      setSuccessData(payload); // show success UI with summary
      // Optionally refresh profile so PendingView appears on revisit
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentIcon = steps[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-blue-600 text-white px-4 py-2">
            <Car className="w-4 h-4 mr-2" />
            Driver Application
          </Badge>
          {!isPending && !successData && (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Become a Driver</h1>
              <p className="text-lg text-gray-600">Fill out the form below to start earning on your schedule</p>
            </>
          )}
        </div>

        {/* Loading state */}
        {(isLoading || isFetching) && (
          <Card className="shadow-2xl border-0">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-600">Checking your application status...</p>
            </CardContent>
          </Card>
        )}

        

        {/* Pending review */}
        {!isLoading && !isFetching && isPending && driverProfile && (
          <PendingView
            profile={driverProfile}
            onGoDashboard={() => navigate("/rider/dashboard")}
          />
        )}

        {/* Success or form flow */}
        {!isLoading && !isFetching && (!driverProfile || !isPending) && (
          successData ? (
            <SuccessView
              data={successData}
              onGoDashboard={() => navigate("/rider/dashboard")}
            />
          ) : (
            <>
              {/* Steps */}
              <Card className="mb-8 shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {steps.map((s, i) => {
                      const Icon = s.icon;
                      const isActive = currentStep === s.number;
                      const isCompleted = currentStep > s.number;
                      return (
                        <div key={s.number} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-lg scale-110"
                                  : isCompleted
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <span
                              className={`text-sm mt-2 text-center font-medium ${
                                isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {s.title}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div className={`h-1 flex-1 mx-4 rounded transition-all ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-sm text-gray-600 mt-4">
                    Step {currentStep} of {steps.length}
                  </div>
                </CardContent>
              </Card>

              {/* Main Form Card */}
              <Card className="shadow-2xl border-0 ">
                <CardHeader className="py-4 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-2 text-2xl ">
                    <CurrentIcon className="w-6 h-6" />
                    {steps[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    {currentStep === 1
                      ? "Please provide your driver's license information"
                      : "Please provide your vehicle information"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                  {currentStep === 1 ? (
                    <Step1Form defaultValue={data.licenseNumber} onNext={handleNext} />
                  ) : (
                    <Step2Form
                      defaults={{ vehicleModel: data.vehicleModel, licensePlate: data.licensePlate }}
                      onBack={handleBack}
                      onSubmitStep={async (vals) => {
                        setData((d) => ({ ...d, ...vals }));
                        await submitApplication(vals);
                      }}
                      onDraftChange={handleDraftChange}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Next Steps Card */}
              <Card className="mt-8 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-2 text-base">What Happens Next?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>We'll review your application within 2-5 business days</li>
                        <li>You'll receive an email with next steps and required documents</li>
                        <li>Vehicle inspection will be scheduled after approval</li>
                        <li>Background check will be conducted</li>
                        <li>Once verified, you can start driving and earning!</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="mt-6 border-gray-200">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-gray-800 mb-2 text-lg">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Our support team is here to assist you with your application
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" size="lg">
                      <Phone className="w-4 h-4 mr-2" />
                      Call: +880-1XXXXXXX
                    </Button>
                    <Button variant="outline" size="lg">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Footer */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Secure & Encrypted</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified Platform</span>
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default BeDriver;