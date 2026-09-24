import React from "react";
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="max-w-lg mx-auto p-8 space-y-4">
        <h1 className="text-xl font-bold">No se pudo mostrar esta pantalla</h1>
        <p>
          Tus datos guardados siguen disponibles. Recarga para volver a
          intentarlo.
        </p>
        <button className="input-base" onClick={() => location.reload()}>
          Recargar
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
