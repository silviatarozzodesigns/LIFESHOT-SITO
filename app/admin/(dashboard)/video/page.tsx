import { getAllVideosAdmin } from "@/lib/data/videos";
import { VideoManager } from "@/components/admin/video-manager";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = { title: "Gestione video" };

export default async function AdminVideoPage() {
  const videos = await getAllVideosAdmin();

  return (
    <div>
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">Video</h1>
        <p className="mt-2 text-muted-foreground">
          Gestisci il portfolio video incollando un link: lo spazio su R2
          resta a 0 MB.
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-8">
        <VideoManager videos={videos} />
      </FadeIn>
    </div>
  );
}
