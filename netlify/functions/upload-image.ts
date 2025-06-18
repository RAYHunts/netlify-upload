import { Handler } from "@netlify/functions";
import { randomBytes } from "crypto";
import path from "path";

const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Check if body exists
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No file data received" }),
      };
    }

    // For this demo, we'll handle base64 encoded images
    // In production, you might want to integrate with cloud storage like AWS S3, Cloudinary, etc.

    let imageData: string;
    let filename: string;

    try {
      const bodyData = JSON.parse(event.body);
      imageData = bodyData.image;
      filename = bodyData.filename || "upload.jpg";
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON data" }),
      };
    }

    // Validate base64 image data
    if (!imageData || !imageData.startsWith("data:image/")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid image data format" }),
      };
    }

    // Extract base64 data
    const base64Data = imageData.split(",")[1];
    if (!base64Data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid base64 image data" }),
      };
    }

    // Generate unique filename
    const fileId = randomBytes(16).toString("hex");
    const fileExtension = path.extname(filename) || ".jpg";
    const uniqueFilename = `${fileId}${fileExtension}`;

    // In a real implementation, you would upload to cloud storage here
    // For this demo, we'll just simulate the upload
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Image uploaded successfully",
        fileId,
        filename: uniqueFilename,
        originalName: filename,
        size: Math.round(base64Data.length * 0.75), // Approximate file size
        url: `https://your-cdn.com/uploads/${uniqueFilename}`,
        uploadedAt: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: "Failed to upload image",
      }),
    };
  }
};

export { handler };
