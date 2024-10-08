
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");

    // Determine the file extension based on the content type
    let fileExtension = "png"; // Default to png
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      fileExtension = "jpg";
    } else if (contentType.includes("gif")) {
      fileExtension = "gif";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="image.${fileExtension}"`
    );
    res.setHeader("X-File-Extension", fileExtension); // Custom header to pass file extension to frontend

    // Stream the response to the client
    return new Promise((resolve, reject) => {
      response.body.pipe(res);
      response.body.on("error", reject);
      res.on("finish", resolve);
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    res.status(500).json({ error: "Error downloading image" });
  }
}
