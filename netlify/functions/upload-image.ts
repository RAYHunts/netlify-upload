import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import { v4 as uuid } from "uuid";
import path from "path";

const handler = async (req: Request, context: Context) => {
  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get the request body as JSON
    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image: imageData, filename } = requestData;

    if (!imageData || !imageData.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid image data format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract MIME type and base64 data
    const [mimeTypePart, base64Data] = imageData.split(",");
    const mimeType = mimeTypePart.match(/data:([^;]+)/)?.[1] || "image/jpeg";

    if (!base64Data) {
      return new Response(JSON.stringify({ error: "Invalid base64 image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      return new Response(JSON.stringify({ error: "File too large. Maximum size is 5MB" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique filename
    const fileId = uuid();
    const fileExtension = path.extname(filename || "image.jpg") || ".jpg";
    const uniqueFilename = `${fileId}${fileExtension}`;

    // Get Netlify Blob store
    const store = getStore("image-uploads");

    // Upload to Netlify Blob
    await store.set(uniqueFilename, imageBuffer.buffer, {
      metadata: {
        originalName: filename || "unknown",
        mimeType: mimeType,
        uploadedAt: new Date().toISOString(),
        fileId: fileId,
        size: imageBuffer.length.toString(),
        country: context.geo?.country?.name || "Unknown",
      },
    });

    // Generate the blob URL for retrieval
    const baseUrl = new URL(req.url).origin;
    const imageUrl = `${baseUrl}/.netlify/functions/get-image?filename=${uniqueFilename}`;

    return new Response(JSON.stringify({
      success: true,
      message: "Image uploaded successfully to Netlify Blob",
      fileId,
      filename: uniqueFilename,
      originalName: filename || "unknown",
      size: imageBuffer.length,
      mimeType: mimeType,
      url: imageUrl,
      uploadedAt: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: "Failed to upload image",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

export default handler;
