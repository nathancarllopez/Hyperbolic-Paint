function getCanvasCoord(e, hypCanvas) {
  return [
    e.clientX - hypCanvas.offsetX,
    -(e.clientY - hypCanvas.offsetY)
  ];
}

function getRadioButtonValue(name) {
  // Get all radio buttons with name
  const radioButtons = document.getElementsByName(name);

  // Return the value of the checked button
  for (const button of radioButtons) {
    if (button.checked) {
      return button.value;
    }
  }
}

function removeBorder(allColorButtons) {
  for (const button of allColorButtons) {
    if (button.style.border) {
      button.style.removeProperty('border');
      break;
    }
  }
}

function resetToolBar(hypCanvas) {
  // Reset line width
  const lineWidth = hypCanvas.lineWidth
  const lineWidthRange = document.querySelector('#width');
  lineWidthRange.value = lineWidth

  // Remove the border from all the color buttons
  const allColorButtons = Array.from(document.querySelectorAll('.color-button'));
  removeBorder(allColorButtons);

  // Reset color
  const canvasColor = hypCanvas.colorType === 'stroke' ?
    hypCanvas.strokeStyle :
    hypCanvas.fillStyle;
  let colorButtonFound = false;
  const colorPickerDiv = allColorButtons.pop()
  for (const button of allColorButtons) {
    if (button.style.background === canvasColor) {
      colorButtonFound = true;
      button.style.border = '2px solid gray';
    }
  }
  if (!colorButtonFound) {
    const colorPicker = document.querySelector('.color-input');
    colorPicker.value = canvasColor;
    colorPickerDiv.style.background = canvasColor;
    colorPickerDiv.style.border = '2px solid gray';
  }
}

function switchPlayPauseButtonText() {
  const playPauseButton = document.querySelector('#playPause');
  const currentButtonText = playPauseButton.textContent;
  playPauseButton.textContent = currentButtonText === "Play" ?
    "Pause" :
    "Play";
}

export {
  getCanvasCoord,
  getRadioButtonValue,
  removeBorder,
  resetToolBar,
  switchPlayPauseButtonText
}