"use client";

import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: "toast-default",
        success: { iconTheme: { primary: "#A0E8AF", secondary: "#181818" } },
        error: { iconTheme: { primary: "#FF003C", secondary: "#181818" } },
      }}
    />
  );
}
