import { API_ENDPOINTS } from "../../config/apiConfig";
import { apiRequest } from "../apiClient";
import {
  isBrowserEnvironment,
  readOutbox,
  writeOutbox,
} from "./localSheetStorage";
import { generateId } from "./normalizeSheet";

let hasRegisteredOnlineSyncListener = false;
let isFlushingOutbox = false;

const markOperationSynced = (opId) => {
  const remaining = readOutbox().filter((op) => op.opId !== opId);
  writeOutbox(remaining);
};

const syncSingleOperation = async (operation) => {
  await apiRequest(API_ENDPOINTS.outboxSync, {
    method: "POST",
    body: { operations: [operation] },
  });
};

export const enqueueOperation = (type, sheet, payload = {}) => {
  const operation = {
    opId: generateId("op"),
    type,
    sheetId: sheet.id,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  writeOutbox([...readOutbox(), operation]);
};

export const flushOutbox = async () => {
  if (
    !isBrowserEnvironment() ||
    isFlushingOutbox ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return;
  }

  const pendingOperations = readOutbox();
  if (pendingOperations.length === 0) return;

  isFlushingOutbox = true;

  try {
    for (const operation of pendingOperations) {
      try {
        await syncSingleOperation(operation);
        markOperationSynced(operation.opId);
      } catch {
        break;
      }
    }
  } finally {
    isFlushingOutbox = false;
  }
};

export const initBackgroundSync = () => {
  if (!isBrowserEnvironment() || hasRegisteredOnlineSyncListener) return;

  hasRegisteredOnlineSyncListener = true;
  window.addEventListener("online", () => {
    flushOutbox();
  });

  flushOutbox();
};
