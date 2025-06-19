interface ModelsErrorProps {
    error: string;
  }
  
  export function ModelsError({ error }: ModelsErrorProps) {
    return (
      <div className="p-4 border-b border-red-500/20 bg-red-500/10">
        <p className="text-red-400 text-sm">Models loading failed: {error}</p>
      </div>
    );
  }