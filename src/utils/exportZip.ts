import JSZip from "jszip";

export interface ProjectFile {
  path: string;
  content: string;
}

export async function downloadProjectZip(
  files: ProjectFile[],
  zipName = "project.zip"
): Promise<void> {
  const zip = new JSZip();

  for (const { path, content } of files) {
    zip.file(path, content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
