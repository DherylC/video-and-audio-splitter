import { useCallback, useState } from "react";
import { kindOf, probeDuration } from "../lib/media";

export function useFileQueue() {
  const [items, setItems] = useState([]);
  const [rejected, setRejected] = useState([]);

  const add = useCallback((fileList) => {
    const files = Array.from(fileList);
    const ok = files.map((file) => ({ id: crypto.randomUUID(), file, kind: kindOf(file), duration: null })).filter((i) => i.kind);
    setRejected(files.filter((f) => !kindOf(f)).map((f) => f.name));

    setItems((prev) => {
      const seen = new Set(prev.map((i) => `${i.file.name}:${i.file.size}`));
      return [...prev, ...ok.filter((i) => !seen.has(`${i.file.name}:${i.file.size}`))];
    });

    ok.forEach(async (it) => {
      if (it.kind === "zip") return;
      const duration = await probeDuration(it.file, it.kind);
      setItems((p) => p.map((x) => (x.id === it.id ? { ...x, duration } : x)));
    });
  }, []);

  const remove = useCallback((id) => setItems((p) => p.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => { setItems([]); setRejected([]); }, []);

  return { items, rejected, add, remove, clear };
}
