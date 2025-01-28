import React from "react";
import reactDom from "react-dom";

function PhotoPicker({onChange}) {
  const component=<input type="file" hidden id="photo-picker" onChange={onChange} />
  return reactDom.createPortal(
    component,document.getElementById("photo-picker-element")
  );
}

export default PhotoPicker;
