"use strict";

// 이 코드에서는 비디오만 스트리밍 합니다. video:true, audio:false
const mediaStreamConstraints = {
  video: true,
  audio: true
};

// 피어 연결, 스트림 및 비디오 요소를 정의합니다.
const localVideo = document.getElementById("localVideo");

let localStream;
let remoteStream;

// MediaStream 콜백을 정의

// MediaStream을 비디오 요소에 추가하여 성공 상태를 처리합니다.
const gotLocalMediaStream = mediaStream => {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
};

// 오류 발생 시 에러 처리합니다. - 콘솔에 오류 기록
const handleLocalMediaStreamError = e => {
  console.log(`navigator.getUserMedia error: ${e.toString()}.`);
};

// 버튼 정의
const startButton = document.getElementById("startButton");
navigator.mediaDevices
  .getUserMedia(mediaStreamConstraints)
  .then(gotLocalMediaStream)
  .catch(handleLocalMediaStreamError);
