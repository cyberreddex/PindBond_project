import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import Avatar from "../common/Avatar";
import { FaPlay, FaStop } from "react-icons/fa";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { useStateProvider } from "@/context/StateContext";
import { HOST } from "@/utils/ApiRoutes";

function VoiceMessage({ message }) {
  const [{ currentChatUser, userInfo }] = useStateProvider();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const waveformRef = useRef(null);
  const waveform = useRef(null);

  const initializeWaveform = () => {
    if (waveformRef.current && !waveform.current) {
      waveform.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#ccc",
        progressColor: "#4a9eff",
        cursorColor: "#7ae3c3",
        barWidth: 2,
        height: 30,
        responsive: true,
      });

      waveform.current.on("finish", () => {
        setIsPlaying(false);
        setCurrentPlaybackTime(0);
      });

      waveform.current.on("audioprocess", () => {
        setCurrentPlaybackTime(waveform.current.getCurrentTime());
      });

      waveform.current.on("ready", () => {
        setTotalDuration(waveform.current.getDuration());
      });
    }
  };

  // Initialize WaveSurfer and set up ResizeObserver
  useEffect(() => {
    initializeWaveform();

    // Resize observer to watch for container width changes
    const resizeObserver = new ResizeObserver(() => {
      if (waveform.current) {
        waveform.current.drawer.containerWidth = waveformRef.current.clientWidth;
        waveform.current.drawer.drawPeaks(waveform.current.backend.getPeaks());
        waveform.current.drawBuffer();
      }
    });

    if (waveformRef.current) {
      resizeObserver.observe(waveformRef.current);
    }

    return () => {
      if (resizeObserver && waveformRef.current) {
        resizeObserver.unobserve(waveformRef.current);
      }
      if (waveform.current) {
        waveform.current.destroy();
        waveform.current = null;
      }
    };
  }, []);

  // Load audio file when message changes
  useEffect(() => {
    if (message && message.message && waveform.current) {
      const audioURL = `${HOST}/${message.message}`;
      waveform.current.load(audioURL);
    }
  }, [message]);

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePlayAudio = () => {
    if (waveform.current) {
      waveform.current.play();
      setIsPlaying(true);
    }
  };

  const handlePauseAudio = () => {
    if (waveform.current) {
      waveform.current.pause();
      setIsPlaying(false);
    }
  };

  if (!message) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-5 text-white px-4 pr-2 py-4 text-sm rounded-md ${
        message?.senderId === currentChatUser?.id
          ? "bg-incoming-background"
          : "bg-outgoing-background"
      }`}
    >
      <div>
        <Avatar type="lg" image={currentChatUser?.profilePicture} />
      </div>
      <div className="cursor-pointer text-xl">
        {!isPlaying ? (
          <FaPlay onClick={handlePlayAudio} />
        ) : (
          <FaStop onClick={handlePauseAudio} />
        )}
      </div>
      <div className="relative w-60">
        <div ref={waveformRef} className="w-full" />
        <div className="text-bubble-meta text-[11px] pt-1 flex justify-between absolute bottom-[-22px] w-full">
          <span>
            {formatTime(isPlaying ? currentPlaybackTime : totalDuration)}
          </span>
          <div className="flex gap-1">
            <span>{calculateTime(message.createdAt)}</span>
            {message?.senderId === userInfo.id && (
              <MessageStatus messageStatus={message.messageStatus} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceMessage;
