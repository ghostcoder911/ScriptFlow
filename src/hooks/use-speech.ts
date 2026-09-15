import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechLang } from "@/lib/types";

export type SpeechStatus = "idle" | "listening" | "unsupported" | "denied" | "error";

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechAvailable() {
  return Boolean(getCtor());
}

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>(() =>
    typeof window !== "undefined" && !isSpeechAvailable() ? "unsupported" : "idle"
  );
  const [lang, setLang] = useState<SpeechLang>("ml-IN");
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    recRef.current = null;
    setStatus((s) => (s === "listening" ? "idle" : s));
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let inter = "";
      let fin = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) fin += piece;
        else inter += piece;
      }
      if (fin) {
        setFinalText((prev) => (prev ? `${prev.trim()} ${fin.trim()}` : fin.trim()));
      }
      setInterim(inter);
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed") setStatus("denied");
      else setStatus("error");
      wantRef.current = false;
    };
    rec.onend = () => {
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          setStatus("idle");
        }
      } else {
        setStatus("idle");
      }
    };
    recRef.current = rec;
    wantRef.current = true;
    setInterim("");
    try {
      rec.start();
      setStatus("listening");
    } catch {
      setStatus("error");
    }
  }, [lang]);

  const clear = useCallback(() => {
    setFinalText("");
    setInterim("");
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return {
    status,
    lang,
    setLang,
    interim,
    finalText,
    start,
    stop,
    clear,
    supported: isSpeechAvailable(),
  };
}
