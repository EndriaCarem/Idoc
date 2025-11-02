import '@/styles/loading-robot.css';

interface LoadingRobotProps {
  message?: string;
}

const LoadingRobot = ({ message = "Analisando documento..." }: LoadingRobotProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="loader">
        <div className="modelViewPort">
          <div className="eva">
            <div className="head">
              <div className="eyeChamber">
                <div className="eye"></div>
                <div className="eye"></div>
              </div>
            </div>
            <div className="body">
              <div className="hand"></div>
              <div className="hand"></div>
              <div className="scannerThing"></div>
              <div className="scannerOrigin"></div>
            </div>
          </div>
        </div>
      </div>
      {message && (
        <p className="mt-8 text-xl font-semibold text-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingRobot;
