// Variables
const imageUpload = document.getElementById('imageUpload');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const canvasBounds = canvas.getBoundingClientRect();
const cropModal = document.getElementById('cropModal');
ctx.font = '20px Arial';
ctx.fillText('Upload an image to start editing!', 10, canvas.height / 2);

const enhanceImageBtn = document.getElementById('enhanceImage');
const removeBgBtn = document.getElementById('removeBg');
const cropModeBtn = document.getElementById('cropMode');
const applyCropBtn = document.getElementById('applyCrop');
const cancelCropBtn = document.getElementById('cancelCrop');

let isCropMode = false;
let rotationAngle = 0;
let img = new Image();
const cropX = document.getElementById('cropX');
const cropY = document.getElementById('cropY');
const cropWidth = document.getElementById('cropWidth');
const cropHeight = document.getElementById('cropHeight');

[cropX, cropY, cropWidth, cropHeight].forEach(slider => {
  slider.addEventListener('input', drawCropArea);
});

applyCropBtn.addEventListener('click', cropImage);
cancelCropBtn.addEventListener('click', () => {
  cropModal.style.display = 'none';
});

function cropImage() {
  const x = parseInt(cropX.value, 10);
  const y = parseInt(cropY.value, 10);
  const width = parseInt(cropWidth.value, 10);
  const height = parseInt(cropHeight.value, 10);

  // Get the cropped image data
  const croppedImageData = ctx.getImageData(x, y, width, height);

  // Clear the canvas and draw the cropped image
  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(croppedImageData, 0, 0);
}

function drawImage() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotationAngle * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

function drawCropArea() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw the image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Draw the cropping rectangle
  const x = parseInt(cropX.value, 10);
  const y = parseInt(cropY.value, 10);
  const width = parseInt(cropWidth.value, 10);
  const height = parseInt(cropHeight.value, 10);

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

// Download Image
document.getElementById('downloadImage').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
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

      img = processedImage;
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

// Crop Mode
cropModeBtn.addEventListener('click', () => {
  cropModal.style.display = 'flex';
});
