import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const port = 4010;
const sample = await readFile(new URL("../public/card-art/editorial.jpg", import.meta.url));

const plan = {
  summary: "A low horizon, reflective water, a long directional line and quiet evening light.",
  anchors: ["low horizon", "long directional line", "reflective surface", "distant silhouette"],
  palette: ["#151513", "#E26B32", "#8FA8B2", "#F3F0E8"],
  light: "low warm directional light",
  emotionalTemperature: "quiet, distant and cinematic",
  title: "After the Horizon",
  episodeTitle: "The Long Return",
  phrase: "DISTANT LIGHT",
  panels: [
    { key: "lower", aspectRatio: "16:9", prompt: "A restrained abstract continuation with a low horizon and a single warm directional line." },
    { key: "perception", aspectRatio: "16:9", prompt: "Heightened perception of the horizon, reflected light and spatial rhythm." },
    { key: "memory", aspectRatio: "16:9", prompt: "Soft atmospheric memory with eroded silhouettes and distant light." },
    { key: "structure", aspectRatio: "16:9", prompt: "Geometric structural abstraction based on the long line, horizon and reflection." },
    { key: "hybrid", aspectRatio: "16:9", prompt: "Hybrid abstraction combining quiet recognisable traces with bold reduced geometry." },
    { key: "collage", aspectRatio: "3:4", prompt: "Vertical surreal pop collage with a black-and-white reality anchor and one impossible giant object." },
    { key: "poster", aspectRatio: "3:4", prompt: "Vertical 3:4 watercolor art poster. Asymmetric field, a warm directional horizon, pigment pooling and one silhouette dissolving into paper. Large condensed uppercase title AFTER THE HORIZON aligned with the horizon." },
  ],
};

function sendJson(response, value) {
  const body = JSON.stringify(value);
  response.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

const server = createServer((request, response) => {
  if (request.method !== "POST") {
    response.writeHead(405).end();
    return;
  }

  request.resume();
  request.on("end", () => {
    if (request.url === "/v1/chat/completions") {
      sendJson(response, { choices: [{ message: { content: JSON.stringify(plan) } }] });
      return;
    }
    if (request.url === "/v1/image_generation") {
      sendJson(response, { data: { image_base64: [sample.toString("base64")] } });
      return;
    }
    response.writeHead(404).end();
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock MiniMax listening on http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
