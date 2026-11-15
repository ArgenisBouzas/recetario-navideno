import { extractYouTubeId } from '@shared/units';

export function YouTubeEmbed({ url }: { url: string }) {
  const id = extractYouTubeId(url);
  if (!id) return <p className="text-sm text-muted">No se pudo leer el enlace de YouTube.</p>;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-oro/50 bg-black">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="Video de la receta"
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
