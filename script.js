const startButton = document.querySelector('#startButton');
const status = document.querySelector('#status');

startButton.addEventListener('click', function() {
  status.textContent = 'Status: Button clicked! (Camera code comes next)';
});