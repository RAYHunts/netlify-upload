import { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
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

    // Extract MIME type and base64 data
    const [mimeTypePart, base64Data] = imageData.split(",");
    const mimeType = mimeTypePart.match(/data:([^;]+)/)?.[1] || "image/jpeg";

    if (!base64Data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid base64 image data" }),
      };
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "File too large. Maximum size is 5MB" }),
      };
    }

    // Generate unique filename
    const fileId = randomBytes(16).toString("hex");
    const fileExtension = path.extname(filename) || ".jpg";
    const uniqueFilename = `${fileId}${fileExtension}`;

    // Get Netlify Blob store
    const store = getStore("image-uploads");

    // Upload to Netlify Blob
    await store.set(uniqueFilename, imageBuffer.buffer, {
      metadata: {
        originalName: filename,
        mimeType: mimeType,
        uploadedAt: new Date().toISOString(),
        fileId: fileId,
        size: imageBuffer.length.toString(),
      },
    });

    // Generate the blob URL for retrieval
    const baseUrl = event.headers.host?.includes("localhost") || event.headers.host?.includes("127.0.0.1") ? `http://${event.headers.host}` : `https://${event.headers.host}`;

    const imageUrl = `${baseUrl}/.netlify/functions/get-image?filename=${uniqueFilename}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Image uploaded successfully to Netlify Blob",
        fileId,
        filename: uniqueFilename,
        originalName: filename,
        size: imageBuffer.length,
        mimeType: mimeType,
        url: imageUrl,
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
