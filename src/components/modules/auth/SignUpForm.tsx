import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Lock, UserPlus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { useRegisterMutation } from "@/redux/features/auth/auth.api";
import { toast } from "sonner";


// Zod schema for validation
const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export default function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [register] = useRegisterMutation()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const userInfo = {
      name: values.name,
      email: values.email,
      password: values.password,
    };

    try {
      toast.loading("Registering...", { id: "register-progress" });
      const response = await register(userInfo).unwrap();
      console.log("Registration successful:", response);
      toast.success("Registration successful!", { id: "register-progress" });
    } catch (error: unknown) {
      let message = "Registration Failed.";
      if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error).data === "object" &&
        (error).data !== null &&
        "message" in (error).data
      ) {
        message = (error as { data: { message: string } }).data.message;
      }
      toast.error(message, { id: "register-progress" });
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#0f0c29] px-4">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-600" />
      </div>

      {/* Sign-up Card */}
      <div
        className={cn(
          "flex flex-col gap-3 w-full max-w-md p-4",
          className
        )}
        {...props}
      >
        <Card className="relative backdrop-blur-2xl bg-white/10 border border-white/10 shadow-2xl rounded-2xl transition-all duration-300">
          {/* Glowing gradient border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-30 blur-xl pointer-events-none" />

          <CardHeader className="text-center space-y-1 relative z-10">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-sm text-gray-300">
              Sign up to get started with your journey
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            {/* Social signups */}
            <div className="flex flex-col gap-3 mb-6">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 bg-white text-black hover:bg-gray-100 rounded-lg"
              >
                <Mail /> Sign up with Google
              </Button>

            </div>

            {/* Divider */}
            <div className="relative text-center my-6">
              <span className="bg-[#0f0c29] px-3 text-sm text-gray-400 relative z-10">
                Or continue with email
              </span>
              <div className="absolute inset-0 top-1/2 border-t border-gray-400/20" />
            </div>

            {/* Sign-up form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4"
              >
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="John Doe"
                            {...field}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-sm" />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="m@example.com"
                            {...field}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-sm" />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-sm" />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-sm" />
                    </FormItem>
                  )}
                />

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold py-2 rounded-lg shadow-lg hover:opacity-90 transition"
                >
                  Sign Up
                </Button>

                {/* Sign in link */}
                <p className="text-center text-sm text-gray-300 mt-2">
                  Already have an account?{" "}
                  <Link
                    to="/sign-in"
                    className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
