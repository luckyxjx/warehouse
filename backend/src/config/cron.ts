import cron from "node-cron";
import { NotificationService } from "../services/notification.service";

const notificationService = new NotificationService();

/**
 * Schedules the end-of-day WhatsApp summary.
 * Fires at 21:00 IST (15:30 UTC) every day.
 * Cron format: minute hour day month weekday
 */
export function startCronJobs(): void {
  // 9 PM IST = 15:30 UTC
  cron.schedule(
    "30 15 * * *",
    async () => {
      console.info("[Cron] Running daily summary notification…");
      try {
        await notificationService.sendDailySummary();
      } catch (err) {
        console.error("[Cron] Daily summary failed:", err);
      }
    },
    { timezone: "UTC" }
  );

  console.info("[Cron] Daily summary scheduled at 9:00 PM IST (15:30 UTC)");
}
