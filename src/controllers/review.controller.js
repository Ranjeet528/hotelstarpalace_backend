import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import Room from "../models/room.model.js";

// ============================================
// UPDATE ROOM RATING
// ============================================

const updateRoomRating = async (roomId) => {
  const reviews = await Review.find({
    roomId,
    status: "approved",
  });

  const totalReviews = reviews.length;

  let averageRating = 0;

  if (totalReviews > 0) {
    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    averageRating = Number(
      (totalRating / totalReviews).toFixed(1)
    );
  }

  await Room.findByIdAndUpdate(roomId, {
    averageRating,
    totalReviews,
  });
};

// ============================================
// CREATE REVIEW
// ============================================

export const createReview = async (req, res) => {
  try {

    const {
      roomId,
      customerName,
      email,
      rating,
      title,
      review,
    } = req.body;



    // ==========================
    // VALIDATION
    // ==========================

    if (!roomId) {

      return res.status(400).json({
        success: false,
        message: "Room is required",
      });

    }



    if (!customerName || customerName.trim().length < 3) {

      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });

    }



    if (!rating || rating < 1 || rating > 5) {

      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });

    }



    if (!title || title.trim().length < 3) {

      return res.status(400).json({
        success: false,
        message: "Review title is required",
      });

    }



    if (!review || review.trim().length < 5) {

      return res.status(400).json({
        success: false,
        message: "Review message is required",
      });

    }





    // ==========================
    // CHECK ROOM EXIST
    // ==========================

    const roomExist = await Room.findById(roomId);



    if (!roomExist) {

      return res.status(404).json({
        success: false,
        message: "Room not found",
      });

    }







    // ==========================
    // CREATE REVIEW
    // ==========================

    const newReview = await Review.create({

      roomId,


      customerName: customerName.trim(),


      email: email?.trim() || "",


      rating: Number(rating),


      title: title.trim(),


      review: review.trim(),



      // Admin approval required
      status: "pending",



      // No booking verification
      isVerified: false,

    });







    return res.status(201).json({

      success: true,

      message:
        "Review submitted successfully. Waiting for admin approval.",

      data: newReview,

    });




  } catch (error) {


    console.log(
      "Create Review Error:",
      error
    );



    return res.status(500).json({

      success: false,

      message: error.message,

    });


  }
};

// ============================================
// GET ROOM REVIEWS (PUBLIC)
// ============================================


export const getRoomReviews = async (req, res) => {

  try {

    const { roomId } = req.params;


    const reviews = await Review.find({

      roomId,

      status: "approved",

    })
    .sort({
      createdAt: -1,
    })
    .lean();




    // =========================
    // RATING CALCULATION
    // =========================

    const totalReviews = reviews.length;


    let averageRating = 0;


    if (totalReviews > 0) {

      const totalRating = reviews.reduce(
        (sum, item) => sum + item.rating,
        0
      );


      averageRating = Number(
        (totalRating / totalReviews).toFixed(1)
      );

    }




    // =========================
    // RATING BREAKDOWN
    // =========================

    const breakdown = {

      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,

    };



    reviews.forEach((item) => {

      breakdown[item.rating]++;

    });





    return res.status(200).json({

      success: true,


      data: reviews,


      averageRating,


      totalReviews,


      breakdown,

    });



  }
  catch(error) {


    console.log(
      "Get Room Reviews Error:",
      error
    );


    return res.status(500).json({

      success:false,

      message:error.message,

    });


  }

};


// ============================================
// GET ALL REVIEWS (ADMIN)
// ============================================

export const getAllReviews = async (req, res) => {
  try {


    const {
      status = "all",
      page = 1,
      limit = 10,
    } = req.query;





    // ==========================
    // FILTER
    // ==========================

    const filter = {};



    if (status !== "all") {

      filter.status = status;

    }






    // ==========================
    // TOTAL COUNT
    // ==========================

    const total = await Review.countDocuments(
      filter
    );







    // ==========================
    // FETCH REVIEWS
    // ==========================

    const reviews = await Review.find(filter)


      .populate(
        "roomId",
        "title roomType images averageRating totalReviews"
      )


      .sort({

        createdAt:-1

      })


      .skip(
        (Number(page)-1) * Number(limit)
      )


      .limit(
        Number(limit)
      );








    return res.status(200).json({

      success:true,


      total,


      page:Number(page),


      totalPages:Math.ceil(
        total / Number(limit)
      ),


      data:reviews,


    });





  }
  catch(error){


    console.log(
      "Get All Reviews Error:",
      error
    );



    return res.status(500).json({

      success:false,

      message:error.message,

    });


  }
};

// ============================================
// APPROVE REVIEW
// ============================================

export const approveReview = async (req, res) => {
     console.log("Approve Review API Hit");
  console.log(req.params);
  try {


    const review = await Review.findById(req.params.id);



    if (!review) {

      return res.status(404).json({

        success:false,

        message:"Review not found",

      });

    }





    if (review.status === "approved") {

      return res.status(400).json({

        success:false,

        message:"Review already approved",

      });

    }






    // ==========================
    // APPROVE REVIEW
    // ==========================

    review.status = "approved";


    await review.save();






    // ==========================
    // UPDATE ROOM RATING
    // ==========================

    await updateRoomRating(
      review.roomId
    );






    return res.status(200).json({

      success:true,

      message:
        "Review approved successfully",


      data:review,


    });



  }
  catch(error){


    console.log(
      "Approve Review Error:",
      error
    );



    return res.status(500).json({

      success:false,

      message:error.message,

    });


  }
};

// ============================================
// REJECT REVIEW
// ============================================

export const rejectReview = async (req, res) => {
  try {

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.status = "rejected";

    await review.save();

    // Update Room Rating
    await updateRoomRating(review.roomId);

    return res.status(200).json({
      success: true,
      message: "Review rejected successfully",
      data: review,
    });

  } catch (error) {

    console.log("Reject Review Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ============================================
// DELETE REVIEW
// ============================================

export const deleteReview = async (req, res) => {
  try {

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const roomId = review.roomId;

    await Review.findByIdAndDelete(review._id);

    // Update room rating after delete
    await updateRoomRating(roomId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });

  } catch (error) {

    console.log("Delete Review Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};