import React, { useRef, useState, useEffect } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
export const QRScanner: React.FC<{ onScanCode: (code: string) => void }> = ({
  onScanCode,
}) => {
  const [code, setCode] = useState(""),
    [scanning, setScanning] = useState(false),
    [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null),
    controls = useRef<IScannerControls>(),
    generation = useRef(0);
  const stop = () => {
    generation.current++;
    controls.current?.stop();
    controls.current = undefined;
    setScanning(false);
  };
  useEffect(
    () => () => {
      generation.current++;
      controls.current?.stop();
    },
    [],
  );
  const start = async () => {
    stop();
    setError("");
    setScanning(true);
    const current = generation.current;
    try {
      const reader = new BrowserQRCodeReader();
      let found = false;
      const control = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" }, audio: false },
        video.current!,
        (result, _, c) => {
          if (result && !found && current === generation.current) {
            found = true;
            c.stop();
            stop();
            onScanCode(result.getText());
          }
        },
      );
      if (current !== generation.current) control.stop();
      else controls.current = control;
    } catch {
      setScanning(false);
      setError(
        "No se pudo abrir la cámara. Usa HTTPS, concede permiso o pega el código.",
      );
    }
  };
  return (
    <section className="card space-y-3">
      <h2 className="font-bold">Escanear QR del cliente</h2>
      <video
        ref={video}
        muted
        playsInline
        className={scanning ? "w-full max-h-64 rounded-xl" : "hidden"}
      />
      <button
        type="button"
        className="input-base"
        onClick={scanning ? stop : start}
      >
        {scanning ? "Detener cámara" : "Abrir cámara QR"}
      </button>
      <p role="alert" className="text-sm text-red-500">
        {error}
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) {
            onScanCode(code.trim());
            setCode("");
          }
        }}
      >
        <input
          aria-label="Código QR"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="También puedes pegar el código"
          className="input-base flex-1 min-w-0"
          required
        />
        <button className="px-3 rounded-xl bg-sky-600 text-white">
          Usar código
        </button>
      </form>
    </section>
  );
};
