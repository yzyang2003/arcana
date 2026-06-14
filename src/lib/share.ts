export async function shareResult(data: { title: string; text: string; url?: string }) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${data.title}\n${data.text}${data.url ? '\n' + data.url : ''}`);
    return true;
  } catch {
    return false;
  }
}
