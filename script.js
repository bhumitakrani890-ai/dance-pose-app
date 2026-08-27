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