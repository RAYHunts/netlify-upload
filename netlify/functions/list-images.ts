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
    // Get Netlify Blob store
    const store = getStore("image-uploads");

    // List all blobs
    const { blobs } = await store.list();

    const imageList = await Promise.all(
      blobs.map(async (blob) => {
        const metadataResponse = await store.getMetadata(blob.key);
        const metadata = metadataResponse?.metadata;

        const baseUrl = new URL(req.url).origin;

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

    return new Response(
      JSON.stringify({
        success: true,
        images: imageList,
        count: imageList.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("List images error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to list images",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

export default handler;
