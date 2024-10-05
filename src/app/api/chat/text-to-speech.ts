import fs from "fs";
import { createClient, LiveTTSEvents } from "@deepgram/sdk";


const live = async (fullMessage:string) => {
  const text = fullMessage;

  
  const deepgram = createClient(''); // Add Deepgram API Key before npm run

  const dgConnection = deepgram.speak.live({ model: "aura-asteria-en" });

  let audioBuffer = Buffer.alloc(0);

  dgConnection.on(LiveTTSEvents.Open, () => {
    console.log("Connection opened");

    dgConnection.sendText(text);

    dgConnection.flush();

    dgConnection.on(LiveTTSEvents.Close, () => {
      console.log("Connection closed");
    });

    dgConnection.on(LiveTTSEvents.Metadata, (data:Uint8Array) => {
      console.dir(data, { depth: null });
    });

    dgConnection.on(LiveTTSEvents.Audio, (data:Uint8Array) => {
      console.log("Deepgram audio data received");
      const buffer = Buffer.from(data);
      audioBuffer = Buffer.concat([audioBuffer, buffer]);
    });

    dgConnection.on(LiveTTSEvents.Flushed, () => {
      console.log("Deepgram Flushed");
      writeFile();
    });

    dgConnection.on(LiveTTSEvents.Error, (err:Error) => {
      console.error(err);
    });
  });

  const writeFile = () => {
    if (audioBuffer.length > 0) {
        
        fs.writeFile("./public/sounds/output.wav", audioBuffer, (err) => {
            if (err) {
              console.error("Error writing audio file:", err);
            } else {
              console.log("Audio file saved as output.mp3");
            }
          });
      audioBuffer = Buffer.alloc(0);
    }
  };
};


export const startDeepgramTTS = async (fullMessage: string)=>{
    live(fullMessage);
}