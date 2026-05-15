import fetch from "node-fetch";

const API_KEY = "AIzaSyBSttE3hVALRysbPDlJMUDllvsbNjdKJfw";

async function runGemini() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Jelaskan cara membuat website sederhana" }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();
  console.log(data.candidates[0].content.parts[0].text);
}

runGemini();