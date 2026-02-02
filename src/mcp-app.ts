import { App } from "@modelcontextprotocol/ext-apps";

const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refresh-btn");

if (!statusEl || !refreshBtn) {
  throw new Error("Missing required UI elements.");
}

const app = new App({ name: "MCP Apps Hello World", version: "1.0.0" });

app.connect();

app.ontoolresult = (result) => {
  const text = result.content?.find((item) => item.type === "text")?.text;
  statusEl.textContent = text ?? "Hello from the UI.";
};

refreshBtn.addEventListener("click", async () => {
  statusEl.textContent = "Calling tool...";
  try {
    const result = await app.callServerTool({
      name: "hello-world",
      arguments: {},
    });
    const text = result.content?.find((item) => item.type === "text")?.text;
    statusEl.textContent = text ?? "Hello from the UI.";
  } catch (error) {
    statusEl.textContent =
      "Tool call failed. Use the text response as fallback.";
  }
});
