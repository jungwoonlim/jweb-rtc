"use strict";

// 이 코드에서는 비디오만 스트리밍 합니다. video:true, audio:false
const mediaStreamConstraints = {
  video: true,
  audio: false
};

// video만 교환합니다.
const offerOptions = {
  offerToReceiveVideo: 1
};

// 호출 시간을 초기화합니다. (peers간의 연결을 정의)
let startTime = null;

// 피어 연결, 스트림 및 비디오 요소를 정의합니다.
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

// MediaStream 콜백을 정의

// MediaStream을 비디오 요소에 추가하여 성공 상태를 처리합니다.
const gotLocalMediaStream = mediaStream => {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
  trace("Received local stream");
  callButton.disabled = false;
};

// 오류 발생 시 에러 처리합니다. - 콘솔에 오류 기록
const handleLocalMediaStreamError = e => {
  console.log(`navigator.getUserMedia error: ${e.toString()}.`);
};

// remote mediaStream이 성공했을 때
const gotRemoteMediaStream = e => {
  const mediaStream = e.stream;
  remoteVideo.srcObject = mediaStream;
  remoteStream = mediaStream;
  trace(`remote peer connection received remote stream.`);
};

// video stream에 동작을 추가

// 비디오 요소의 크기
const logVideoLoaded = e => {
  const video = e.target;
  trace(
    `${video.id} videoWidth: ${video.videoWidth}px, videoHeight: ${video.videoHeight}px`
  );
};

// video 요소의 Id와 크기로 메세지를 기록. 비디오 스트리밍이 시작되면 실행.
const logResizedVideo = e => {
  logVideoLoaded(e);

  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    startTime = null;
    trace(`Setup time: ${elapsedTime.toFixed(3)}mx.`);
  }
};

localVideo.addEventListener("loadedmetadata", logVideoLoaded);
remoteVideo.addEventListener("loadedmetadata", logVideoLoaded);
remoteVideo.addEventListener("onresize", logResizedVideo);

// RTC peer 연결 동작을 정의

// 새로운 peer와 연결
const handleConnection = e => {
  const peerConnection = e.target;
  const iceCandidate = e.candidate;

  if (iceCandidate) {
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerConnection);

    otherPeer
      .addIceCandidate(newIceCandidate)
      .then(() => {
        handleConnectionSuccess(peerConnection);
      })
      .catch(error => {
        handleConnectionError(peerConnection, error);
      });
    trace(
      `${getPeerName(peerConnection)} ICE candidate:\n ${
        e.candidate.candidate
      }.`
    );
  }
};

// 성공과 실패의 로그
const handleConnectionSuccess = peerConnection => {
  trace(`${getPeerName(peerConnection)} addIceCandidate Success.`);
};

const handleConnectionError = (peerConnection, error) => {
  trace(
    `${getPeerName(
      peerConnection
    )} addIceCandidate Error. \n ${error.toString()}.`
  );
};

// 연결 상태 변화 로그
const handleConnectionChange = e => {
  const peerConnection = e.target;
  console.log(`ICE state change event: ${e}`);
  trace(
    `${getPeerName(peerConnection)} ICE state: ${
      peerConnection.iceConectionState
    }.`
  );
};

// 세션 설명 세팅에 실패시 로그
const setSessionDescriptionError = error => {
  trace(`Failed to create session description: ${error.toString()}.`);
};

// 세션 설명 성공 시 로그
const setDescriptionSuccess = (peerConnection, functionName) => {
  const peerName = getPeerName(peerConnection);
  trace(`${peerName} ${functionName} complete.`);
};

// local이 세팅되면 로그
const setLocalDescriptionSuccess = peerConnection => {
  setDescriptionSuccess(peerConnection, "setLocalDescription");
};

// remote이 세팅되면 로그
const setRemoteDescriptionSuccess = peerConnection => {
  setDescriptionSuccess(peerConnection, "setRemoteDescription");
};

