"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Edit,
  Plus,
  Trash2,
  Save,
  X,
  Check,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  menuItemsApi,
  ordersApi,
  type MenuItem,
  type OrderWithItems,
} from "@/lib/supabase";

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    price: 0,
    image: "/placeholder.svg?height=200&width=200",
    category: "drinks",
    description: "",
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    // Check admin authentication
    const adminAuth = localStorage.getItem("adminAuth");
    if (!adminAuth) {
      router.push("/admin/login");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, menuData] = await Promise.all([
        ordersApi.getAll(),
        menuItemsApi.getAll(),
      ]);
      setOrders(ordersData);
      setMenuItems(menuData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  };

  const getTodayRevenue = () => {
    return getTodayOrders()
      .filter((order) => order.payment_status === "approved")
      .reduce((total, order) => total + order.total, 0);
  };

  const exportTodayOrders = () => {
    const todayOrders = getTodayOrders();
    const csvContent = [
      ["เวลา", "ชื่อลูกค้า", "เบอร์โทร", "รายการ", "ยอดรวม", "สถานะ"],
      ...todayOrders.map((order) => [
        new Date(order.created_at).toLocaleTimeString("th-TH"),
        order.customer_name,
        order.customer_phone,
        order.order_items
          .map((item) => `${item.menu_item_name} x${item.quantity}`)
          .join(", "),
        order.total.toString(),
        order.payment_status === "approved"
          ? "อนุมัติ"
          : order.payment_status === "rejected"
          ? "ปฏิเสธ"
          : "รอตรวจสอบ",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `orders_${new Date().toLocaleDateString("th-TH")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveItem = async () => {
    if (editingItem) {
      try {
        await menuItemsApi.update(editingItem.id, editingItem);
        await loadData();
        setEditingItem(null);
      } catch (error) {
        console.error("Error updating item:", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตรายการ");
      }
    }
  };

  const handleAddNewItem = async () => {
    if (newItem.name && newItem.price) {
      try {
        await menuItemsApi.create({
          name: newItem.name,
          price: newItem.price,
          image: newItem.image || "/placeholder.svg?height=200&width=200",
          category: newItem.category as "drinks" | "food",
          description: newItem.description,
        });
        await loadData();
        setNewItem({
          name: "",
          price: 0,
          image: "/placeholder.svg?height=200&width=200",
          category: "drinks",
          description: "",
        });
        setIsAddingNew(false);
      } catch (error) {
        console.error("Error adding item:", error);
        alert("เกิดข้อผิดพลาดในการเพิ่มรายการ");
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("ต้องการลบรายการนี้หรือไม่?")) {
      try {
        await menuItemsApi.delete(itemId);
        await loadData();
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("เกิดข้อผิดพลาดในการลบรายการ");
      }
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      await ordersApi.updatePaymentStatus(orderId, status);
      await loadData();
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะการชำระเงิน");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            อนุมัติ
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <X className="w-3 h-3 mr-1" />
            ปฏิเสธ
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            รอตรวจสอบ
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
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
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent"
            >
              🔧 Admin Dashboard
            </motion.h1>
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="bg-white/50 hover:bg-red-50 border-red-200 text-red-600"
                >
                  ออกจากระบบ
                </Button>
              </motion.div>
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="bg-white/50 hover:bg-blue-50 border-blue-200"
                  >
                    กลับหน้าหลัก
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Tabs defaultValue="orders" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TabsList className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <TabsTrigger
                  value="orders"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  📊 รายการสั่งซื้อ
                </TabsTrigger>
                <TabsTrigger
                  value="menu"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                >
                  🍽️ จัดการเมนู
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="orders" className="space-y-6">
              {/* Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, staggerChildren: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                        💰 ยอดขายวันนี้
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        key={getTodayRevenue()}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-bold text-green-600"
                      >
                        ฿{getTodayRevenue()}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                        📦 จำนวนออเดอร์วันนี้
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        key={getTodayOrders().length}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-bold text-blue-600"
                      >
                        {getTodayOrders().length}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
                        📋 ออเดอร์ทั้งหมด
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        key={orders.length}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-bold text-purple-600"
                      >
                        {orders.length}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Export Button */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-end"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={exportTodayOrders}
                    disabled={getTodayOrders().length === 0}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export รายการวันนี้
                  </Button>
                </motion.div>
              </motion.div>

              {/* Today's Orders */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-800">
                      📅 รายการสั่งซื้อวันนี้
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getTodayOrders().length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-500 text-lg">
                          ไม่มีรายการสั่งซื้อวันนี้
                        </p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {getTodayOrders().map((order, index) => (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, x: -20, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: 20, scale: 0.95 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{
                                scale: 1.02,
                                backgroundColor: "#fefefe",
                              }}
                              className="border rounded-xl p-6 transition-all duration-200 hover:shadow-lg bg-white/50"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-gray-800 text-lg">
                                    {order.customer_name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    📞 {order.customer_phone}
                                  </p>
                                </div>
                                <div className="text-right space-y-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    🕐{" "}
                                    {new Date(
                                      order.created_at
                                    ).toLocaleTimeString("th-TH")}
                                  </Badge>
                                  {getStatusBadge(order.payment_status)}
                                  <motion.p
                                    key={order.total}
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    className="text-xl font-bold text-green-600"
                                  >
                                    ฿{order.total}
                                  </motion.p>
                                </div>
                              </div>

                              {/* Payment Slip */}
                              {order.payment_slip && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    สลิปการโอนเงิน:
                                  </p>
                                  <img
                                    src={
                                      order.payment_slip || "/placeholder.svg"
                                    }
                                    alt="สลิปการโอนเงิน"
                                    className="w-32 h-40 object-cover rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => {
                                      localStorage.setItem(
                                        "slip",
                                        order.payment_slip || ""
                                      );
                                      router.push("/admin/slip");
                                    }}
                                  />
                                </div>
                              )}

                              {/* Payment Status Actions */}
                              {order.payment_status === "pending" && (
                                <div className="flex space-x-2 mb-3">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleUpdatePaymentStatus(
                                        order.id,
                                        "approved"
                                      )
                                    }
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    อนุมัติ
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdatePaymentStatus(
                                        order.id,
                                        "rejected"
                                      )
                                    }
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    ปฏิเสธ
                                  </Button>
                                </div>
                              )}

                              <Separator className="my-3" />
                              <div className="space-y-2">
                                {order.order_items.map((item, itemIndex) => (
                                  <motion.div
                                    key={itemIndex}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      delay: index * 0.1 + itemIndex * 0.05,
                                    }}
                                    className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg"
                                  >
                                    <span className="text-gray-700">
                                      {item.menu_item_name} x{item.quantity}
                                    </span>
                                    <span className="font-medium text-green-600">
                                      ฿{item.menu_item_price * item.quantity}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="menu" className="space-y-6">
              {/* Add New Item Button */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setIsAddingNew(true)}
                    disabled={isAddingNew}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />✨ เพิ่มรายการใหม่
                  </Button>
                </motion.div>
              </motion.div>

              {/* Add New Item Form */}
              <AnimatePresence>
                {isAddingNew && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center text-gray-800">
                          ➕ เพิ่มรายการใหม่
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <Label htmlFor="newName" className="text-gray-700">
                              ชื่อรายการ
                            </Label>
                            <Input
                              id="newName"
                              value={newItem.name}
                              onChange={(e) =>
                                setNewItem((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="mt-2 bg-white/80 border-orange-200 focus:border-orange-400"
                            />
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Label htmlFor="newPrice" className="text-gray-700">
                              ราคา
                            </Label>
                            <Input
                              id="newPrice"
                              type="number"
                              value={newItem.price}
                              onChange={(e) =>
                                setNewItem((prev) => ({
                                  ...prev,
                                  price: Number(e.target.value),
                                }))
                              }
                              className="mt-2 bg-white/80 border-orange-200 focus:border-orange-400"
                            />
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Label
                              htmlFor="newCategory"
                              className="text-gray-700"
                            >
                              หมวดหมู่
                            </Label>
                            <Select
                              value={newItem.category}
                              onValueChange={(value) =>
                                setNewItem((prev) => ({
                                  ...prev,
                                  category: value as "drinks" | "food",
                                }))
                              }
                            >
                              <SelectTrigger className="mt-2 bg-white/80 border-orange-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="drinks">
                                  🥤 เครื่องดื่ม
                                </SelectItem>
                                <SelectItem value="food">🥪 อาหาร</SelectItem>
                              </SelectContent>
                            </Select>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Label htmlFor="newImage" className="text-gray-700">
                              URL รูปภาพ
                            </Label>
                            <Input
                              id="newImage"
                              value={newItem.image}
                              onChange={(e) =>
                                setNewItem((prev) => ({
                                  ...prev,
                                  image: e.target.value,
                                }))
                              }
                              className="mt-2 bg-white/80 border-orange-200 focus:border-orange-400"
                            />
                          </motion.div>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Label
                            htmlFor="newDescription"
                            className="text-gray-700"
                          >
                            คำอธิบาย
                          </Label>
                          <Input
                            id="newDescription"
                            value={newItem.description}
                            onChange={(e) =>
                              setNewItem((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="mt-2 bg-white/80 border-orange-200 focus:border-orange-400"
                          />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="flex space-x-2"
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={handleAddNewItem}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              บันทึก
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outline"
                              onClick={() => setIsAddingNew(false)}
                              className="hover:bg-red-50 border-red-200"
                            >
                              <X className="w-4 h-4 mr-2" />
                              ยกเลิก
                            </Button>
                          </motion.div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Menu Items */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, staggerChildren: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {menuItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: -50 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                      }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                        <CardContent className="p-4">
                          {editingItem?.id === item.id ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-4"
                            >
                              <div>
                                <Label className="text-gray-700">
                                  ชื่อรายการ
                                </Label>
                                <Input
                                  value={editingItem.name}
                                  onChange={(e) =>
                                    setEditingItem((prev) =>
                                      prev
                                        ? { ...prev, name: e.target.value }
                                        : null
                                    )
                                  }
                                  className="mt-1 bg-white/80 border-orange-200"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-700">ราคา</Label>
                                <Input
                                  type="number"
                                  value={editingItem.price}
                                  onChange={(e) =>
                                    setEditingItem((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            price: Number(e.target.value),
                                          }
                                        : null
                                    )
                                  }
                                  className="mt-1 bg-white/80 border-orange-200"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-700">
                                  หมวดหมู่
                                </Label>
                                <Select
                                  value={editingItem.category}
                                  onValueChange={(value) =>
                                    setEditingItem((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            category: value as
                                              | "drinks"
                                              | "food",
                                          }
                                        : null
                                    )
                                  }
                                >
                                  <SelectTrigger className="mt-1 bg-white/80 border-orange-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="drinks">
                                      🥤 เครื่องดื่ม
                                    </SelectItem>
                                    <SelectItem value="food">
                                      🥪 อาหาร
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-gray-700">
                                  คำอธิบาย
                                </Label>
                                <Input
                                  value={editingItem.description || ""}
                                  onChange={(e) =>
                                    setEditingItem((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            description: e.target.value,
                                          }
                                        : null
                                    )
                                  }
                                  className="mt-1 bg-white/80 border-orange-200"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    onClick={handleSaveItem}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    บันทึก
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingItem(null)}
                                    className="hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    ยกเลิก
                                  </Button>
                                </motion.div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center text-4xl"
                                whileHover={{ scale: 1.05 }}
                              >
                                {item.category === "drinks" ? "🥤" : "🥪"}
                              </motion.div>
                              <h3 className="font-semibold mb-2 text-gray-800">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {item.description}
                              </p>
                              <motion.p
                                className="text-xl font-bold text-green-600 mb-4"
                                whileHover={{ scale: 1.05 }}
                              >
                                ฿{item.price}
                              </motion.p>
                              <Badge
                                variant="outline"
                                className={`mb-4 ${
                                  item.category === "drinks"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-orange-50 text-orange-700 border-orange-200"
                                }`}
                              >
                                {item.category === "drinks"
                                  ? "🥤 เครื่องดื่ม"
                                  : "🥪 อาหาร"}
                              </Badge>
                              <div className="flex space-x-2">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingItem(item)}
                                    className="hover:bg-blue-50 border-blue-200"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    แก้ไข
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="hover:bg-red-50 border-red-200 text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    ลบ
                                  </Button>
                                </motion.div>
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
