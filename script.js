// --- querySelector: selecting elements ---
const button = document.querySelector('#myButton');
const heading = document.querySelector('h1');

// --- addEventListener: respond to a click ---
button.addEventListener('click', function() {
  console.log('You clicked me!');
  heading.textContent = 'Hello from JavaScript!';
  heading.style.color = 'blue';
});

// --- async/await: simulate a slow task, like a camera loading ---
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fakeCameraStart() {
  console.log('Requesting camera...');
  await wait(2000);
  console.log('Camera is ready!');
}

fakeCameraStart();