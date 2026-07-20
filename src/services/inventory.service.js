import Inventory from "../models/inventory.model.js";
import SyncLog from "../models/syncLog.model.js";
import RoomMapping from "../models/roomMapping.model.js";

export const updateInventory = async (
  roomId,
  checkIn,
  checkOut,
  operation = "book"
) => {

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  for (
    let date = new Date(start);
    date < end;
    date.setDate(date.getDate() + 1)
  ) {

    const inventory =
      await Inventory.findOneAndUpdate(
        {
          roomId,
          date: new Date(date),
        },
        {},
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    if (operation === "book") {

      inventory.bookedInventory += 1;

      inventory.availableInventory = Math.max(
        inventory.totalInventory -
          inventory.bookedInventory -
          inventory.blockedInventory,
        0
      );

    }

    if (operation === "cancel") {

      inventory.bookedInventory = Math.max(
        inventory.bookedInventory - 1,
        0
      );

      inventory.availableInventory =
        inventory.totalInventory -
        inventory.bookedInventory -
        inventory.blockedInventory;

    }

    inventory.syncStatus = "pending";

    await inventory.save();

    // Queue Sync
    const mappings =
      await RoomMapping.find({
        roomId,
        inventorySync: true,
        status: "active",
      });

    for (const map of mappings) {

      await SyncLog.create({

        channelId: map.channelId,

        roomId,

        type: "inventory",

        action: "push",

        status: "pending",

        request: {

          roomId,

          externalRoomId:
            map.externalRoomId,

          date,

          availableInventory:
            inventory.availableInventory,

        },

      });

    }

  }

};