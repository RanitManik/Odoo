import Loader from "@/components/ui/loader";

interface PageLoaderProps {
  loadingMessage?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  loadingMessage = "Loading...",
}) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
      <Loader label={loadingMessage || "Loading..."} />
    </div>
  );
};

export default PageLoader;
