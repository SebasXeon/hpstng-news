const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const headlineInput = document.getElementById('headline');
const downloadBtn = document.getElementById('downloadBtn');

let backgroundImage = null;
const colors = { rojo: '#e94560', azul: '#4da6ff' };

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const img = new Image();
    img.onload = () => {
      backgroundImage = img;
      drawCanvas();
    };
    img.src = URL.createObjectURL(file);
  }
});

headlineInput.addEventListener('input', drawCanvas);

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'news-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (backgroundImage) {
    drawBackgroundImage();
  } else {
    drawPlaceholder();
  }

  drawHeadline();
}

function drawBackgroundImage() {
  const imgRatio = backgroundImage.width / backgroundImage.height;
  const canvasRatio = canvas.width / canvas.height;

  let sx, sy, sw, sh;
  if (imgRatio > canvasRatio) {
    sh = backgroundImage.height;
    sw = sh * canvasRatio;
    sx = (backgroundImage.width - sw) / 2;
    sy = 0;
  } else {
    sw = backgroundImage.width;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (backgroundImage.height - sh) / 2;
  }

  ctx.drawImage(backgroundImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
}

function drawPlaceholder() {
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#718096';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Upload an image', canvas.width / 2, canvas.height / 2);
}

function drawHeadline() {
  const text = headlineInput.value || '';
  ctx.textAlign = 'left';

  const maxWidth = canvas.width - 80;
  const paragraphs = text.split('\n');
  const segments = [];
  let currentY = 0;

  const sizes = { L: 56, M: 42, S: 32 };

  for (const para of paragraphs) {
    let fontSize = 42;
    let cleanPara = para;

    if (cleanPara.startsWith('[L]')) {
      fontSize = sizes.L;
      cleanPara = cleanPara.slice(3);
    } else if (cleanPara.startsWith('[M]')) {
      fontSize = sizes.M;
      cleanPara = cleanPara.slice(3);
    } else if (cleanPara.startsWith('[S]')) {
      fontSize = sizes.S;
      cleanPara = cleanPara.slice(3);
    }

    const lineHeight = fontSize * 1.1;
    const colorSegments = parseColorTags(cleanPara);

    const words = [];
    for (const seg of colorSegments) {
      const parts = seg.text.split(' ');
      for (const part of parts) {
        if (part) words.push({ text: part, color: seg.color });
      }
    }

    let line = [];
    let lineWidth = 0;

    ctx.font = `bold ${fontSize}px sans-serif`;

    for (const word of words) {
      const prefix = line.length > 0 ? ' ' : '';
      const wordWidth = ctx.measureText(prefix + word.text).width;
      if (lineWidth + wordWidth > maxWidth && line.length > 0) {
        segments.push({ words: line, fontSize, y: currentY });
        currentY += lineHeight;
        line = [];
        lineWidth = 0;
      }
      line.push(word);
      lineWidth += wordWidth;
    }

    if (line.length > 0) {
      segments.push({ words: line, fontSize, y: currentY });
      currentY += lineHeight;
    }
  }

  const totalHeight = currentY;
  let startY = canvas.height - 70 - (totalHeight - (segments.length > 0 ? segments[0].fontSize * 1.1 : 0));

  const badgeText = 'ULTIMA HORA';
  ctx.font = 'bold 16px sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 20;
  const badgeHeight = 28;
  const badgeX = 40;
  const firstLineHeight = segments.length > 0 ? segments[0].fontSize * 1.1 : 46;
  const badgeY = startY - firstLineHeight - badgeHeight - 5;

  const gradientStart = badgeY - 20;
  const gradient = ctx.createLinearGradient(0, gradientStart, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.3, 'rgba(0,0,0,0.6)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, gradientStart, canvas.width, canvas.height - gradientStart);

  ctx.fillStyle = '#e94560';
  ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(badgeText, badgeX + 10, badgeY + 20);

  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  const handleText = '@hijueposting';
  const handleWidth = ctx.measureText(handleText).width + 16;
  const handleX = canvas.width - 40 - handleWidth;
  ctx.fillRect(handleX, 15, handleWidth, 28);
  ctx.fillStyle = '#fff';
  ctx.fillText(handleText, canvas.width - 48, 35);

  ctx.textAlign = 'left';
  for (const seg of segments) {
    let x = 40;
    ctx.font = `bold ${seg.fontSize}px sans-serif`;
    for (let i = 0; i < seg.words.length; i++) {
      const word = seg.words[i];
      ctx.fillStyle = word.color || '#fff';
      const prefix = i > 0 ? ' ' : '';
      ctx.fillText(prefix + word.text, x, startY + seg.y);
      x += ctx.measureText(prefix + word.text).width;
    }
  }
}

function parseColorTags(text) {
  const result = [];
  const regex = /\[(rojo|azul)\](.*?)\[\/\1\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: text.slice(lastIndex, match.index), color: null });
    }
    result.push({ text: match[2], color: colors[match[1]] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), color: null });
  }

  return result.length > 0 ? result : [{ text: text, color: null }];
}



drawCanvas();
