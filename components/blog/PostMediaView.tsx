import { videoEmbedUrl, type PostMedia } from "@/lib/content/media";

/** The media block at the top of a post. See lib/content/media.ts for why custom HTML is safe to show. */
export function PostMediaView({ media, className = "" }: { media: PostMedia | null; className?: string }) {
  if (!media) return null;
  if (media.type === "image") return <figure className={className}>
    {/* eslint-disable-next-line @next/next/no-img-element -- writers' images from uploads or other sites */}
    <img src={media.src} alt={media.alt} className="w-full rounded-lg object-cover" />
    {media.alt && <figcaption className="mt-2 text-[0.88rem] opacity-70">{media.alt}</figcaption>}
  </figure>;
  if (media.type === "video") return <div className={className}>
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe src={videoEmbedUrl(media)} title={media.title || "Video"} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="absolute inset-0 size-full border-0" />
    </div>
  </div>;
  return <div className={className}>
    <iframe srcDoc={media.html} sandbox="allow-scripts" title="Embedded content" loading="lazy" referrerPolicy="no-referrer" style={{ height: media.height }} className="w-full rounded-lg border-0 bg-white" />
  </div>;
}
