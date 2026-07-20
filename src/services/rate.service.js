import RatePlan from "../models/ratePlan.model.js";
import RoomMapping from "../models/roomMapping.model.js";
import SyncLog from "../models/syncLog.model.js";

export const updateRate = async (
  roomId,
  newPrice
) => {

  // Update all rate plans of this room
  await RatePlan.updateMany(
    {
      roomId,
      isActive: true,
    },
    {
      basePrice: newPrice,
      syncStatus: "pending",
    }
  );

  // Find all OTA mappings
  const mappings =
    await RoomMapping.find({
      roomId,
      rateSync: true,
      status: "active",
    });

  // Create Sync Queue
  for (const mapping of mappings) {

    await SyncLog.create({

      channelId: mapping.channelId,

      roomId,

      type: "rate",

      action: "push",

      status: "pending",

      request: {

        roomId,

        externalRoomId:
          mapping.externalRoomId,

        externalRatePlanId:
          mapping.externalRatePlanId,

        price: newPrice,

      },

    });

  }

};