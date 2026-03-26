import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

console.log("GEMINI_API loaded:", Boolean(process.env.GEMINI_API));
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API});

async function main() {


//   const response = await ai.models.generateContent({
//     model: "gemini-3-flash-preview",
    // contents: "what is in the weather today!",
    
//     config: {
//         temperature:0.5,
//       systemInstruction: "You are a chat support bot whose work is only to respond to food related queries DO NOT GIVE ANSWERS ELSEWISE!!!",
//     },
//   });
//   console.log(response.text);



    // USING HISTORY
    

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: [
        {
            role: "user",
            parts: [{ text: "What is in the menu today" }],
        },
        {
            role: "model",
            parts: [{ text: "Great to meet you. Would you like to have some Indian food?" }],
        },
        ],
  });

  const response1 = await chat.sendMessage({
    message: "Do you have butter nan and paneer kadhai.",
  });
  console.log("Chat response 1:", response1.text);

  const response2 = await chat.sendMessage({
    message: "Bring that then",
  });
  console.log("Chat response 2:", response2.text);


}

 main();