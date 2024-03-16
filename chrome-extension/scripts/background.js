const API_HOST = "http://localhost:5461";
const FRONTEND_HOST = "http://localhost:3000";

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request?.type === "summarize") {
    console.log("SUMMARIZE", request);
    
    // Grab credentials from storage
    const credentialsRecord = await chrome.storage.sync.get("credentials");
    if (!credentialsRecord) return;
    const { credentials } = credentialsRecord;

    // Enforce title and transcript data types
    if (
      !request.data ||
      typeof request.data.title !== "string" ||
      typeof request.data.transcript !== "string"
    ) {
      return;
    }

    const summaryId = await createSummary(
      request.data.title,
      request.data.transcript,
      credentials
    );

    chrome.tabs.create({
      url: FRONTEND_HOST + "/summary/" + encodeURIComponent(summaryId),
    });

    // request.data
  }
});

async function createSummary(title, transcript, credentials) {
  const { id } = await _fetchApi(
    "/v1/summary/create",
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        title,
        transcript,
      }),
    },
    credentials
  );
  return id;
}

async function _fetchApi(endpoint, init, credentials) {
  const req = await fetch(API_HOST + endpoint, {
    ...(init || {}),
    headers: {
      // inject auth header
      authorization: credentials
        ? `LazyAuth ${btoa(
            encodeURIComponent(credentials.username) +
              ":" +
              encodeURIComponent(credentials.password)
          )}`
        : undefined,
      ...(init?.headers || {}),
    },
  });
  const res = await req.json();

  if (res.error) {
    throw new Error("API Error: " + res.error);
  }

  return res.data;
}
