import React,{useRef,useEffect} from "react";
import { IoClose } from "react-icons/io5";


function CapturePhoto({hide,setImage}) {
  const videoRef=useRef(null);
  useEffect(()=>{
    let stream;
    const startCamera=async()=>{
      stream=await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:false
      })
      videoRef.current.srcObject=stream;
    }
    startCamera();
    return ()=>{
      stream?.getTracks().forEach((track)=>track.stop());
    }
  },[])
  const capturePhoto=()=>{
    const canvas=document.createElement("canvas");
    canvas.getContext("2d").drawImage(videoRef.current,0,0,300,150);
    setImage(canvas.toDataURL("/image/jpeg"))
    hide(false);
  };
  return <div className="absolute h-4/6 w-2/6 top-1/4 left-1/3 bg-gray-900 gap-3 flex items-center justify-center">
    <div className="flex flex-col gap-4 w-full items-center justify-center">
    <div
          className="pt-2 pr-2 cursor-pointer flex items-end justify-end"
          onClick={() => hide(false)}
        >
          <IoClose
            className="h-10 w-10 cursor-pointer"
            style={{ color: "white" }}
          />
        </div>
        <div className="flex justify-center" >
        <video id="video" width="400" autoPlay ref={videoRef}></video>
        </div>
        <button className="h-16 w-16 bg-white rounded-full cursor-pointer border-8 border-orange-400 p-2 mb-10" 
        onClick={capturePhoto}>

        </button>
    </div>
  </div>;
}

export default CapturePhoto;
