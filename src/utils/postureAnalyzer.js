import { LANDMARKS, POSTURE_THRESHOLDS } from './constants';

function isVisible(landmark) {
  return landmark && (landmark.visibility === undefined || landmark.visibility >= POSTURE_THRESHOLDS.minLandmarkVisibility);
}

function headForwardScore(landmarks) {
  const nose = landmarks[LANDMARKS.NOSE];
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const leftEar = landmarks[LANDMARKS.LEFT_EAR];
  const rightEar = landmarks[LANDMARKS.RIGHT_EAR];

  if (!isVisible(nose) || !isVisible(leftShoulder) || !isVisible(rightShoulder)) {
    return 0;
  }

  let score = 0;
  let checks = 0;

  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const noseToShoulderY = shoulderMidY - nose.y;
  const noseVerticalRatio = noseToShoulderY / (shoulderMidY || 0.01);
  if (noseVerticalRatio < 0.25) score += 1;
  checks++;

  if (isVisible(leftEar) && isVisible(rightEar)) {
    const earMidZ = (leftEar.z + rightEar.z) / 2;
    const noseZ = nose.z;
    const zDiff = earMidZ - noseZ;
    if (zDiff > 0.3) score += 1;
    checks++;

    const earMidY = (leftEar.y + rightEar.y) / 2;
    const earNoseDy = Math.abs(earMidY - nose.y);
    const shoulderSpan = Math.abs(leftShoulder.y - rightShoulder.y) || 0.01;
    const earNoseRatio = earNoseDy / shoulderSpan;
    if (earNoseRatio < 0.15) score += 1;
    checks++;
  }

  return checks > 0 ? score / checks : 0;
}

function shoulderTiltScore(landmarks) {
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];

  if (!isVisible(leftShoulder) || !isVisible(rightShoulder)) {
    return 0;
  }

  const shoulderDy = Math.abs(leftShoulder.y - rightShoulder.y);
  const shoulderDx = Math.abs(leftShoulder.x - rightShoulder.x);
  if (shoulderDx === 0) return 0;

  const tiltRatio = shoulderDy / shoulderDx;

  if (tiltRatio > POSTURE_THRESHOLDS.shoulderTiltThreshold) return 1;
  return 0;
}

export function analyzePosture(landmarks) {
  if (!landmarks || landmarks.length < 25) {
    return { isBadPosture: false, headForward: false, shoulderImbalance: false };
  }

  const hScore = headForwardScore(landmarks);
  const sScore = shoulderTiltScore(landmarks);

  const headForward = hScore >= POSTURE_THRESHOLDS.headForwardScoreThreshold;
  const shoulderImbalance = sScore > 0;
  const isBadPosture = headForward || shoulderImbalance;

  return { isBadPosture, headForward, shoulderImbalance };
}
