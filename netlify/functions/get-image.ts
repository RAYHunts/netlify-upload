import { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Extract filename from query parameters
    const filename = event.queryStringParameters?.filename;

    if (!filename) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Filename parameter is required" }),
      };
    }

    // Get Netlify Blob store
    const store = getStore("image-uploads");

    // Get the file from blob storage
    const file = await store.get(filename, { type: "arrayBuffer" });
    const metadataResponse = await store.getMetadata(filename);
    const metadata = metadataResponse?.metadata;

    if (!file) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "File not found" }),
      };
    }

    // Return the image with proper headers
    return {
      statusCode: 200,
      headers: {
        "Content-Type": (metadata?.mimeType as string) || "image/jpeg",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Length": Buffer.from(file).length.toString(),
        "Access-Control-Allow-Origin": "*",
      },
      body: Buffer.from(file).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Get image error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: "Failed to retrieve image",
      }),
    };
  }
};

export { handler };
