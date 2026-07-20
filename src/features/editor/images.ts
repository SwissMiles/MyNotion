/** Read an image file into a data URI, downscaling big photos so the
 *  persisted state stays small. */
export async function fileToDataUri(file: File): Promise<string> {
  const MAX_DIM = 1400;
  const KEEP_ORIGINAL_BYTES = 300 * 1024;
  const readAsDataUri = () =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const original = await readAsDataUri();
  if (file.size <= KEEP_ORIGINAL_BYTES) return original;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(original);
    img.src = original;
  });
}
