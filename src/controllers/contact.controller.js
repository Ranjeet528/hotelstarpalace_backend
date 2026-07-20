import Contact from "../models/contact.model.js";

// =====================================
// CREATE CONTACT MESSAGE
// POST /api/contact
// =====================================
export const createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
    } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      contact,
    });

  } catch (error) {
    console.log("Create Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// GET ALL CONTACTS
// GET /api/contact
// =====================================
export const getAllContacts = async (req, res) => {
  try {

    const contacts = await Contact.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: contacts.length,
      contacts,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// GET SINGLE CONTACT
// GET /api/contact/:id
// =====================================
export const getContact = async (req, res) => {
  try {

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      contact,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// MARK AS READ
// PATCH /api/contact/:id/read
// =====================================
export const markAsRead = async (req, res) => {
  try {

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        status: "read",
      },
      {
        new: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Marked as read",
      contact,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =====================================
// DELETE CONTACT
// DELETE /api/contact/:id
// =====================================
export const deleteContact = async (req, res) => {
  try {

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await contact.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};