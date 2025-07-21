"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Sparkles, Megaphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { menuItemsApi, type MenuItem } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CartItem extends MenuItem {
  quantity: number;
}

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<"drinks" | "food">(
    "drinks"
  );
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminHint, setShowAdminHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadMenuItems();
    loadCartFromStorage();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await menuItemsApi.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error("Error loading menu items:", error);
      // Fallback to localStorage if Supabase fails
      const savedItems = localStorage.getItem("menuItems");
      if (savedItems) {
        setMenuItems(JSON.parse(savedItems));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter((cartItem) => cartItem.id !== itemId);
    });
  };

  const getCartItemQuantity = (itemId: string) => {
    const item = cart.find((cartItem) => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredItems = menuItems.filter(
    (item) => item.category === activeCategory
  );

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (newCount === 3) {
      setShowAdminHint(true);
      setTimeout(() => setShowAdminHint(false), 2000);
    }

    if (newCount >= 5) {
      router.push("/admin");
      setLogoClickCount(0);
    }

    // Reset counter after 3 seconds of inactivity
    setTimeout(() => {
      setLogoClickCount(0);
    }, 3000);
  };

  useEffect(() => {
    const dialogClosed = localStorage.getItem("dialogClosed") === "true";
    setOpenDialog(!dialogClosed);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">กำลังโหลดเมนู...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center space-x-2 cursor-pointer relative"
              onClick={handleLogoClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                แสนดีชานมไข่มุก by Debugger
              </h1>

              {/* Admin Hint */}
              <AnimatePresence>
                {showAdminHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    className="absolute -bottom-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap"
                  >
                    คลิกอีก {5 - logoClickCount} ครั้งเพื่อเข้า Admin
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Click indicator */}
              {logoClickCount > 0 && logoClickCount < 5 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {logoClickCount}
                </motion.div>
              )}
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link href="/checkout">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="relative bg-white/50 hover:bg-orange-50 border-orange-200 hover:border-orange-300 transition-all duration-200"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    ตะกร้า
                    <AnimatePresence>
                      {getTotalItems() > 0 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-2 -right-2"
                        >
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 text-xs animate-pulse">
                            {getTotalItems()}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center space-x-4 mb-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={activeCategory === "drinks" ? "default" : "outline"}
              onClick={() => setActiveCategory("drinks")}
              className={`px-8 py-3 text-lg font-medium transition-all duration-300 ${
                activeCategory === "drinks"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg"
                  : "bg-white/50 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
              }`}
            >
              🥤 เครื่องดื่ม
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={activeCategory === "food" ? "default" : "outline"}
              onClick={() => setActiveCategory("food")}
              className={`px-8 py-3 text-lg font-medium transition-all duration-300 ${
                activeCategory === "food"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                  : "bg-white/50 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
              }`}
            >
              🥪 อาหาร
            </Button>
          </motion.div>
        </motion.div>

        {/* Menu Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-orange-200/50">
                  <CardHeader className="p-0">
                    <motion.div
                      className="aspect-square relative overflow-hidden"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className={`object-cover ${
                          item.available
                            ? "transition-transform duration-300"
                            : "opacity-30"
                        }`}
                      />
                    </motion.div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2 text-gray-800">
                      {item.name}
                      {item.available ? (
                        <Badge className="ml-2 bg-green-100 text-green-800 ">
                          พร้อมจำหน่าย
                        </Badge>
                      ) : (
                        <Badge className="ml-2 bg-red-100 text-red-800">
                          ไม่พร้อมจำหน่าย
                        </Badge>
                      )}
                    </CardTitle>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {item.description}
                      </p>
                    )}
                    <motion.p
                      className={`text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent ${
                        item.available ? "" : "opacity-50"
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      ฿{item.price}
                    </motion.p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <AnimatePresence mode="wait">
                      {getCartItemQuantity(item.id) === 0 ? (
                        <motion.div
                          key="add-button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="w-full"
                        >
                          <Button
                            onClick={() => addToCart(item)}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={!item.available}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มลงตะกร้า
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="quantity-controls"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center justify-between w-full"
                        >
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="bg-white/80 hover:bg-red-50 border-red-200 hover:border-red-300"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.span
                            key={getCartItemQuantity(item.id)}
                            initial={{ scale: 1.2, color: "#f97316" }}
                            animate={{ scale: 1, color: "#374151" }}
                            className="font-semibold px-4 text-lg"
                          >
                            {getCartItemQuantity(item.id)}
                          </motion.span>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">ไม่มีรายการในหมวดหมู่นี้</p>
          </motion.div>
        )}

        {/* Floating Cart Summary */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-4 right-4 z-40"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-orange-200 min-w-[280px]"
              >
                <div className="text-sm text-gray-600 mb-2">
                  รวม {getTotalItems()} รายการ
                </div>
                <motion.div
                  key={getTotalPrice()}
                  initial={{ scale: 1.1, color: "#f97316" }}
                  animate={{ scale: 1, color: "#059669" }}
                  className="text-2xl font-bold mb-4"
                >
                  ฿{getTotalPrice()}
                </motion.div>
                <Link href="/checkout">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 text-lg">
                      ดำเนินการสั่งซื้อ
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Dialog Anouncement */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-semibold">
              <Megaphone className="w-8 h-8 text-orange-500 inline-block mr-2" />
              ประกาศ
            </DialogTitle>
            <DialogDescription>
              ปิดรับออเดอร์ เวลา 22:00 น. ทุกวัน
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="mt-4 border-orange-400 hover:border-orange-500 text-orange-600 hover:text-orange-700"
                onClick={() => {
                  // Close dialog logic here
                  setOpenDialog(false);
                  localStorage.setItem("dialogClosed", "true");
                }}
              >
                เข้าใจแล้ว
              </Button>
            </DialogTrigger>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
