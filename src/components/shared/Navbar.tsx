import { MenuIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAppDispatch } from "@/redux/hook";
import { authApi, useLogoutMutation, useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { role } from "@/constants/role";
import Logo from "@/assets/icons/Logo";
import { ModeToggle } from "./ModeToggler";

// Navigation links
const navigationLinks = [
  { href: "/", label: "Home", role: "PUBLIC" },
  { href: "/about", label: "About Us", role: "PUBLIC" },
  { href: "/features", label: "Features", role: "PUBLIC" },
  { href: "/faq", label: "FAQ", role: "PUBLIC" },
  { href: "/contact", label: "Contact", role: "PUBLIC" },
  {
    label: "Ride Options",
    role: "PUBLIC",
    children: [
      { href: "/rides/standard", label: "Standard Ride", description: "Affordable everyday trips" },
      { href: "/rides/premium", label: "Premium Ride", description: "Luxury cars with comfort" },
      { href: "/rides/shared", label: "Shared Ride", description: "Share a ride, split the fare" },
    ],
  },
  { href: "/dashboard/admin", label: "Dashboard", role: role.admin },
  { href: "/dashboard/rider", label: "Dashboard", role: role.rider },
  { href: "/dashboard/driver", label: "Dashboard", role: role.driver },
];

export default function Navbar() {
  const { data } = useUserInfoQuery(undefined);
  const [logout] = useLogoutMutation();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await logout(undefined);
    dispatch(authApi.util.resetApiState());
  };

  return (
    <section className="py-4 border-b px-4">
      <div className="container">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">RideBook</span>
          </Link>

          {/* Desktop Menu */}
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              {navigationLinks.map((link, index) => {
                if (link.children) {
                  return (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuTrigger>{link.label}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[600px] grid-cols-2 p-3">
                          {link.children.map((child, i) => (
                            <NavigationMenuLink
                              asChild
                              key={i}
                              className="rounded-md p-3 transition-colors hover:bg-muted/70"
                            >
                              <Link to={child.href}>
                                <p className="mb-1 font-semibold">{child.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {child.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }
                if (link.role === "PUBLIC" || link.role === data?.data?.role) {
                  return (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link to={link.href}>{link.label}</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                }
                return null;
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side */}
          <div className="hidden items-center gap-4 lg:flex">
            <ModeToggle />

            {data?.data?.email ? (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/70 after:hidden"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            data?.data?.avatar ||
                            "https://api.dicebear.com/7.x/initials/svg?seed=" + data?.data?.name
                          }
                          alt={data?.data?.name}
                        />
                        <AvatarFallback>{data?.data?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{data?.data?.name}</span>
                    </NavigationMenuTrigger>

                    <NavigationMenuContent className="w-48 p-2">
                      <div className="flex flex-col gap-2">
                        <Link
                          to="/profile"
                          className="rounded-md px-2 py-1 hover:bg-muted/70 text-sm"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          className="rounded-md px-2 py-1 hover:bg-muted/70 text-sm"
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-100"
                        >
                          Logout
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            ) : (
              // <div className="flex gap-2">
              //   <Button asChild>
              //     <Link to="/login">Login</Link>
              //   </Button>
              //   <Button asChild variant="outline">
              //     <Link to="/register">Register</Link>
              //   </Button>
              // </div>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      // className="flex items-center gap-1  py-2 rounded-md  after:hidden"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            data?.data?.avatar ||
                            "https://api.dicebear.com/7.x/initials/svg?seed=" + data?.data?.name
                          }
                          alt={data?.data?.name}
                        />
                        <AvatarFallback>{data?.data?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{data?.data?.name}</span>
                    </NavigationMenuTrigger>

                    <NavigationMenuContent className="w-48 p-2">
                      <div className="flex flex-col gap-2">
                        <Link
                          to="/profile"
                          className="rounded-md px-2 py-1 hover:bg-muted/70 text-sm"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          className="rounded-md px-2 py-1 hover:bg-muted/70 text-sm"
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-100"
                        >
                          Logout
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-screen overflow-auto">
              <SheetHeader>
                <SheetTitle>
                  <Link to="/" className="flex items-center gap-2">
                    <Logo />
                    <span className="text-lg font-semibold tracking-tight">RideBook</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col px-4 pb-4">
                <Accordion type="single" collapsible className="mb-2">
                  {navigationLinks.map((link, index) =>
                    link.children ? (
                      <AccordionItem key={index} value={link.label} className="border-none">
                        <AccordionTrigger className="text-base hover:no-underline">
                          {link.label}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid md:grid-cols-2">
                            {link.children.map((child, i) => (
                              <Link
                                to={child.href}
                                key={i}
                                className="rounded-md p-3 transition-colors hover:bg-muted/70"
                              >
                                <p className="mb-1 font-semibold">{child.label}</p>
                                <p className="text-sm text-muted-foreground">{child.description}</p>
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : (
                      (link.role === "PUBLIC" || link.role === data?.data?.role) && (
                        <Link key={index} to={link.href} className="font-medium py-2 flex flex-col">
                          {link.label}
                        </Link>
                      )
                    )
                  )}
                </Accordion>

                <div className="mt-2 flex flex-col gap-4">
                  <ModeToggle />
                  {data?.data?.email ? (
                    <Button onClick={handleLogout} variant="outline">
                      Logout
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button asChild>
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/register">Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </section>
  );
}
