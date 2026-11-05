import { supabase } from './supabase';

interface SendAbsentAlertParams {
  phone: string;
  studentName: string;
  subject?: string;
  date?: string;
}

export const sendAbsentWhatsAppAlert = async ({
  phone,
  studentName,
  subject = "Class",
  date
}: SendAbsentAlertParams) => {
  if (!phone || !studentName) {
    console.warn("Phone or Student Name missing for WhatsApp alert");
    return { success: false, error: "Missing required fields" };
  }

  // Format today's date if not passed (e.g., "3 Nov")
  const formattedDate = date || new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        phone,
        studentName,
        subject,
        date: formattedDate,
      },
    });

    if (error) {
      console.error("WhatsApp Edge Function error:", error);
      return { success: false, error };
    }

    console.log("WhatsApp Absent alert delivered:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Failed to invoke WhatsApp service:", err);
    return { success: false, error: err };
  }
};