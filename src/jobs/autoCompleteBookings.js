import Booking from "../models/booking.model.js";
import Room from "../models/room.model.js";


export const autoCompleteBookings = async () => {

try {

const now = new Date();


const bookings = await Booking.find({
  status:{
    $in:["booked","checked_in"]
  },
  checkOut:{
    $lte:now
  }
});


for(const booking of bookings){

 booking.status="completed";
 booking.checkedOutAt=now;

 await booking.save();


 await Room.findByIdAndUpdate(
   booking.roomId,
   {
    status:"available"
   }
 );

}


console.log(
 `AUTO CHECKOUT: ${bookings.length} bookings completed`
);


}catch(err){

 console.log(
  "Auto checkout error",
  err
 );

}

};