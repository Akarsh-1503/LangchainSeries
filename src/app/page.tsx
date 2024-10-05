
"use client";
import { useEffect, useState, useRef } from "react";
// import {Howl} from 'howler';
const {Howl, Howler} = require('howler');
import { startDeepgramTTS } from "./api/chat/text-to-speech";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function Home() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  
  const getModelClassName = (model: string): string => (model === model && isPlaying ? " prominent-pulse" : "");


  
  const speaks = (text:string) => {
    if (window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
      const synth = window.speechSynthesis;
      const utterThis = new SpeechSynthesisUtterance(text);
      
      synth.speak(utterThis);
    }
  };

  const sendToBackend = async (message: string, modelKeyword?: string): Promise<void> => {
    setIsLoading(true);
    if (modelKeyword) setModel(modelKeyword);
    else if (!model) setModel("gemma2:2b");
console.log("above the try block")
    try {
console.log("inside the try block")


      stopRecording();
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, model: modelKeyword }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
     
      
      if(response.ok){
      
        const data = await response.json();
      
        if(data){
          speaks(data.data)
          console.log(data) 
        }
    
      }
     
console.log("end of the try block")

    } catch (error) {
console.log("inside the catch block")

     console.error("Error sending data to backend or playing audio:", error);
    }
    setIsLoading(false);
console.log("ending")

  };
 const renderModelBubble = (model: string, displayName: string, bgColor: string): JSX.Element => (
    <div className={`flex flex-col items-center model-bubble text-center${getModelClassName(model)}`}>
      {isLoading && model === model && <div className="loading-indicator"></div>}
      <div className={`w-48 h-48 flex items-center justify-center ${bgColor} text-white rounded-full`}>
        {displayName}
      </div>
    </div>
  );

  const handleResult = (event: any): void => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      interimTranscript += event.results[i][0].transcript;
    }
    setTranscript(interimTranscript);
    silenceTimerRef.current = setTimeout(() => {
      const words = interimTranscript.split(" ");
      const modelKeywords = [
        "gpt4",
        "gpt",
        "perplexity",
        "local mistral",
        "local llama",
        "mixture",
        "mistral",
        "llama",
        "GPT",
      ];
      const detectedModel = modelKeywords.find((keyword) =>
        words.slice(0, 3).join(" ").toLowerCase().includes(keyword)
      );
      setModel(detectedModel || "gemma2:2b");
      sendToBackend(interimTranscript, detectedModel);
      setTranscript("");
    }, 2000);
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
    setResponse("");
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.onresult = handleResult;
    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    recognitionRef.current.start();
  };

  useEffect(
    () => () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    },
    []
  );

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };
  
  const handleToggleRecording = () => {
    if (!isRecording && !isPlaying) startRecording();
    else if (isRecording) stopRecording();
  };

  
  return (
    
    <main className="flex h-screen flex-col items-center bg-gray-100">
      {(isRecording || transcript || response) && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full m-auto p-4 bg-white">
          <div className="flex justify-center items-center w-full">
            <div className="text-center">
              <p className="text-xl font-bold">{isRecording ? "Listening" : ""}</p>
              {transcript && (
                <div className="p-2 h-full mt-4 text-center">
                  <p className="text-lg mb-0">{transcript}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center h-screen w-full">
        <div className="w-full">
          <div className="grid grid-cols-3 gap-8 mt-10">
            {renderModelBubble("gpt", "GPT-3.5", "bg-indigo-500")}
            {renderModelBubble("gpt4", "GPT-4", "bg-teal-500")}
            {renderModelBubble("perplexity", "Perplexity", "bg-pink-500")}
            {renderModelBubble("local mistral", "Mistral-7B (Ollama)", "bg-purple-500")}
            <div className="flex flex-col items-center">
              <button
                onClick={handleToggleRecording}
                className={`m-auto flex items-center justify-center ${
                  isRecording ? "bg-red-500 prominent-pulse" : "bg-blue-500"
                } rounded-full w-48 h-48 focus:outline-none`}
              ></button>
            </div>
            {renderModelBubble("local llama", "Llama2 (Ollama)", "bg-red-500")}
            {renderModelBubble("mixture", "Mixtral (Perplexity)", "bg-orange-500")}
            {renderModelBubble("mistral", "Mistral-7B (Perplexity)", "bg-purple-500")}
            {renderModelBubble("llama", "Llama2 70B (Perplexity)", "bg-lime-500")}
          </div>
        </div>
      </div>
    </main>
  );
}