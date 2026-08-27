const startButton = document.querySelector('#startButton');
const status = document.querySelector('#status');
const webcam = document.querySelector('#webcam');

startButton.addEventListener('click', async function() {
  status.textContent = 'Status: Requesting camera access...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcam.srcObject = stream;
    status.textContent = 'Status: Camera is live!';
  } catch (error) {
    status.textContent = 'Status: Camera access denied or unavailable';
    console.error('Camera error:', error);
  }
});