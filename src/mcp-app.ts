import { App } from "@modelcontextprotocol/ext-apps";

const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refresh-btn");

if (!statusEl || !refreshBtn) {
  throw new Error("Missing required UI elements.");
}

// #region agent log
fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
    location:"src/mcp-app.ts:13",
    message:"ui_init",
    data:{
      href: window.location.href,
      hasParent: window.parent !== window,
      referrer: document.referrer || null
    },
    timestamp:Date.now(),
    sessionId:"debug-session",
    runId:"repro1",
    hypothesisId:"H1"
  })
}).catch(()=>{});
// #endregion agent log

const app = new App({ name: "MCP Apps Hello World", version: "1.0.0" });

try {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      location:"src/mcp-app.ts:28",
      message:"app_connect_start",
      data:{},
      timestamp:Date.now(),
      sessionId:"debug-session",
      runId:"repro1",
      hypothesisId:"H1"
    })
  }).catch(()=>{});
  // #endregion agent log
  app.connect();
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      location:"src/mcp-app.ts:40",
      message:"app_connect_called",
      data:{},
      timestamp:Date.now(),
      sessionId:"debug-session",
      runId:"repro1",
      hypothesisId:"H1"
    })
  }).catch(()=>{});
  // #endregion agent log
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      location:"src/mcp-app.ts:53",
      message:"app_connect_error",
      data:{message},
      timestamp:Date.now(),
      sessionId:"debug-session",
      runId:"repro1",
      hypothesisId:"H1"
    })
  }).catch(()=>{});
  // #endregion agent log
}

app.ontoolresult = (result) => {
  const text = result.content?.find((item) => item.type === "text")?.text;
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      location:"src/mcp-app.ts:65",
      message:"tool_result",
      data:{hasText: Boolean(text)},
      timestamp:Date.now(),
      sessionId:"debug-session",
      runId:"repro1",
      hypothesisId:"H2"
    })
  }).catch(()=>{});
  // #endregion agent log
  statusEl.textContent = text ?? "Hello from the UI.";
};

refreshBtn.addEventListener("click", async () => {
  statusEl.textContent = "Calling tool...";
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      location:"src/mcp-app.ts:75",
      message:"tool_call_start",
      data:{name:"hello-world"},
      timestamp:Date.now(),
      sessionId:"debug-session",
      runId:"repro1",
      hypothesisId:"H2"
    })
  }).catch(()=>{});
  // #endregion agent log
  try {
    const result = await app.callServerTool({
      name: "hello-world",
      arguments: {},
    });
    const text = result.content?.find((item) => item.type === "text")?.text;
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        location:"src/mcp-app.ts:92",
        message:"tool_call_success",
        data:{hasText: Boolean(text)},
        timestamp:Date.now(),
        sessionId:"debug-session",
        runId:"repro1",
        hypothesisId:"H2"
      })
    }).catch(()=>{});
    // #endregion agent log
    statusEl.textContent = text ?? "Hello from the UI.";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/ca329fe8-e581-4ddd-aeba-af4e7618e3c2",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        location:"src/mcp-app.ts:107",
        message:"tool_call_error",
        data:{message},
        timestamp:Date.now(),
        sessionId:"debug-session",
        runId:"repro1",
        hypothesisId:"H2"
      })
    }).catch(()=>{});
    // #endregion agent log
    statusEl.textContent =
      "Tool call failed. Use the text response as fallback.";
  }
});
