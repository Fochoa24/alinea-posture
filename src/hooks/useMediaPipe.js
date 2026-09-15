import { useRef, useCallback } from 'react';

export function useMediaPipe() {
  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  const initializePose = useCallback((onResults) => {
    if (typeof window.Pose === 'undefined') {
      console.error('MediaPipe Pose no está cargado. Revisa los CDN en index.html.');
      return null;
    }

    const pose = new window.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    pose.onResults(onResults);

    poseRef.current = pose;
    return pose;
  }, []);

  const startCamera = useCallback(async (videoElement, onFrame) => {
    if (typeof window.Camera === 'undefined') {
      console.error('MediaPipe Camera Utils no está cargado.');
      return null;
    }

    const camera = new window.Camera(videoElement, {
      onFrame: async () => {
        if (poseRef.current && videoElement.readyState >= 2) {
          await poseRef.current.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    await camera.start();
    return camera;
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
  }, []);

  return {
    initializePose,
    startCamera,
    stopCamera,
  };
}
