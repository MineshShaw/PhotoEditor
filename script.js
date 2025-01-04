// Variables
const imageUpload = document.getElementById('imageUpload');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const canvasBounds = canvas.getBoundingClientRect();
ctx.font = '20px Arial';
ctx.fillText('Upload an image to start editing!', 10, canvas.height / 2);

const enhanceImageBtn = document.getElementById('enhanceImage');
const removeBgBtn = document.getElementById('removeBg');
const cropModeBtn = document.getElementById('cropMode');
const applyCropBtn = document.getElementById('applyCrop');
const cancelCropBtn = document.getElementById('cancelCrop');

let isCropMode = false;
let rotationAngle = 0;
let isMouseDown = false;
let cropStart = { x: 0, y: 0 };
let cropEnd = { x: 0, y: 0 };
let img = new Image();
let cropRect = null;

// Download Image
document.getElementById('downloadImage').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Crop Image
function getMousePos(event) {
  const x = event.clientX - canvasBounds.left;
  const y = event.clientY - canvasBounds.top;
  return { x, y };
}

cropModeBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.rect(cropStart.x, cropStart.y, cropEnd.x - cropStart.x, cropEnd.y - cropStart.y);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.stroke();
  isCropMode = true;
});

// Handle mouse down event for cropping
canvas.addEventListener('mousedown', (e) => {
  if (isCropMode) {
      isMouseDown = true;
      const mousePos = getMousePos(e);
      cropStart = { x: mousePos.x, y: mousePos.y };
      cropEnd = { x: mousePos.x, y: mousePos.y };
  }
});

// Handle mouse move event for cropping
canvas.addEventListener('mousemove', (e) => {
  if (isCropMode && isMouseDown) {
      const mousePos = getMousePos(e);
      cropEnd = { x: mousePos.x, y: mousePos.y };
      drawCropPreview();
  }
});

// Handle mouse up event to finalize crop area
canvas.addEventListener('mouseup', () => {
  if (isCropMode) {
      isMouseDown = false;
      cropRect = {
          x: Math.min(cropStart.x, cropEnd.x),
          y: Math.min(cropStart.y, cropEnd.y),
          width: Math.abs(cropEnd.x - cropStart.x),
          height: Math.abs(cropEnd.y - cropStart.y),
      };
  }
});

// Function to draw crop preview
function drawCropPreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Redraw image

  // Draw the crop area preview
  ctx.beginPath();
  ctx.rect(cropStart.x, cropStart.y, cropEnd.x - cropStart.x, cropEnd.y - cropStart.y);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.stroke();
}

// Apply crop functionality
applyCropBtn.addEventListener('click', () => {
  if (cropRect) {
      const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
      canvas.width = cropRect.width;
      canvas.height = cropRect.height;
      ctx.putImageData(imageData, 0, 0);
  }
});

// Cancel crop functionality
cancelCropBtn.addEventListener('click', () => {
  isCropMode = false;
  cropRect = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Redraw the image
});


// Image Upload
imageUpload.addEventListener('input', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    img.src = reader.result;
  };
  reader.readAsDataURL(file);

  img.onload = () => {
    // Ensure canvas is set to the image dimensions
    canvas.width = img.width;
    canvas.height = img.height;
    rotationAngle = 0;
    drawImage();
  };
});

function drawImage() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotationAngle * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

// Remove Background


removeBgBtn.addEventListener('click', async () => {
    if (!img.src) {
      alert('Please upload an image first!');
      return;
    }

    try {
      const apiKey = 'Aq6ejQJAN7dThqwuYpthtLMU';
      const blob = await fetch(img.src).then(res => res.blob());
      const formData = new FormData();
      formData.append('image_file', blob);

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to remove background');
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);

      const processedImage = new Image();
      processedImage.src = resultUrl;

      processedImage.onload = () => {
        canvas.width = processedImage.width;
        canvas.height = processedImage.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(processedImage, 0, 0);
      };
    } catch (error) {
      alert('Error removing background: ' + error.message);
    }
});

// Rotate Image
document.getElementById('rotateLeft').addEventListener('click', () => {
  rotationAngle = (rotationAngle - 90 + 360) % 360;
  drawImage();
});

document.getElementById('rotateRight').addEventListener('click', () => {
  rotationAngle = (rotationAngle + 90) % 360; 
  drawImage();
});