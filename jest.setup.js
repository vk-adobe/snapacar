// Suppress the expo winter runtime import.meta error in Jest
// by providing a no-op stub for the registry before any test modules load.
global.__ExpoImportMetaRegistry = {};
