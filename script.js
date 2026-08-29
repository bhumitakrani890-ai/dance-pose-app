let latestRefAngles = null;
const stopButton = document.querySelector('#stopButton');
let currentStream = null;
let myAngleHistory = [];
let refAngleHistory = [];

const HISTORY_LENGTH = 30; // roughly 1 second of frames
const matchScoreDisplay = document.querySelector('#matchScore');
const startButton = document.querySelector('#startButton');
const status = document.querySelector('#status');
const webcam = document.querySelector('#webcam');
const canvas = document.querySelector('#overlay');
const ctx = canvas.getContext('2d');


// Set up the pose detection model
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// This function runs every time the model detects a pose
pose.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

 if (results.poseLandmarks) {
  drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
  drawLandmarks(ctx, results.poseLandmarks, { color: '#FF0000', radius: 3 });

const myAngles = getJointAngles(results.poseLandmarks);
myAngleHistory.push(myAngles);
if (myAngleHistory.length > HISTORY_LENGTH) {
  myAngleHistory.shift();
}
console.log('My angles:', myAngles);
if (latestRefAngles) {
  const diff = {
    leftElbow: Math.abs(myAngles.leftElbow - latestRefAngles.leftElbow),
    rightElbow: Math.abs(myAngles.rightElbow - latestRefAngles.rightElbow),
    leftKnee: Math.abs(myAngles.leftKnee - latestRefAngles.leftKnee),
    rightKnee: Math.abs(myAngles.rightKnee - latestRefAngles.rightKnee),
  };

  const avgDiff = (diff.leftElbow + diff.rightElbow + diff.leftKnee + diff.rightKnee) / 4;
  const matchScore = Math.max(0, 100 - avgDiff);

  console.log('Match score:', matchScore.toFixed(0) + '%');
  matchScoreDisplay.textContent = 'Match Score: ' + matchScore.toFixed(0) + '%';
  if (matchScore >= 80) {
  matchScoreDisplay.style.color = 'green';
} else if (matchScore >= 50) {
  matchScoreDisplay.style.color = 'orange';
} else {
  matchScoreDisplay.style.color = 'red';
}
if (myAngleHistory.length === HISTORY_LENGTH && refAngleHistory.length === HISTORY_LENGTH) {
  const dtwDistance = simpleDTW(myAngleHistory, refAngleHistory, angleDistance);
  const dtwScore = Math.max(0, 100 - (dtwDistance / HISTORY_LENGTH));

  console.log('DTW score (timing-aware):', dtwScore.toFixed(0) + '%');
}
}}
});

startButton.addEventListener('click', async function() {
  status.textContent = 'Status: Requesting camera access...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
currentStream = stream;
webcam.srcObject = stream;
    status.textContent = 'Status: Camera live, loading pose model...';

    const camera = new Camera(webcam, {
      onFrame: async () => {
        await pose.send({ image: webcam });
      },
      width: 400,
      height: 300
    });
    camera.start();

    status.textContent = 'Status: Tracking your pose!';
  } catch (error) {
    status.textContent = 'Status: Camera access denied or unavailable';
    console.error('Camera error:', error);
  }
});
const referenceVideo = document.querySelector('#referenceVideo');
const refCanvas = document.createElement('canvas');
refCanvas.width = 400;
refCanvas.height = 300;
document.querySelector('.video-box').appendChild(refCanvas); // adds canvas under reference video
const refCtx = refCanvas.getContext('2d');

const refPose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

refPose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

refPose.onResults((results) => {
  refCtx.clearRect(0, 0, refCanvas.width, refCanvas.height);
  refCtx.drawImage(results.image, 0, 0, refCanvas.width, refCanvas.height);
  if (results.poseLandmarks) {
    drawConnectors(refCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FFFF', lineWidth: 2 });
    drawLandmarks(refCtx, results.poseLandmarks, { color: '#FFFF00', radius: 3 });
      latestRefAngles = getJointAngles(results.poseLandmarks);
      refAngleHistory.push(latestRefAngles);
if (refAngleHistory.length > HISTORY_LENGTH) {
  refAngleHistory.shift();
}
  }
});

async function detectRefVideoPose() {
  if (!referenceVideo.paused && !referenceVideo.ended) {
    await refPose.send({ image: referenceVideo });
  }
  requestAnimationFrame(detectRefVideoPose);
}

referenceVideo.addEventListener('play', () => {
  detectRefVideoPose();
});

function calculateAngle(A, B, C) {
  // A, B, C are objects with .x and .y (this matches MediaPipe's landmark format)
  const angleRadians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angleDegrees = Math.abs(angleRadians * (180 / Math.PI));

  if (angleDegrees > 180) {
    angleDegrees = 360 - angleDegrees;
  }

  return angleDegrees;
}
// Add this near your calculateAngle function
function getJointAngles(landmarks) {
  return {
    leftElbow: calculateAngle(landmarks[11], landmarks[13], landmarks[15]),
    rightElbow: calculateAngle(landmarks[12], landmarks[14], landmarks[16]),
    leftKnee: calculateAngle(landmarks[23], landmarks[25], landmarks[27]),
    rightKnee: calculateAngle(landmarks[24], landmarks[26], landmarks[28]),
  };
}
stopButton.addEventListener('click', function() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    webcam.srcObject = null;
    currentStream = null;
    status.textContent = 'Status: Camera stopped';
    matchScoreDisplay.textContent = 'Match Score: --';
    matchScoreDisplay.style.color = 'black';
  }
});

function angleDistance(a, b) {
  const diff =
    Math.abs(a.leftElbow - b.leftElbow) +
    Math.abs(a.rightElbow - b.rightElbow) +
    Math.abs(a.leftKnee - b.leftKnee) +
    Math.abs(a.rightKnee - b.rightKnee);
  return diff / 4; // average difference across the 4 joints
}
function simpleDTW(seq1, seq2, distFunc) {
  const n = seq1.length;
  const m = seq2.length;

  // Create a grid to store the "cost" of matching each pair of points
  const costMatrix = [];
  for (let i = 0; i <= n; i++) {
    costMatrix.push(new Array(m + 1).fill(Infinity));
  }
  costMatrix[0][0] = 0;

  // Fill the grid: at each cell, take the cheapest path leading to it
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = distFunc(seq1[i - 1], seq2[j - 1]);
      const minPrevious = Math.min(
        costMatrix[i - 1][j],     // came from above
        costMatrix[i][j - 1],     // came from the left
        costMatrix[i - 1][j - 1]  // came diagonally
      );
      costMatrix[i][j] = cost + minPrevious;
    }
  }

  // The final answer is in the bottom-right corner of the grid
  return costMatrix[n][m];
}