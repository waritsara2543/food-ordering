"use client";

import React, { useEffect } from "react";

const page = () => {
  const [slip, setSlip] = React.useState<any>(null);
  useEffect(() => {
    setSlip(localStorage.getItem("slip"));
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <img
        src={slip || "/placeholder.svg"}
        alt="สลิปการโอนเงิน"
        className="w-[22%] object-cover rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
      />
    </div>
  );
};

export default page;
