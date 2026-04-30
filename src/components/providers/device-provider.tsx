"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface DeviceContextType {
  deviceId: string | null;
}

const DeviceContext = createContext<DeviceContextType>({ deviceId: null });

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("doculearn_device_id");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("doculearn_device_id", id);
    }
    setDeviceId(id);
  }, []);

  return (
    <DeviceContext.Provider value={{ deviceId }}>
      {children}
    </DeviceContext.Provider>
  );
}

export const useDevice = () => useContext(DeviceContext);