// peer connection 세션 설명을 세팅합니다.
const createdOffer = description => {
  trace(`Offer from localPeerConnection:\n${description.sdp}`);

  trace("localPeerConnection setLocalDescription start.");
  localPeerConnection
    .setLocalDescription(description)
    .then(() => {
      setLocalDescriptionSuccess(localPeerConnection);
    })
    .catch(setSessionDescriptionError);

  trace("remotePeerConnection setRemoteDescription start.");
  remotePeerConnection
    .setRemoteDescription(description)
    .then(() => {
      setRemoteDescriptionSuccess(remotePeerConnection);
    })
    .catch(setSessionDescriptionError);

  trace("remotePeerConnection createAnswer start.");
  remotePeerConnection
    .createAnswer()
    .then(createdAnswer)
    .catch(setSessionDescriptionError);
};

// 생성을 제공하기 위하여 응답을 기록하고 피어 연결 세션 설명을 설정
const createdAnswer = description => {
  trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

  trace("remotePeerConnection setLocalDescription start.");
  remotePeerConnection
    .setLocalDescription(description)
    .then(() => {
      setLocalDescriptionSuccess(remotePeerConnection);
    })
    .catch(setSessionDescriptionError);

  trace("localPeerConnection setRemoteDescription start.");
  localPeerConnection
    .setRemoteDescription(description)
    .then(() => {
      setRemoteDescriptionSuccess(localPeerConnection);
    })
    .catch(setSessionDescriptionError);
};

// Button

// 버튼 정의
const startButton = document.getElementById("startButton");
const callButton = document.getElementById("callButton");
const hangupButton = document.getElementById("hangupButton");

// 버튼 초기화 - Call, hangup 숨김
callButton.disabled = true;
hangupButton.disabled = true;

// Start Action Button
const startAction = () => {
  startButton.disabled = true;
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream)
    .catch(handleLocalMediaStreamError);
  trace("Requesting local stream.");
};

// Call Action Button
const callAction = () => {
  callButton.disabled = true;
  hangupButton.disabled = false;

  trace("Starting call.");
  startTime = window.performance.now();

  // local media stream을 가져옴.
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    trace(`Using video device: ${videoTracks[0].label}.`);
  }
  if (audioTracks.length > 0) {
    trace(`Using audio device: ${audioTracks[0].label}.`);
  }

  const servers = null; // Allows for RTC server configuration.

  //peer connections을 만들고 동작 추가.
  localPeerConnection = new RTCPeerConnection(servers);
  trace("Created local peer connection object localPeerConnection.");

  localPeerConnection.addEventListener("icecandidate", handleConnection);
  localPeerConnection.addEventListener(
    "iceconnectionstatechange",
    handleConnectionChange
  );

  remotePeerConnection = new RTCPeerConnection(servers);
  trace("Created remote peer connection object remotePeerConnection.");

  remotePeerConnection.addEventListener("icecandidate", handleConnection);
  remotePeerConnection.addEventListener(
    "iceconnectionstatechange",
    handleConnectionChange
  );
  remotePeerConnection.addEventListener("addstream", gotRemoteMediaStream);

  // 연결에 로컬 스트림을 추가, offer to connect 생성
  localPeerConnection.addStream(localStream);
  trace("Added local stream to localPeerConnection.");

  trace("localPeerConnection createOffer start.");
  localPeerConnection
    .createOffer(offerOptions)
    .then(createdOffer)
    .catch(setSessionDescriptionError);
};

// Hangup Action Button
const hangupAction = () => {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  trace("Ending call.");
};

// Click 이벤트
startButton.addEventListener("click", startAction);
callButton.addEventListener("click", callAction);
hangupButton.addEventListener("click", hangupAction);

// 함수 정의

// 다른 peer connection을 가져옴
const getOtherPeer = peerConnection => {
  return peerConnection === localPeerConnection
    ? remotePeerConnection
    : localPeerConnection;
};

// 특정 peer connection의 이름을 가져옴
const getPeerName = peerConnection => {
  return peerConnection === localPeerConnection
    ? "localPeerConnection"
    : "remotePeerConnection";
};
// 콘솔에 적힌 로그와 행동을 기록합니다.
const trace = text => {
  text = text.trim();
  const now = (window.performance.now() / 1000).toFixed(3);

  console.log(now, text);
};
