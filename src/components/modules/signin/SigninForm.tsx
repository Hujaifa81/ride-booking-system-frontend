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
import { Label } from "@/components/ui/label";
import {  Mail, Lock, LogIn} from "lucide-react";


export default function SignInPage({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#0f0c29] px-4">
      {/* Subtle background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-600" />
      </div>

      {/* Sign-in Card */}
      <div className={cn("flex flex-col gap-3 w-full max-w-md p-4", className)} {...props}>
        <Card className="relative backdrop-blur-2xl bg-white/10 border border-white/10 shadow-2xl rounded-2xl transition-all duration-300">
          {/* Glowing gradient border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-30 blur-xl pointer-events-none" />

          <CardHeader className="text-center space-y-1 relative z-10">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
              Welcome back 👋
            </CardTitle>
            <CardDescription className="text-sm text-gray-300">
              Sign in to continue to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            <form>
              <div className="grid gap-6">
                {/* Social logins */}
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 rounded-lg bg-black text-white hover:scale-[1.02] hover:bg-black/90 transition"
                  >
                    <Mail className="h-5 w-5" />
                    Continue with Google
                  </Button>
                  
                </div>

                {/* Divider */}
                <div className="relative text-center text-sm">
                  <span className=" px-2 relative z-10 text-gray-400">
                    Or continue with
                  </span>
                  <div className="absolute inset-0 top-1/2 border-t border-gray-400/20" />
                </div>

                {/* Form fields */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white">
                        Password
                      </Label>
                      <a
                        href="#"
                        className="text-xs text-purple-300 hover:underline underline-offset-4"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        required
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full flex items-center gap-2 bg-gradient-to-r from-purple-500  to-indigo-500 hover:opacity-90"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-400">
                  Don&apos;t have an account?{" "}
                  <a
                    href="#"
                    className="underline underline-offset-4 text-purple-300 hover:text-white"
                  >
                    Sign up
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-gray-400 text-center text-xs px-6 mt-3">
          By continuing, you agree to our{" "}
          <a href="#" className="underline hover:text-purple-300">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-purple-300">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
