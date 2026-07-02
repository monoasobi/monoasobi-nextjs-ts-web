export const getFileNum = (url: string) => {
  const decoded = decodeURIComponent(new URL(url).pathname);
  const stem = decoded.split("/").pop()?.split(".")[0] ?? "0";
  return parseInt(stem, 10);
};
