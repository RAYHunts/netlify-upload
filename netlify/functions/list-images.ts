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
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Get Netlify Blob store
    const store = getStore("image-uploads");

    // List all blobs
    const { blobs } = await store.list();

    const imageList = await Promise.all(
      blobs.map(async (blob) => {
        const metadataResponse = await store.getMetadata(blob.key);
        const metadata = metadataResponse?.metadata;

        const baseUrl = event.headers.host?.includes("localhost") || event.headers.host?.includes("127.0.0.1") ? `http://${event.headers.host}` : `https://${event.headers.host}`;

        return {
          filename: blob.key,
          size: parseInt(metadata?.size as string) || 0,
          uploadedAt: metadata?.uploadedAt,
          originalName: metadata?.originalName,
          mimeType: metadata?.mimeType,
          fileId: metadata?.fileId,
          url: `${baseUrl}/.netlify/functions/get-image?filename=${blob.key}`,
        };
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        images: imageList,
        count: imageList.length,
      }),
    };
  } catch (error) {
    console.error("List images error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: "Failed to list images",
      }),
    };
  }
};

export { handler };
