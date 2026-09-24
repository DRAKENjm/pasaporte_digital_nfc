import React, { useState, useEffect } from "react";
import { QRScanner } from "../../components/nfc/QRScanner";
import { useNFCReader } from "../../hooks/useNFCReader";
import api from "../../services/api";
import { nfcService } from "../../services/nfcService";
import { useUI } from "../../hooks/useUI";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { ScanLine, CheckCircle2 } from "lucide-react";

export const CommerceValidar: React.FC = () => {
  const nfc = useNFCReader();
  const [locales, setLocales] = useState<any[]>([]);
  useEffect(() => {
    api
      .get("/establishments/me/locales")
      .then((r) => {
        setLocales(r.data.data);
        setEstablecimientoId(r.data.data[0]?.id || "");
      })
      .catch(() => showToast("No se pudieron cargar tus locales", "error"));
  }, []);
  const [qr, setQr] = useState("");
  const [uid, setUid] = useState("");
  const [establecimientoId, setEstablecimientoId] = useState(
    () => localStorage.getItem("comercio_establecimiento_id") || "",
  );
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { showToast } = useUI();

  const validar = async () => {
    if ((!uid.trim() && !qr) || !establecimientoId.trim()) {
      showToast("Completa UID y ID del establecimiento", "error");
      return;
    }
    localStorage.setItem(
      "comercio_establecimiento_id",
      establecimientoId.trim(),
    );
    setLoading(true);
    setLastResult(null);
    try {
      const result = qr
        ? (
            await api.post("/nfc/validar-qr", {
              token: qr,
              establecimiento_id: establecimientoId.trim(),
            })
          ).data
        : await nfcService.validarNfc(
            uid.trim().toUpperCase(),
            establecimientoId.trim(),
          );
      setLastResult(result?.data ?? result);
      showToast("¡Sello acreditado!", "success");
      setUid("");
      setQr("");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error en validación", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-amber-500" />
          Validar visita
        </h1>
        <p className="text-sm text-muted mt-1">
          Ingresa el UID de la tarjeta NFC del cliente (o el que muestre el QR
          de respaldo).
        </p>
      </div>

      <QRScanner
        onScanCode={(code) => {
          setQr(code);
          setUid("");
          showToast(
            "QR leído. Selecciona el local y confirma el sello.",
            "info",
          );
        }}
      />
      <button
        className="input-base"
        onClick={() =>
          nfc.isScanning
            ? nfc.stopScan()
            : nfc.startScan((result) => {
                if (!result.serialNumber) {
                  showToast("La etiqueta no expone un UID. Usa QR.", "error");
                  return;
                }
                setUid(result.serialNumber.toUpperCase());
                setQr("");
              })
        }
      >
        {nfc.isScanning ? "Detener NFC" : "Leer tarjeta NFC"}
      </button>
      {nfc.error && (
        <p role="alert" className="text-red-500 text-sm">
          {nfc.error}
        </p>
      )}
      {qr && (
        <p className="text-sm text-sky-500">
          QR preparado para validación{" "}
          <button onClick={() => setQr("")}>· Cancelar</button>
        </p>
      )}
      <div className="card space-y-4">
        <label className="block text-sm">
          Establecimiento
          <select
            className="input-base mt-1"
            value={establecimientoId}
            onChange={(e) => setEstablecimientoId(e.target.value)}
          >
            <option value="">Selecciona un local</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {l.razon_social}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="UID tarjeta NFC"
          value={uid}
          onChange={(e) => {
            setUid(e.target.value);
            setQr("");
          }}
          placeholder="04:A1:B2:C3:..."
          autoCapitalize="characters"
        />
        <Button
          fullWidth
          size="lg"
          loading={loading}
          onClick={validar}
          className="!bg-amber-500 hover:!bg-amber-400"
        >
          Confirmar sello
        </Button>
      </div>

      {lastResult && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
          <p className="font-semibold text-emerald-600 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Validación exitosa
          </p>
          <p className="text-sm">
            Puntos:{" "}
            <strong>
              +
              {lastResult.puntos_acreditados ??
                lastResult.pointsEarned ??
                lastResult.puntos_ganados ??
                "—"}
            </strong>
          </p>
          {(lastResult.usuario || lastResult.user) && (
            <p className="text-sm text-muted">
              Cliente: {(lastResult.usuario || lastResult.user)?.nombres}{" "}
              {(lastResult.usuario || lastResult.user)?.apellidos}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
