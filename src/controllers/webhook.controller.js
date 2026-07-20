import crypto from "crypto";

import Payment from "../models/payment.model.js";
import PendingPayment from "../models/PendingPayment.model.js";

import { createBookingService } from "../services/booking.service.js";


// ==========================================
// RAZORPAY WEBHOOK
// POST /api/webhook/razorpay
// ==========================================

export const razorpayWebhook = async (req, res) => {

  try {

    console.log("🔥 Razorpay webhook received");


    const signature = req.headers["x-razorpay-signature"];


    // ==========================
    // VERIFY SIGNATURE
    // ==========================

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(req.body.toString())
      .digest("hex");


    if (signature !== expectedSignature) {

      return res.status(400).json({
        success:false,
        message:"Invalid webhook signature",
      });

    }



    // ==========================
    // PARSE BODY
    // ==========================

    const payload = JSON.parse(
      req.body.toString()
    );


    const event = payload.event;



    // ==================================================
    // PAYMENT SUCCESS
    // ==================================================

    if(event === "payment.captured"){


      const razorpayPayment =
        payload.payload.payment.entity;


      const paymentId = razorpayPayment.id;

      const orderId = razorpayPayment.order_id;



      console.log(
        "Payment Captured:",
        paymentId
      );



      // Duplicate check

      const existingPayment =
        await Payment.findOne({
          paymentId
        });



      if(existingPayment){

        return res.status(200).json({
          success:true,
          message:"Already processed",
        });

      }



      // Find pending payment

      const pendingPayment =
        await PendingPayment.findOne({
          orderId
        });



      if(!pendingPayment){

        return res.status(200).json({
          success:true,
          message:"Pending payment not found",
        });

      }




      // ==========================
      // SAVE PAYMENT FIRST
      // ==========================


      const payment = await Payment.create({

        paymentId,

        orderId,


        bookingId:null,


        customerName:
          pendingPayment.customerName,


        phone:
          pendingPayment.phone,


        email:
          pendingPayment.email,


        amount:
          pendingPayment.totalAmount,


        currency:"INR",


        gateway:"razorpay",


        method:"online",


        status:"success",


        paidAt:new Date(),

      });





      try{


        // ==========================
        // CREATE BOOKING
        // ==========================


        const booking =
          await createBookingService({

            userId:
              pendingPayment.userId,


            customerName:
              pendingPayment.customerName,


            phone:
              pendingPayment.phone,


            email:
              pendingPayment.email,


            roomId:
              pendingPayment.roomId,


            adults:
              pendingPayment.adults,


            children:
              pendingPayment.children,


            childrenAges:
              pendingPayment.childrenAges,


            specialRequest:
              pendingPayment.specialRequest,



            checkIn:
              pendingPayment.checkIn,


            checkOut:
              pendingPayment.checkOut,



            price:
              pendingPayment.price,


            nights:
              pendingPayment.nights,


            subtotal:
              pendingPayment.subtotal,


            gstPercentage:
              pendingPayment.gstPercentage,


            gstAmount:
              pendingPayment.gstAmount,


            totalAmount:
              pendingPayment.totalAmount,



            paymentStatus:"paid",


            paymentMethod:"razorpay",


            bookingSource:"website",



            paymentId,


            orderId,


            paymentSignature:"webhook",


          });






        // ==========================
        // UPDATE PAYMENT BOOKING ID
        // ==========================


        payment.bookingId =
          booking._id;


        await payment.save();




        // remove pending payment

        await PendingPayment.findByIdAndDelete(
          pendingPayment._id
        );



        console.log(
          "Booking Created:",
          booking._id
        );



      }

      catch(error){


        console.log(
          "Booking creation failed after payment:",
          error
        );


        // Payment already saved
        // bookingId remains null

      }



    }





    // ==================================================
    // PAYMENT FAILED
    // ==================================================


    if(event === "payment.failed"){



      const razorpayPayment =
        payload.payload.payment.entity;



      const paymentId =
        razorpayPayment.id;



      console.log(
        "Payment Failed:",
        paymentId
      );



      const existingPayment =
        await Payment.findOne({
          paymentId
        });



      if(!existingPayment){


        const pendingPayment =
          await PendingPayment.findOne({
            orderId:
              razorpayPayment.order_id
          });




        await Payment.create({


          paymentId,


          orderId:
            razorpayPayment.order_id,



          bookingId:null,



          customerName:
            pendingPayment?.customerName ||
            "Unknown",



          phone:
            pendingPayment?.phone ||
            "-",



          email:
            pendingPayment?.email ||
            "",



          amount:
            (razorpayPayment.amount || 0) / 100,



          currency:
            razorpayPayment.currency ||
            "INR",



          gateway:"razorpay",



          method:"online",



          status:"failed",



          failureReason:
            razorpayPayment.error_description ||
            "Payment failed",



          paidAt:null,


        });




        if(pendingPayment){

          pendingPayment.status =
            "failed";


          await pendingPayment.save();

        }



      }



    }




    return res.status(200).json({
      success:true,
    });



  }

  catch(error){


    console.log(
      "Webhook Error:",
      error
    );


    return res.status(500).json({

      success:false,

      message:error.message,

    });


  }


};