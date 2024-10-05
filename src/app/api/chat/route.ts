
import dotenv from "dotenv";
import { Ollama } from "@langchain/community/llms/ollama";
import { createClient } from "@deepgram/sdk";
import fs from "fs/promises"; 
import { startDeepgramTTS } from "./text-to-speech";

dotenv.config();

interface ResponseData {
    data: string;
    contentType: string;
    model: string;
}

async function createAudio(fullMessage: string, voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer") {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  const text = "Hello, how can I help you today?";

  console.log("Entered Create Audio")
  const response = await deepgram.speak.request(
    { text },
    {
      model: "aura-asteria-en",
      encoding: "linear16",
      container: "wav",
    }
  );

  console.log("Exited Create Audio")

  const stream = await response.getStream();
  console.log("Entered get Header")

  const headers = await response.getHeaders();

  console.log("Exited get Header")

  if (stream) {
    const buffer = await getAudioBuffer(stream);
    
    fs.writeFile("./public/sounds/output.wav", buffer);


  } else {
    console.error("Error generating audio:", stream);
  }

  console.log("Streamed")

  if (headers) {
    console.log("Headers:", headers);
  }
};

const getAudioBuffer = async (response: ReadableStream<Uint8Array>): Promise<string> => {
    const reader = response.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  
    const dataArrayLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const dataArray = new Uint8Array(dataArrayLength);
    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
      dataArray.set(chunks[i], offset);
      offset += chunks[i].length;
    }
  
    return Buffer.from(dataArray.buffer).toString('base64');
  };



export async function POST(req: Request, res: Response): Promise<Response> {
    const body = await req.json();
console.log("In the backend protion")
    let message = body.message.toLowerCase();
    let modelName = body.model || "gpt";

    const removeFirstWord = (text: string) => text.includes(" ") ? text.substring(text.indexOf(" ") + 1) : "";
    message = removeFirstWord(message);

    let introMessage = "", base64Audio, voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "echo", gptMessage, fullMessage;

    const commonPrompt = "Be precise and concise, never respond in more than 1-2 sentences! " + message;
console.log(modelName)
    console.log("Going inside Ollama")

        const llm = new Ollama({
            baseUrl: "http://localhost:11434",
            model: "gemma2:2b",
        });
    console.log("Going outside Ollama")

        gptMessage = await llm.invoke(commonPrompt);
    console.log("Invoked llama")
console.log(gptMessage)
        introMessage = "Ollama Llama 2 here, ";
        voice = "fable";
    
    console.log("Creating audio")

    
    fullMessage = introMessage + gptMessage;
    
  const askQuestion = async (question: string) => {
    const questionResponse = await startDeepgramTTS(fullMessage);
  };

    base64Audio = createAudio(fullMessage, voice);
    console.log("Base64: ")
    console.log(base64Audio)
    
    askQuestion(fullMessage)
    
    console.log("Success Created audio")
    
return new Response(JSON.stringify({
    data: fullMessage,
    contentType: 'audio/wav',
    model: modelName
}), {
    status: 200,
    headers: { 'Content-Type': 'application/json'}
});

}
