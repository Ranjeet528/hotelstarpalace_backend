import SyncLog from "../models/syncLog.model.js";
import Channel from "../models/channel.model.js";

// OTA Services (future)
import { syncBookingCom } from "./bookingCom.service.js";
import { syncAgoda } from "./agoda.service.js";
import { syncMMT } from "./mmt.service.js";
import { syncExpedia } from "./expedia.service.js";

export const processPendingSyncs =
  async () => {

    const pendingLogs =
      await SyncLog.find({
        status: "pending",
      })
        .populate("channelId")
        .limit(100);

    for (const log of pendingLogs) {

      try {

        log.status = "processing";
        await log.save();

        const channel =
          log.channelId;

        if (!channel) {
          throw new Error(
            "Channel not found"
          );
        }

        switch (channel.slug) {

          case "booking-com":

            await syncBookingCom(
              log
            );

            break;

          case "agoda":

            await syncAgoda(log);

            break;

          case "mmt":

            await syncMMT(log);

            break;

          case "expedia":

            await syncExpedia(
              log
            );

            break;

          default:

            throw new Error(
              "Unsupported Channel"
            );

        }

        log.status = "success";

        log.syncedAt =
          new Date();

        await log.save();

      } catch (error) {

        log.status = "failed";

        log.error =
          error.message;

        log.retryCount += 1;

        await log.save();

      }

    }

  };