import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import {
    LogOut,
    Home,
    Key,
    FileText,
    Settings,
    Menu,
    X,
    Shield,
    User,
    Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const handleLogout = () => {
        AuthService.logout();
        navigate("/login");
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navigation = [
        {
            name: "Главная",
            href: "/",
            icon: Home,
            current: location.pathname === "/"
        },
        {
            name: "Лицензии",
            href: "/licenses",
            icon: Key,
            current: location.pathname === "/licenses" || location.pathname.startsWith("/licenses")
        },
        {
            name: "Логи",
            href: "/logs",
            icon: FileText,
            current: location.pathname === "/logs" || location.pathname.startsWith("/logs")
        },
        {
            name: "Настройки",
            href: "/settings",
            icon: Settings,
            current: location.pathname === "/settings" || location.pathname.startsWith("/settings")
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
            {/* Header */}
            <header className={cn(
                "sticky top-0 z-50 transition-all duration-300 border-b",
                scrolled
                    ? "bg-white/95 backdrop-blur-md shadow-sm border-gray-200"
                    : "bg-white/80 backdrop-blur-sm border-gray-100"
            )}>
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Логотип и бренд */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/"
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                        Metalogic
                                    </span>
                                    <span className="text-xs text-gray-500 -mt-1">
                                        Admin
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                            item.current
                                                ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                            {/* Уведомления */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                            </Button>

                            {/* Профиль */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                            >
                                <User className="w-5 h-5" />
                            </Button>

                            {/* Кнопка выхода - десктоп */}
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="hidden sm:flex items-center gap-2 border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Выйти</span>
                            </Button>

                            {/* Мобильное меню */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
                        <div className="px-4 py-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            item.current
                                                ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                            >
                                <LogOut className="w-4 h-4" />
                                Выйти из системы
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className={cn(
                        "bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm",
                        "hover:shadow-lg transition-shadow duration-300"
                    )}>
                        <Outlet />
                    </div>
                </div>
            </main>

            <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-purple-600">Ⓜ️</span>
                            {" "}Metalogic License Management System v2.0
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}