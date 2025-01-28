import React, { useState, useEffect, useRef } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { CHECK_USER_ROUTE, GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import axios from "axios";
import Chat from "./Chat/Chat";
import { io } from "socket.io-client";
import SearchMessages from "./Chat/SearchMessages";
import VideoCall from "./Call/VideoCall";
import VoiceCall from "./Call/VoiceCall";
import IncomingVideoCall from "./common/IncomingVideoCall";
import IncomingCall from "./common/IncomingCall";

function Main() {
  const router = useRouter();
  const [
    {
      userInfo,
      currentChatUser,
      messageSearch,
      videoCall,
      voiceCall,
      incomingVoiceCall,
      incomingVideoCall,
    },
    dispatch,
  ] = useStateProvider();

  const [redirectLogin, setRedirectLogin] = useState(false);
  const socket = useRef();
  const socketInitialized = useRef(false); // Flag for socket initialization

  useEffect(() => {
    if (redirectLogin) router.push("/login");
  }, [redirectLogin]);

  useEffect(() => {
    onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (!currentUser) setRedirectLogin(true);
      if (!userInfo && currentUser?.email) {
        const { data } = await axios.post(CHECK_USER_ROUTE, {
          email: currentUser.email,
        });

        if (!data.status) {
          router.push("/login");
        } else if (data?.data) {
          const {
            id,
            name,
            email,
            profilePicture: profileImage,
            status,
          } = data.data;
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: { id, name, email, profileImage, status },
          });
        }
      }
    });
  }, [userInfo, router, dispatch]);

  useEffect(() => {
    if (userInfo && !socketInitialized.current) {
      socket.current = io(HOST);
      
      // Wait for socket connection before emitting and setting up listeners
      socket.current.on("connect", () => {
        socket.current.emit("add-user", userInfo.id);
        dispatch({ type: reducerCases.SET_SOCKET, socket });
        socketInitialized.current = true;

        // Attach listeners only when socket is fully connected
        attachSocketListeners();
      });

      // Disconnect socket on component unmount
      return () => {
        if (socket.current) {
          socket.current.disconnect();
          socketInitialized.current = false;
        }
      };
    }
  }, [userInfo, dispatch]);

  const attachSocketListeners = () => {
    if (socket.current) {
      const handleMsgReceive = (data) => {
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: { ...data.message },
        });
      };

      const handleIncomingVoiceCall = ({ from, roomId, callType }) => {
        dispatch({
          type: reducerCases.SET_INCOMING_VOICE_CALL,
          incomingVoiceCall: { ...from, roomId, callType },
        });
      };

      const handleIncomingVideoCall = ({ from, roomId, callType }) => {
        console.log("Incoming video call:", from, roomId, callType);
        dispatch({
          type: reducerCases.SET_INCOMING_VIDEO_CALL,
          incomingVideoCall: { ...from, roomId, callType },
        });
      };

      const handleVoiceCallRejected = () => {
        dispatch({
          type: reducerCases.END_CALL,
        });
      };

      const handleVideoCallRejected = () => {
        dispatch({
          type: reducerCases.END_CALL,
        });
      };

      // Add event listeners
      socket.current.on("msg-recieve", handleMsgReceive);
      socket.current.on("incoming-voice-call", handleIncomingVoiceCall);
      socket.current.on("incoming-video-call", handleIncomingVideoCall);
      socket.current.on("voice-call-rejected", handleVoiceCallRejected);
      socket.current.on("video-call-rejected", handleVideoCallRejected);

      // Cleanup function to remove listeners
      return () => {
        socket.current.off("msg-recieve", handleMsgReceive);
        socket.current.off("incoming-voice-call", handleIncomingVoiceCall);
        socket.current.off("incoming-video-call", handleIncomingVideoCall);
        socket.current.off("voice-call-rejected", handleVoiceCallRejected);
        socket.current.off("video-call-rejected", handleVideoCallRejected);
      };
    }
  };

  useEffect(() => {
    const getMessages = async () => {
      if (userInfo?.id && currentChatUser?.id) {
        const {
          data: { messages },
        } = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`
        );
        dispatch({ type: reducerCases.SET_MESSAGES, messages });
      }
    };

    if (currentChatUser?.id) {
      getMessages();
    }
  }, [currentChatUser, userInfo, dispatch]);

  return (
    <>
      {incomingVideoCall && <IncomingVideoCall />}
      {incomingVoiceCall && <IncomingCall />}
      {videoCall && (
        <div className="h-screen w-screen max-h-full overflow-hidden">
          <VideoCall />
        </div>
      )}
      {voiceCall && (
        <div className="h-screen w-screen max-h-full overflow-hidden">
          <VoiceCall />
        </div>
      )}
      {!videoCall && !voiceCall && (
        <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          <ChatList />
          {currentChatUser ? (
            <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
              <Chat />
              {messageSearch && <SearchMessages />}
            </div>
          ) : (
            <Empty />
          )}
        </div>
      )}
    </>
  );
}

export default Main;
