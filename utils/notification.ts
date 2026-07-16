
/**
 * Request user permission for browser notifications.
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

/**
 * Fires a clean native system notification.
 */
export const triggerOrderNotification = (orderNumber: string, grandTotal: number) => {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification("Order Confirmed! 🎉", {
      body: `Order #${orderNumber} has been successfully placed. Total: $${grandTotal.toFixed(2)}`,
      icon: "/favicon.ico", // Feel free to point this to a custom brand logo
    });
  }
};