import { MenuIcon, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
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
import {
  authApi,
  useLogoutMutation,
  useUserInfoQuery,
} from "@/redux/features/auth/auth.api";
import { role } from "@/constants/role";
import Logo from "@/assets/icons/Logo";
import { ModeToggle } from "./ModeToggler";
import { useState, useEffect } from "react";

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
      {
        href: "/rides/standard",
        label: "Standard Ride",
        description: "Affordable everyday trips",
      },
      {
        href: "/rides/premium",
        label: "Premium Ride",
        description: "Luxury cars with comfort",
      },
      {
        href: "/rides/shared",
        label: "Shared Ride",
        description: "Share a ride, split the fare",
      },
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

  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout(undefined);
    dispatch(authApi.util.resetApiState());
  };

  return (
    <section
      className={`py-4 border-b px-6 md:px-12 sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/60 dark:bg-background/40 backdrop-blur-xl shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">
              RideBook
            </span>
          </Link>

          {/* Desktop Menu */}
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              {navigationLinks.map((link, index) => {
                if (link.children) {
                  return (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors border-0 shadow-none">
                        {link.label}
                      </NavigationMenuTrigger>

                      <NavigationMenuContent>
                        <div className="grid w-[600px] grid-cols-2 p-3">
                          {link.children.map((child, i) => (
                            <NavigationMenuLink
                              asChild
                              key={i}
                              className="rounded-md p-3 transition-colors hover:bg-muted/70"
                            >
                              <Link to={child.href}>
                                <p className="mb-1 font-semibold">
                                  {child.label}
                                </p>
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
                      <NavigationMenuLink asChild>
                        <Link
                          to={link.href}
                          className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                }
                return null;
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <ModeToggle />
            {data?.data?.email ? (
              <div
                className="relative"
                onMouseEnter={() => setDesktopMenuOpen(true)}
                onMouseLeave={() => setDesktopMenuOpen(false)}
              >
                <button
                  onClick={() => setDesktopMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted/70"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        data?.data?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${data?.data?.name}`
                      }
                      alt={data?.data?.name}
                    />
                    <AvatarFallback>
                      {data?.data?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{data?.data?.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      desktopMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {desktopMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover shadow-md flex flex-col">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm hover:bg-muted/70"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-muted/70"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted/70"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
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

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center gap-2">
            <ModeToggle />
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="max-h-screen flex flex-col">
                <SheetHeader>
                  <SheetTitle>
                    <Link to="/" className="flex items-center gap-2">
                      <Logo />
                      <span className="text-lg font-semibold tracking-tight">
                        RideBook
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                {/* Top: Profile/Auth */}
                <div className="flex flex-col px-4 pb-4 gap-4 border-b">
                  {data?.data?.email ? (
                    <div>
                      <button
                        onClick={() => setMobileProfileOpen((prev) => !prev)}
                        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/70 w-full justify-between"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              data?.data?.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${data?.data?.name}`
                            }
                            alt={data?.data?.name}
                          />
                          <AvatarFallback>
                            {data?.data?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {data?.data?.name}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                            mobileProfileOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {mobileProfileOpen && (
                        <div className="mt-2 w-full rounded-md border bg-popover shadow-md flex flex-col">
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm hover:bg-muted/70"
                          >
                            Profile
                          </Link>
                          <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-sm hover:bg-muted/70"
                          >
                            Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted/70"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 -mt-4">
                      <Button asChild>
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/register">Register</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Middle: Navigation Links */}
                <div className="flex-1 overflow-auto px-4 -mt-2">
                  <Accordion type="single" collapsible className="mb-2">
                    {navigationLinks.map((link, index) =>
                      link.children ? (
                        <AccordionItem
                          key={index}
                          value={link.label}
                          className="border-none"
                        >
                          <AccordionTrigger className="text-base hover:no-underline">
                            {link.label}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid md:grid-cols-2">
                              {link.children.map((child, i) => (
                                <Link
                                  key={i}
                                  to={child.href}
                                  className="rounded-md p-3 transition-colors hover:bg-muted/70"
                                >
                                  <p className="mb-1 font-semibold">
                                    {child.label}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {child.description}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ) : (
                        (link.role === "PUBLIC" ||
                          link.role === data?.data?.role) && (
                          <Link
                            key={index}
                            to={link.href}
                            className="font-medium py-2 flex flex-col"
                          >
                            {link.label}
                          </Link>
                        )
                      )
                    )}
                  </Accordion>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </section>
  );
}
