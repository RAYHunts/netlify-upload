import { getStore } from "@netlify/blobs";

const handler = async (req: Request) => {
  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Extract filename from query parameters
    const url = new URL(req.url);
    const filename = url.searchParams.get("filename");
    
    if (!filename) {
      return new Response(JSON.stringify({ error: "Filename parameter is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Netlify Blob store
    const store = getStore("image-uploads");

    // Get the file from blob storage
    const file = await store.get(filename, { type: "arrayBuffer" });
    const metadataResponse = await store.getMetadata(filename);
    const metadata = metadataResponse?.metadata;

    if (!file) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the image with proper headers
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": (metadata?.mimeType as string) || "image/jpeg",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Get image error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: "Failed to retrieve image",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

export default handler;
export { handler };
