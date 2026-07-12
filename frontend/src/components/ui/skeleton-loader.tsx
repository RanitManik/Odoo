interface SkeletonLoaderProps {
  /**
   * Size of the skeleton loader
   * @default "lg"
   */
  size?: "sm" | "md" | "lg";
}

const SkeletonLoader = ({ size = "lg" }: SkeletonLoaderProps) => {
  const heightClasses = {
    sm: "h-[calc(100vh-30em)]",
    md: "h-[calc(100vh-25em)]",
    lg: "h-[calc(100vh-20em)]",
  };

  return (
    <div className="w-full animate-pulse px-8">
      <div className="mb-6 h-14 w-full bg-gray-300 px-12"></div>
      <div className={`${heightClasses[size]} w-full bg-gray-300 px-12`}></div>
    </div>
  );
};

export default SkeletonLoader;
