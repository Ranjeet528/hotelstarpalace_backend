import axios from "axios";

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ====================================================
// SEND WHATSAPP MESSAGE
// ====================================================

export const sendWhatsAppMessage = async (
  phone,
  message
) => {
  try {

    // If WhatsApp API is not configured
    if (!TOKEN || !PHONE_NUMBER_ID) {

      console.log(
        "⚠ WhatsApp Cloud API is not configured."
      );

      console.log("Recipient :", phone);

      console.log(message);

      return {
        success: false,
        message:
          "WhatsApp credentials not configured",
      };
    }

    // Convert phone number
    let formattedPhone = String(phone)
      .replace(/\D/g, "");

    if (
      !formattedPhone.startsWith("91")
    ) {
      formattedPhone =
        "91" + formattedPhone;
    }

    const response =
      await axios.post(

        `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,

        {
          messaging_product:
            "whatsapp",

          recipient_type:
            "individual",

          to: formattedPhone,

          type: "text",

          text: {
            preview_url: false,
            body: message,
          },
        },

        {
          headers: {

            Authorization:
              `Bearer ${TOKEN}`,

            "Content-Type":
              "application/json",

          },
        }
      );

    console.log(
      "✅ WhatsApp Sent Successfully"
    );

    return response.data;

  } catch (error) {

    console.error(
      "❌ WhatsApp Error"
    );

    console.error(
      error?.response?.data ||
      error.message
    );

    return {
      success: false,
      error:
        error?.response?.data ||
        error.message,
    };
  }
};

// ====================================================
// SEND CUSTOMER MESSAGE
// ====================================================

export const sendCustomerWhatsApp =
  async (
    phone,
    message
  ) => {

    return await sendWhatsAppMessage(
      phone,
      message
    );

  };

// ====================================================
// SEND ADMIN MESSAGE
// ====================================================

export const sendAdminWhatsApp =
  async (message) => {

    const adminPhone =
      process.env.ADMIN_PHONE;

    return await sendWhatsAppMessage(
      adminPhone,
      message
    );

  };