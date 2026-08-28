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

  // NEW: test the angle calculation on your left elbow
  const shoulder = results.poseLandmarks[11];
  const elbow = results.poseLandmarks[13];
  const wrist = results.poseLandmarks[15];
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  console.log('Elbow angle:', elbowAngle.toFixed(1));
}
});

startButton.addEventListener('click', async function() {
  status.textContent = 'Status: Requesting camera access...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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