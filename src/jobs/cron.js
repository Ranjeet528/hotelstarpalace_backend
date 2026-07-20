import cron from "node-cron";

import { autoCompleteBookings } from "./autoCompleteBookings.js";
import { processPendingSyncs } from "../services/sync.service.js";


// ==============================
// AUTO COMPLETE BOOKINGS
// Every 5 Minutes
// ==============================

cron.schedule(
  "*/5 * * * *",
  async () => {

    console.log(
      "⏰ Auto Checkout Cron Running:",
      new Date().toLocaleString()
    );

    try {

      await autoCompleteBookings();

    } catch (error) {

      console.log(
        "Auto Checkout Error:",
        error.message
      );

    }

  }
);


// ==============================
// CHANNEL MANAGER SYNC
// Every 1 Minute
// ==============================

cron.schedule(
  "* * * * *",
  async () => {

    console.log(
      "🔄 Channel Sync Running:",
      new Date().toLocaleString()
    );

    try {

      await processPendingSyncs();

    } catch (error) {

      console.log(
        "Channel Sync Error:",
        error.message
      );

    }

  }
);