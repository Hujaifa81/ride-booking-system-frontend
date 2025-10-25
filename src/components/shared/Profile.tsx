/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Camera,
  Edit,
  Save,
  Loader2,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Star,
  Shield,
  KeyRound,
  Car,
  Plus,
  LogOut,
  MapPin,
  CreditCard,
  // Settings,
} from "lucide-react";

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
import { authApi, useLogoutMutation, useResetPasswordMutation, useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useGetTotalRidesCountQuery } from "@/redux/features/ride/ride.api";
import { useUpdateUserMutation } from "@/redux/features/user/user.api";
import type { IResponse, User } from "@/types";
import { useAppDispatch } from "@/redux/hook";

type Role = "RIDER" | "DRIVER" | "ADMIN";

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(6, "Phone must be at least 6 digits")
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
});

type EditValues = z.infer<typeof editSchema>;

const pwdSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Include letters and numbers"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type PwdValues = z.infer<typeof pwdSchema>;

const Profile = () => {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const dispatch = useAppDispatch();
  // User info
  const {
    data: userRes,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: refetchUser,
  } = useUserInfoQuery(undefined);


  const user = (userRes as IResponse<User>)?.data


  // Ride stats for user
  const {
    data: ridesRes,
    isLoading: isRidesLoading,
  } = useGetTotalRidesCountQuery(user?._id as string, { skip: !user?._id });

  const rideStats = (ridesRes as any)?.data ?? ridesRes;
  const totalRides = rideStats?.totalRides ?? 0;
  const cancelledRides = rideStats?.cancelledRides ?? 0;

  // Role flags
  const role = (user?.role as Role) || "RIDER";
  const isDriver = role === "DRIVER";
  const isRider = role === "RIDER";

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "edit" | "security" | "vehicles" | "preferences" | "rider"
  >("overview");

  // Avatar preview state (client-only)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"avatar" | null>(null);
  const [saving, setSaving] = useState<"edit" | "pwd" | "prefs" | null>(null);

  // Edit form
  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (user) {
      editForm.reset({
        name: user.name ?? "",
        phone: user.phone ?? "",
      });
      setAvatarPreview(null); // reset preview if user changes
    }
  }, [user]);

  // Password form
  const pwdForm = useForm<PwdValues>({
    resolver: zodResolver(pwdSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const joinedDate = useMemo(
    () => (user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"),
    [user?.createdAt]
  );

  const [resetPassword, { isLoading: resetPasswordLoading }] = useResetPasswordMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("avatar");
    try {
      const preview = URL.createObjectURL(file);
      // Replace with real upload API if available
      await new Promise((r) => setTimeout(r, 600));
      setAvatarPreview(preview);
      toast.success("Avatar updated (preview)");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(null);
    }
  };

  const onSaveEdit = async (values: EditValues) => {

    if (!user?._id) return;
    setSaving("edit");
    const body = { name: values.name, phone: values.phone }

    try {
      await updateUser({
        userId: user._id,
        body,
      }).unwrap();

      toast.success("Profile updated");
      await refetchUser();
      setActiveTab("overview");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save profile");
      console.log(err.data);
    } finally {
      setSaving(null);
    }
  };

  const onChangePassword = async (values: PwdValues) => {
    setSaving("pwd");
    try {
      await resetPassword({
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      toast.success("Password changed");
      pwdForm.reset();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to change password");
    } finally {
      setSaving(null);
    }
  };

  const onSavePreferences = async () => {
    setSaving("prefs");
    try {
      // Persist preferences if you have an API
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(null);
    }
  };

  // Build tabs by role
  const tabs: Array<{ key: typeof activeTab; label: string; icon: any }> = [
    { key: "overview", label: "Overview", icon: UserIcon },
    { key: "edit", label: "Edit Profile", icon: Edit },
    { key: "security", label: "Security", icon: KeyRound },
  ];
  if (isDriver) tabs.push({ key: "vehicles", label: "Vehicles", icon: Car });
  // if (isRider) tabs.push({ key: "rider", label: "Rider Settings", icon: Settings });
  // tabs.push({ key: "preferences", label: "Preferences", icon: Settings });

  if (isUserLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isUserError || !user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-600">Failed to load profile.</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16">
      {/* Header card */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <Card className="shadow-xl border-0">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full ring-8 ring-white bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
                  {avatarPreview || user.imageUrl ? (
                    <img src={avatarPreview || (user.imageUrl as string)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-600">
                      <UserIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow hover:bg-blue-700 transition">
                  {uploading === "avatar" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{user.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    {user.phone}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Joined {joinedDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <Button variant="outline" onClick={() => setActiveTab("edit")}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={async () => {
                  await logout(undefined);
                  dispatch(authApi.util.resetApiState());
                  navigate("/sign-in");
                }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Rides</p>
                      <p className="text-lg font-semibold">
                        {isRidesLoading ? <Loader2 className="w-4 h-4 inline animate-spin" /> : totalRides}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cancelled Rides</p>
                      <p className="text-lg font-semibold">
                        {isRidesLoading ? <Loader2 className="w-4 h-4 inline animate-spin" /> : cancelledRides}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Account</p>
                      <p className="text-lg font-semibold">{user.isVerified ? "Verified" : "Unverified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="mt-8 flex flex-wrap gap-2">
              {tabs.map((t) => {
                const Icon = t.icon as any;
                const active = activeTab === (t.key as any);
                return (
                  <Button
                    key={t.key}
                    variant={active ? "default" : "outline"}
                    className={active ? "" : "bg-white"}
                    onClick={() => setActiveTab(t.key as any)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {t.label}
                  </Button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="mt-6">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                      <CardDescription>Your profile details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-700">
                        <div className="inline-flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">Role</p>
                            <p>
                              {role === "RIDER" ? "Rider" : role === "DRIVER" ? "Driver" : "Admin"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Manage your account fast</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" variant="outline" onClick={() => setActiveTab("edit")}>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Profile
                      </Button>
                      <Button className="w-full" variant="outline" onClick={() => setActiveTab("security")}>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                      {isDriver && (
                        <Button className="w-full" variant="outline" onClick={() => setActiveTab("vehicles")}>
                          <Car className="w-4 h-4 mr-2" />
                          Manage Vehicles
                        </Button>
                      )}
                      {!isDriver && isRider && (
                        <Button className="w-full" onClick={() => navigate("/rider/be-a-driver")}>
                          <Plus className="w-4 h-4 mr-2" />
                          Become a Driver
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "edit" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...editForm}>
                      <form onSubmit={editForm.handleSubmit(onSaveEdit)} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Controller
                          name="name"
                          control={editForm.control}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel className={fieldState.error ? "text-destructive" : ""}>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Your full name" className={fieldState.error ? "border-red-500" : ""} />
                              </FormControl>
                              {fieldState.error && (
                                <p className="text-sm text-destructive">{fieldState.error.message}</p>
                              )}
                            </FormItem>
                          )}
                        />

                        <div className="sm:col-span-1">
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <Input value={user.email} disabled />
                            <FormDescription>This email is linked to your account</FormDescription>
                          </FormItem>
                        </div>

                        <Controller
                          name="phone"
                          control={editForm.control}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel className={fieldState.error ? "text-destructive" : ""}>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="+1 555 000 1111" className={fieldState.error ? "border-red-500" : ""} />
                              </FormControl>
                              {fieldState.error && (
                                <p className="text-sm text-destructive">{fieldState.error.message}</p>
                              )}
                            </FormItem>
                          )}
                        />

                        <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2">
                          <Button type="button" variant="outline" onClick={() => editForm.reset()}>
                            Reset
                          </Button>
                          <Button type="submit" disabled={saving === "edit" || isUpdating}>
                            {saving === "edit" || isUpdating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {activeTab === "security" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>Keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...pwdForm}>
                        <form onSubmit={pwdForm.handleSubmit(onChangePassword)} className="space-y-4">
                          <Controller
                            name="currentPassword"
                            control={pwdForm.control}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className={fieldState.error ? "text-destructive" : ""}>Current password</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="current-password" {...field} className={fieldState.error ? "border-red-500" : ""} />
                                </FormControl>
                                {fieldState.error && (
                                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                                )}
                              </FormItem>
                            )}
                          />
                          <Controller
                            name="newPassword"
                            control={pwdForm.control}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className={fieldState.error ? "text-destructive" : ""}>New password</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" {...field} className={fieldState.error ? "border-red-500" : ""} />
                                </FormControl>
                                {fieldState.error && (
                                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                                )}
                              </FormItem>
                            )}
                          />
                          <Controller
                            name="confirmPassword"
                            control={pwdForm.control}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className={fieldState.error ? "text-destructive" : ""}>Confirm new password</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" {...field} className={fieldState.error ? "border-red-500" : ""} />
                                </FormControl>
                                {fieldState.error && (
                                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                                )}
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" disabled={saving === "pwd" || resetPasswordLoading}>
                              {saving === "pwd" || resetPasswordLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Password"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  {/* <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Authenticator App</p>
                          <p className="text-sm text-gray-600">Use an authenticator app to generate login codes.</p>
                        </div>
                        <Button variant="outline">Enable</Button>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-700 flex items-center justify-center">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">SMS Codes</p>
                          <p className="text-sm text-gray-600">Receive login codes via text messages.</p>
                        </div>
                        <Button variant="outline">Configure</Button>
                      </div>
                    </CardContent>
                  </Card> */}
                </div>
              )}

              {activeTab === "vehicles" && isDriver && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Your Vehicles</CardTitle>
                      <CardDescription>Manage vehicles linked to your account</CardDescription>
                    </div>
                    <Button onClick={() => navigate("/be-driver")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Vehicle
                    </Button>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4">
                    <div className="text-center text-gray-600 py-6">
                      Vehicle data not available from user API. Use the Driver/Vehicle pages to manage.
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "rider" && isRider && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rider Settings</CardTitle>
                      <CardDescription>Customize your ride experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-accept Pool Rides</p>
                          <p className="text-sm text-gray-600">Automatically accept carpool matches</p>
                        </div>
                        <input type="checkbox" className="h-5 w-5 accent-blue-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Quiet Mode</p>
                          <p className="text-sm text-gray-600">Reduce notifications during rides</p>
                        </div>
                        <input type="checkbox" className="h-5 w-5 accent-blue-600" defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payments</CardTitle>
                      <CardDescription>Manage your payment methods</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded border p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">Visa •••• 4242</p>
                            <p className="text-xs text-gray-500">Default</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">Set Default</Button>
                          <Button variant="outline" size="sm" className="text-red-600">Remove</Button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => toast.info("Add payment flow coming soon")}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Saved Places</CardTitle>
                      <CardDescription>Save frequent pickup and drop-off locations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between rounded border p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">Home</p>
                            <p className="text-xs text-gray-500">221B Baker Street</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm" className="text-red-600">Remove</Button>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toast.info("Add place flow coming soon")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Place
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "preferences" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-600">Get updates about rides and promotions</p>
                      </div>
                      <input type="checkbox" className="h-5 w-5 accent-blue-600" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-600">Receive alerts on your device</p>
                      </div>
                      <input type="checkbox" className="h-5 w-5 accent-blue-600" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-gray-600">Reduce eye strain at night</p>
                      </div>
                      <input type="checkbox" className="h-5 w-5 accent-blue-600" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={onSavePreferences} disabled={saving === "prefs"}>
                        {saving === "prefs" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;