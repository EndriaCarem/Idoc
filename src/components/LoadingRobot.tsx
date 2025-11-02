import '@/styles/loading-robot.css';

interface LoadingRobotProps {
  message?: string;
}

const LoadingRobot = ({ message = "Analisando documento..." }: LoadingRobotProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
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
        <p className="text-lg font-medium text-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingRobot;
