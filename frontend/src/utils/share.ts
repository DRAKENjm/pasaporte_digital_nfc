export async function shareLink(title: string, text: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "Compartido";
    } catch (e: any) {
      if (e.name === "AbortError") return "";
    }
  }
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "Enlace copiado para compartir";
  }
  window.prompt("Copia el enlace para compartir:", url);
  return "";
}
