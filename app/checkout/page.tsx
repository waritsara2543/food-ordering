"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ordersApi, type MenuItem, type OrderWithItems } from "@/lib/supabase";

interface CartItem extends MenuItem {
  quantity: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminHint, setShowAdminHint] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentSlipPreview, setPaymentSlipPreview] = useState<string | null>(
    null
  );
  const [completedOrder, setCompletedOrder] = useState<OrderWithItems | null>(
    null
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
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart((prev) => prev.filter((item) => item.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert("กรุณากรอกชื่อ");
      return;
    }

    if (cart.length === 0) {
      alert("กรุณาเลือกสินค้า");
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentSlip(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentSlipPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentSlip) {
      alert("กรุณาอัปโหลดสลิปการโอนเงิน");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order in Supabase
      const createdOrder = await ordersApi.create({
        customer_name: customerName.trim(),
        customer_phone: customerNote.trim(),
        total: getTotalPrice(),
        payment_slip: paymentSlipPreview || undefined,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          menu_item_name: item.name,
          menu_item_price: item.price,
          quantity: item.quantity,
        })),
      });

      // Clear cart
      localStorage.removeItem("cart");
      setCart([]);

      // Set completed order and close payment modal
      setCompletedOrder(createdOrder);
      setShowPayment(false);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-0">
            <CardContent className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-6xl mb-4"
              >
                🛒
              </motion.div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                ตะกร้าว่าง
              </h2>
              <p className="text-gray-600 mb-6">ไม่มีสินค้าในตะกร้า</p>
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับไปเลือกสินค้า
                  </Button>
                </motion.div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-100"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-orange-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  กลับ
                </Button>
              </motion.div>
            </Link>
            <motion.h1
              className="text-xl font-semibold ml-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent cursor-pointer relative"
              onClick={handleLogoClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ยืนยันการสั่งซื้อ
              {/* Admin Hint */}
              <AnimatePresence>
                {showAdminHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    className="absolute -bottom-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-50"
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
            </motion.h1>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  🛍️ รายการสินค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {cart.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: "#fef3f2" }}
                      className="flex items-center space-x-4 p-4 border rounded-xl transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">฿{item.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity - 1)
                            }
                            className="bg-white/80 hover:bg-red-50 border-red-200"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </motion.div>
                        <motion.span
                          key={item.quantity}
                          initial={{ scale: 1.2, color: "#f97316" }}
                          animate={{ scale: 1, color: "#374151" }}
                          className="w-8 text-center font-semibold"
                        >
                          {item.quantity}
                        </motion.span>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity + 1)
                            }
                            className="bg-white/80 hover:bg-green-50 border-green-200"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      </div>
                      <div className="text-right">
                        <motion.p
                          key={item.price * item.quantity}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="font-medium text-green-600"
                        >
                          ฿{item.price * item.quantity}
                        </motion.p>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Separator />
                <motion.div
                  className="flex justify-between items-center text-lg font-semibold p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-gray-800">รวมทั้งหมด:</span>
                  <motion.span
                    key={getTotalPrice()}
                    initial={{ scale: 1.2, color: "#f97316" }}
                    animate={{ scale: 1, color: "#059669" }}
                    className="text-2xl font-bold"
                  >
                    ฿{getTotalPrice()}
                  </motion.span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  👤 ข้อมูลลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Label htmlFor="customerName" className="text-gray-700">
                    ชื่อ-นามสกุล
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="กรุณากรอกชื่อ-นามสกุล"
                    className="mt-2 bg-white/80 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    required
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Label htmlFor="customerNote" className="text-gray-700">
                    โน้ต
                  </Label>
                  <Input
                    id="customerNote"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="โน้ต"
                    className="mt-2 bg-white/80 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    required
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="w-full mt-6 py-4 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      "✨ "
                    )}
                    {isSubmitting ? "กำลังสั่งซื้อ..." : "ยืนยันการสั่งซื้อ"}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-4xl mb-2"
                  >
                    💳
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    ชำระเงิน
                  </h2>
                  <p className="text-gray-600">สแกน QR Code เพื่อชำระเงิน</p>
                </div>

                {/* Order Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">ยอดที่ต้องชำระ:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ฿{getTotalPrice()}
                    </span>
                  </div>
                </motion.div>

                {/* QR Code */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center mb-6"
                >
                  <div className="bg-white rounded-xl shadow-lg p-4 inline-block">
                    <img
                      src="/qr-payment.jpg"
                      alt="QR Code สำหรับชำระเงิน"
                      className="w-64 h-auto mx-auto rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    สแกน QR Code ด้วยแอปธนาคารของคุณ
                  </p>
                </motion.div>

                {/* Upload Slip Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    📄 อัปโหลดสลิปการโอนเงิน
                  </h3>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentSlipUpload}
                      className="hidden"
                      id="payment-slip"
                    />
                    <label
                      htmlFor="payment-slip"
                      className="cursor-pointer block"
                    >
                      {paymentSlipPreview ? (
                        <div className="space-y-3">
                          <img
                            src={paymentSlipPreview || "/placeholder.svg"}
                            alt="สลิปการโอนเงิน"
                            className="w-32 h-40 object-cover mx-auto rounded-lg shadow-md"
                          />
                          <p className="text-sm text-green-600 font-medium">
                            ✅ อัปโหลดสลิปเรียบร้อย
                          </p>
                          <p className="text-xs text-gray-500">
                            คลิกเพื่อเปลี่ยนรูป
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-4xl">📷</div>
                          <div>
                            <p className="text-gray-600 font-medium">
                              คลิกเพื่ออัปโหลดสลิป
                            </p>
                            <p className="text-sm text-gray-500">
                              รองรับไฟล์ JPG, PNG
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex space-x-3 mt-6"
                >
                  <Button
                    variant="outline"
                    onClick={() => setShowPayment(false)}
                    className="flex-1 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={!paymentSlip || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      "✨ "
                    )}
                    {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Order Success Modal */}
      <AnimatePresence>
        {completedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Success Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                    className="text-6xl mb-4"
                  >
                    ✅
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-green-600 mb-2"
                  >
                    สั่งซื้อสำเร็จ!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600"
                  >
                    รอการตรวจสอบการชำระเงิน
                  </motion.p>
                </div>

                {/* Order Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  {/* Order Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      📋 รายละเอียดออเดอร์
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">หมายเลขออเดอร์:</span>
                        <span className="font-mono text-blue-600">
                          #{completedOrder.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">วันที่สั่ง:</span>
                        <span className="font-medium">
                          {new Date(
                            completedOrder.created_at
                          ).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">เวลา:</span>
                        <span className="font-medium">
                          {new Date(
                            completedOrder.created_at
                          ).toLocaleTimeString("th-TH")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      👤 ข้อมูลลูกค้า
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ชื่อ:</span>
                        <span className="font-medium">
                          {completedOrder.customer_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">เบอร์โทร:</span>
                        <span className="font-medium">
                          {completedOrder.customer_phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      🛍️ รายการสินค้า
                    </h3>
                    <div className="space-y-2">
                      {completedOrder.order_items.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="flex justify-between items-center text-sm bg-white/50 p-3 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-gray-800">
                              {item.menu_item_name}
                            </span>
                            <span className="text-gray-600 ml-2">
                              x{item.quantity}
                            </span>
                          </div>
                          <span className="font-medium text-green-600">
                            ฿{item.menu_item_price * item.quantity}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Total */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">
                      ยอดรวมทั้งหมด:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ฿{completedOrder.total}
                    </span>
                  </div>
                </motion.div>

                {/* Payment Status */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-700 font-medium">
                      สถานะ: รอการตรวจสอบการชำระเงิน
                    </span>
                  </div>
                  <p className="text-center text-sm text-yellow-600 mt-2">
                    เราจะตรวจสอบสลิปการโอนเงินและแจ้งผลให้ทราบ
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex space-x-3 mt-6"
                >
                  <Button
                    variant="outline"
                    onClick={() => setCompletedOrder(null)}
                    className="flex-1 hover:bg-gray-50"
                  >
                    สั่งซื้อเพิ่ม
                  </Button>
                  <Button
                    onClick={() => {
                      setCompletedOrder(null);
                      router.push("/");
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    กลับหน้าหลัก
                  </Button>
                </motion.div>

                {/* Contact Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="mt-6 text-center text-xs text-gray-500 border-t pt-4"
                >
                  <p>หากมีข้อสงสัย กรุณาติดต่อ: 02-xxx-xxxx</p>
                  <p>หรือ Line ID: @yourshop</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
