"use strict";

// 이 코드에서는 비디오만 스트리밍 합니다. video:true, audio:false
const mediaStreamConstraints = {
  video: true,
  audio: false
};

// stream이 배치될 비디오 요소
const localVideo = document.querySelector("video");

// 비디오에서 재생 될 로컬 스트림
let localStream;

// MediaStream을 비디오 요소에 추가하여 성공 상태를 처리합니다.
const gotLocalMediaStream = mediaStream => {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
};

// 오류 발생 시 에러 처리합니다. - 콘솔에 오류 기록
const handleLocalMediaStreamError = e => {
  console.log("navigator.getUserMedia error: ", e);
};

// media stream을 초기화합니다.
navigator.mediaDevices
  .getUserMedia(mediaStreamConstraints)
  .then(gotLocalMediaStream)
  .catch(handleLocalMediaStreamError);
