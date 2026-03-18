import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import App from "./App";
import "./index.css";

async function registerPushNotifications() {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") {
      console.log("[PUSH] Permission not granted");
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      console.log("[PUSH] Token:", token.value);
      try {
        await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token: token.value }),
        });
      } catch (err) {
        console.error("[PUSH] Failed to send token:", err);
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("[PUSH] Registration error:", err);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[PUSH] Received:", notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[PUSH] Action:", action);
    });
  } catch (err) {
    console.log("[PUSH] Push notifications not available:", err);
  }
}

async function initCapacitor() {
  if (Capacitor.isNativePlatform()) {
    document.body.classList.add("capacitor");

    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#0a1628" });
    } catch {}

    try {
      await Keyboard.setResizeMode({ mode: "body" as any });
    } catch {}

    registerPushNotifications();
  }
}

initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
