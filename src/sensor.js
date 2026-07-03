// เชื่อมเซนเซอร์นับ rep ผ่าน Web Bluetooth (UUID ตรงกับ firmware XIAO nRF52840)
// หมายเหตุ: Web Bluetooth ใช้ได้บน Chrome/Edge/Android — iOS Safari ไม่รองรับ
// (บน iPhone ให้เปิดแอปผ่านเบราว์เซอร์ "Bluefy")
import { useCallback, useEffect, useRef, useState } from "react";

const SERVICE = "f17e0001-8170-6f5e-4d3c-2b1a8b4c9e21";
const REP_CHAR = "f17e0002-8170-6f5e-4d3c-2b1a8b4c9e21";
const CTRL_CHAR = "f17e0003-8170-6f5e-4d3c-2b1a8b4c9e21";

export function useRepSensor(onReps) {
  const supported = typeof navigator !== "undefined" && !!navigator.bluetooth;
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");
  const cb = useRef(onReps);
  cb.current = onReps;
  const refs = useRef({ device: null, ctrl: null });

  const handleValue = useCallback((e) => {
    const v = e.target.value.getUint16(0, true); // little-endian uint16 (ตรงกับ write16 ใน firmware)
    if (cb.current) cb.current(v);
  }, []);

  const connect = useCallback(async () => {
    setError("");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "FitPedia-RepCounter" }],
        optionalServices: [SERVICE],
      });
      device.addEventListener("gattserverdisconnected", () => setConnected(false));
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE);
      const rep = await service.getCharacteristic(REP_CHAR);
      await rep.startNotifications();
      rep.addEventListener("characteristicvaluechanged", handleValue);
      try { refs.current.ctrl = await service.getCharacteristic(CTRL_CHAR); } catch { refs.current.ctrl = null; }
      refs.current.device = device;
      setDeviceName(device.name || "เซนเซอร์");
      setConnected(true);
    } catch (e) {
      if (e && e.name !== "NotFoundError") setError(e.message || "เชื่อมไม่สำเร็จ"); // ผู้ใช้กดยกเลิก = เงียบ
    }
  }, [handleValue]);

  const reset = useCallback(async () => {
    try { if (refs.current.ctrl) await refs.current.ctrl.writeValue(new Uint8Array([0])); } catch { /* ข้าม */ }
  }, []);

  const disconnect = useCallback(() => {
    try { refs.current.device?.gatt?.disconnect(); } catch { /* ข้าม */ }
    setConnected(false);
  }, []);

  useEffect(() => () => { try { refs.current.device?.gatt?.disconnect(); } catch { /* ข้าม */ } }, []);

  return { supported, connected, deviceName, error, connect, disconnect, reset };
}
