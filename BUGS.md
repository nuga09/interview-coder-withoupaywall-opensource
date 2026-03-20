# Bug Report & Fixes

## Bug 1 — Typo: UNAUTHORIZED event never fires
**File:** `electron/preload.ts` line 7  
**Severity:** Critical  

**Problem:** The `UNAUTHORIZED` event string was `"procesing-unauthorized"` (missing `s`), while the main process emits `"processing-unauthorized"`. The renderer never received unauthorized events.

**Fix:** Changed `"procesing-unauthorized"` → `"processing-unauthorized"`

---

## Bug 2 — Duplicate `app.requestSingleInstanceLock()` call
**File:** `electron/main_mkswindowTransparent.ts`  
**Severity:** Critical  

**Problem:** `requestSingleInstanceLock()` was called twice. The first call (line ~176) correctly acquires the lock. The second call (line ~598) wrapped the `window-all-closed` handler in its `else` block — meaning if the second call ever returned `false`, the app would quit AND `window-all-closed` would never be registered.

**Fix:** Removed the second `requestSingleInstanceLock()` call and moved `window-all-closed` to be registered unconditionally.

---

## Bug 3 — `second-instance` handler registered twice
**File:** `electron/main_mkswindowTransparent.ts`  
**Severity:** Medium  

**Problem:** `app.on("second-instance", ...)` was registered twice — once inside the `gotTheLock` else block (lines ~181–189), and again as a standalone handler (lines ~584–595). Both ran when a second instance was launched.

**Fix:** Removed the duplicate standalone `second-instance` handler; the one in the `gotTheLock` block remains.

---

## Bug 4 — `onDebugSuccess` listener never removed (memory leak)
**File:** `electron/preload.ts` lines 83–90  
**Severity:** Medium  

**Problem:** The cleanup function created a *new* anonymous arrow function `(_event, data) => callback(data)` instead of referencing the original listener. Since `ipcRenderer.removeListener` matches by reference, the original listener was never removed, causing a memory leak every time the component re-mounted.

**Fix:** Saved the listener as `const subscription = ...` and passed the same reference to both `ipcRenderer.on` and `ipcRenderer.removeListener`.

---

## Bug 5 — Missing `"openExternal"` IPC handler
**File:** `electron/preload.ts` line 220–221  
**Severity:** Low  

**Problem:** `openExternal` in the preload called `ipcRenderer.invoke("openExternal", url)` but no IPC handler named `"openExternal"` existed in `ipcHandlers.ts`. The existing handler was named `"open-external-url"`. This would silently fail or throw an unhandled promise rejection.

**Fix:** Changed `"openExternal"` → `"open-external-url"` to match the registered handler.
