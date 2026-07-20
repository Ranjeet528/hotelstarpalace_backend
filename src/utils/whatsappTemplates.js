// ===============================
// CUSTOMER BOOKING TEMPLATE
// ===============================

export const customerBookingTemplate = ({
  bookingId,
  customerName,
  roomTitle,
  roomType,
  checkIn,
  checkOut,
  adults,
  children,
  total,
}) => {
  return `🏨 *HOTEL STAR PALACE*

Hello *${customerName}*,

🎉 Your booking has been confirmed successfully.

━━━━━━━━━━━━━━━━━━

📌 *Booking ID*
${bookingId}

🛏️ *Room*
${roomTitle}

🏷️ *Room Type*
${roomType}

📅 *Check-In*
${checkIn}
🕛 12:00 PM

📅 *Check-Out*
${checkOut}
🕚 11:00 AM

👨 Adults : ${adults}
🧒 Children : ${children}

💰 *Total Amount*
₹${total}

━━━━━━━━━━━━━━━━━━

📍 Hotel Star Palace
Manda Road, Khatu, Rajasthan

📞 +91 9876543210

📧 info@hotelstarpalace.com

🙏 Thank you for choosing
*Hotel Star Palace*

We look forward to welcoming you.

Have a wonderful stay! 🌸`;
};

// ===============================
// ADMIN BOOKING TEMPLATE
// ===============================

export const adminBookingTemplate = ({
  bookingId,
  customerName,
  phone,
  roomTitle,
  roomType,
  checkIn,
  checkOut,
  adults,
  children,
  total,
}) => {
  return `🔔 *NEW BOOKING RECEIVED*

━━━━━━━━━━━━━━━━━━

🆔 Booking ID
${bookingId}

👤 Guest
${customerName}

📞 Phone
${phone}

🛏️ Room
${roomTitle}

🏷️ Type
${roomType}

📅 Check-In
${checkIn}

📅 Check-Out
${checkOut}

👨 Adults : ${adults}
🧒 Children : ${children}

💰 Amount
₹${total}

━━━━━━━━━━━━━━━━━━

✅ Please prepare the room before guest arrival.

🏨 HOTEL STAR PALACE`;
};

// ===============================
// CHECK-IN REMINDER
// ===============================

export const checkInReminderTemplate = ({
  customerName,
  bookingId,
  roomTitle,
  checkIn,
}) => {
  return `🏨 *HOTEL STAR PALACE*

Hello *${customerName}*,

⏰ Friendly Reminder

Tomorrow is your Check-In.

━━━━━━━━━━━━━━━━━━

🆔 Booking ID
${bookingId}

🛏️ Room
${roomTitle}

📅 Check-In
${checkIn}

🕛 Reporting Time
12:00 PM

📍 Manda Road, Khatu

We wish you a pleasant stay.

See you soon 😊`;
};

// ===============================
// CHECK-OUT THANK YOU
// ===============================

export const thankYouTemplate = ({
  customerName,
}) => {
  return `🙏 *Thank You*

Dear *${customerName}*,

Thank you for staying at
*Hotel Star Palace.*

We hope you enjoyed your stay.

⭐ We'd love to hear your feedback.

Have a safe journey.

Regards,
Hotel Star Palace`;
};