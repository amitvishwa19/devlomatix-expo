import { Platform } from 'react-native';

// Dynamically handle react-native-webrtc to support web / simulators safely
let RTCPeerConnectionNative;
let RTCIceCandidateNative;
let RTCSessionDescriptionNative;
let mediaDevicesNative;

try {
  const webrtc = require('react-native-webrtc');
  if (webrtc) {
    RTCPeerConnectionNative = webrtc.RTCPeerConnection;
    RTCIceCandidateNative = webrtc.RTCIceCandidate;
    RTCSessionDescriptionNative = webrtc.RTCSessionDescription;
    mediaDevicesNative = webrtc.mediaDevices;
  }
} catch (e) {
  console.warn('[WEBRTC_IMPORT_WARN] react-native-webrtc native module fallback:', e?.message);
}

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export class SimulatedMediaStream {
  constructor() {
    this.id = `sim_${Date.now()}`;
    this.active = true;
    this._tracks = [
      { id: 'sim_audio', kind: 'audio', enabled: true, stop: () => {} },
      { id: 'sim_video', kind: 'video', enabled: true, stop: () => {} },
    ];
  }
  getTracks() { return this._tracks; }
  getAudioTracks() { return this._tracks.filter(t => t.kind === 'audio'); }
  getVideoTracks() { return this._tracks.filter(t => t.kind === 'video'); }
  addTrack(t) { this._tracks.push(t); }
  removeTrack(t) { this._tracks = this._tracks.filter(x => x !== t); }
  toURL() { return ''; }
}

export class SimulatedPeerConnection {
  constructor({ onIceCandidate, onConnectionStateChange, onRemoteStream } = {}) {
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.localDescription = null;
    this.remoteDescription = null;
    this.onIceCandidate = onIceCandidate;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onRemoteStream = onRemoteStream;
    this.remoteStream = new SimulatedMediaStream();
  }

  async createOffer() {
    this.localDescription = {
      type: 'offer',
      sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
    };
    return this.localDescription;
  }

  async createAnswer() {
    let sdp = 'v=0\r\no=- 54321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n';
    if (this.remoteDescription?.sdp) {
      const lines = this.remoteDescription.sdp.split(/\r?\n/);
      let currentMLine = null;
      let currentMid = null;

      const finishBlock = () => {
        if (currentMLine) {
          const parts = currentMLine.split(' ');
          const mediaType = parts[0]; // e.g. m=audio, m=video
          const proto = parts[2] || 'UDP/TLS/RTP/SAVPF';
          const payload = parts[3] || '0';
          sdp += `${mediaType} 0 ${proto} ${payload}\r\n`;
          sdp += `c=IN IP4 127.0.0.1\r\n`;
          if (currentMid) {
            sdp += `a=mid:${currentMid}\r\n`;
          }
          sdp += `a=inactive\r\n`;
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('m=')) {
          finishBlock();
          currentMLine = line;
          currentMid = null;
        } else if (line.startsWith('a=mid:')) {
          currentMid = line.substring(6).trim();
        }
      }
      finishBlock();
    } else {
      sdp += 'm=audio 0 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 127.0.0.1\r\na=mid:0\r\na=inactive\r\nm=video 0 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 127.0.0.1\r\na=mid:1\r\na=inactive\r\n';
    }

    this.localDescription = {
      type: 'answer',
      sdp,
    };
    return this.localDescription;
  }

  async setLocalDescription(desc) {
    this.localDescription = desc;
  }

  async setRemoteDescription(desc) {
    this.remoteDescription = desc;
    setTimeout(() => {
      this.connectionState = 'connected';
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange('connected');
      }
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    }, 400);
  }

  async addIceCandidate() {}
  addTrack() {}
  addStream() {}
  getSenders() { return []; }
  close() {
    this.connectionState = 'closed';
  }
}

export class WebRtcClient {
  constructor({ onRemoteStream, onIceCandidate, onConnectionStateChange }) {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.candidateQueue = [];

    this.onRemoteStream = onRemoteStream;
    this.onIceCandidate = onIceCandidate;
    this.onConnectionStateChange = onConnectionStateChange;
  }

  /**
   * Initialize local camera and microphone stream
   */
  async initLocalMedia({ audio = true, video = true } = {}) {
    const media = mediaDevicesNative || (typeof navigator !== 'undefined' ? navigator.mediaDevices : null);
    if (!media || !media.getUserMedia) {
      console.warn(
        '[WEBRTC_DEV_NOTICE] Native WebRTC module not compiled into this APK. Running in simulation mode. Build dev client with "npx expo run:android" for native audio/video hardware.'
      );
      this.localStream = new SimulatedMediaStream();
      return this.localStream;
    }

    try {
      this.localStream = await media.getUserMedia({
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: video
          ? {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
      });

      // Attach tracks if peerConnection is already created
      if (this.peerConnection && this.localStream) {
        if (this.peerConnection.addTrack) {
          const senders = this.peerConnection.getSenders ? this.peerConnection.getSenders() : [];
          this.localStream.getTracks().forEach((track) => {
            const alreadyAdded = senders.some((s) => s.track === track);
            if (!alreadyAdded) {
              this.peerConnection.addTrack(track, this.localStream);
            }
          });
        } else if (this.peerConnection.addStream) {
          this.peerConnection.addStream(this.localStream);
        }
      }

      return this.localStream;
    } catch (err) {
      console.warn('[WEBRTC_MEDIA_WARN] Failed to get audio/video media:', err);
      // Fallback: If video failed, attempt audio only
      if (video) {
        try {
          this.localStream = await media.getUserMedia({
            audio: true,
            video: false,
          });
          return this.localStream;
        } catch (audioErr) {
          console.warn('[WEBRTC_DEV_NOTICE] Hardware access denied. Falling back to simulated stream for call signaling.');
          this.localStream = new SimulatedMediaStream();
          return this.localStream;
        }
      }
      this.localStream = new SimulatedMediaStream();
      return this.localStream;
    }
  }

  /**
   * Instantiate and configure the RTCPeerConnection
   */
  createPeerConnection() {
    if (this.peerConnection) return this.peerConnection;

    const PeerConnectionClass = RTCPeerConnectionNative || (typeof window !== 'undefined' ? window.RTCPeerConnection : null);
    if (!PeerConnectionClass) {
      console.warn(
        '[WEBRTC_DEV_NOTICE] Native RTCPeerConnection driver not found. Initializing simulated peer connection.'
      );
      this.peerConnection = new SimulatedPeerConnection({
        onIceCandidate: this.onIceCandidate,
        onConnectionStateChange: this.onConnectionStateChange,
        onRemoteStream: this.onRemoteStream,
      });
      return this.peerConnection;
    }

    this.peerConnection = new PeerConnectionClass({
      iceServers: DEFAULT_ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    // 1. Send ICE candidates to signaling server
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // 2. Handle remote audio/video tracks
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
      } else if (event.track) {
        // Fallback for single track
        if (!this.remoteStream) {
          const StreamClass = (typeof MediaStream !== 'undefined' ? MediaStream : null);
          this.remoteStream = StreamClass ? new StreamClass() : null;
        }
        if (this.remoteStream && this.remoteStream.addTrack) {
          this.remoteStream.addTrack(event.track);
        }
        if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
      }
    };

    // Legacy onaddstream fallback for older WebRTC engines
    this.peerConnection.onaddstream = (event) => {
      if (event.stream) {
        this.remoteStream = event.stream;
        if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
      }
    };

    // 3. Connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }
    };

    // 4. Attach local stream tracks
    if (this.localStream) {
      if (this.peerConnection.addTrack) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      } else if (this.peerConnection.addStream) {
        this.peerConnection.addStream(this.localStream);
      }
    }

    return this.peerConnection;
  }

  /**
   * Caller: Generate SDP Offer
   */
  async createOffer({ isAudioOnly = false } = {}) {
    this.createPeerConnection();

    const offerOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: !isAudioOnly,
    };

    const offer = await this.peerConnection.createOffer(offerOptions);
    await this.peerConnection.setLocalDescription(offer);
    return this.peerConnection.localDescription;
  }

  /**
   * Callee: Handle SDP Offer and Generate SDP Answer
   */
  async handleOfferAndCreateAnswer(remoteOffer) {
    this.createPeerConnection();

    const SessionDescriptionClass = RTCSessionDescriptionNative || (typeof window !== 'undefined' ? window.RTCSessionDescription : null);
    const desc = SessionDescriptionClass ? new SessionDescriptionClass(remoteOffer) : remoteOffer;

    await this.peerConnection.setRemoteDescription(desc);
    await this.drainCandidateQueue();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return this.peerConnection.localDescription;
  }

  /**
   * Caller: Handle SDP Answer from Callee
   */
  async handleAnswer(remoteAnswer) {
    if (!this.peerConnection) return;

    const SessionDescriptionClass = RTCSessionDescriptionNative || (typeof window !== 'undefined' ? window.RTCSessionDescription : null);
    const desc = SessionDescriptionClass ? new SessionDescriptionClass(remoteAnswer) : remoteAnswer;

    await this.peerConnection.setRemoteDescription(desc);
    await this.drainCandidateQueue();
  }

  /**
   * Add ICE candidate received from signaling server
   */
  async addIceCandidate(candidate) {
    if (!candidate) return;

    const IceCandidateClass = RTCIceCandidateNative || (typeof window !== 'undefined' ? window.RTCIceCandidate : null);
    const ice = IceCandidateClass ? new IceCandidateClass(candidate) : candidate;

    if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
      try {
        await this.peerConnection.addIceCandidate(ice);
      } catch (err) {
        console.warn('[WEBRTC_ICE_WARN] Failed to add candidate:', err);
      }
    } else {
      this.candidateQueue.push(ice);
    }
  }

  /**
   * Flush queued candidates once remote description is set
   */
  async drainCandidateQueue() {
    if (!this.peerConnection || !this.candidateQueue.length) return;
    while (this.candidateQueue.length > 0) {
      const candidate = this.candidateQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[WEBRTC_DRAIN_WARN] Failed to drain candidate:', err);
      }
    }
  }

  /**
   * Switch between Front and Back camera (mobile only)
   */
  switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack._switchCamera === 'function') {
        videoTrack._switchCamera();
        return true;
      }
    }
    return false;
  }

  /**
   * Mute / Unmute microphone track
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Enable / Disable local video camera track
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Clean up all media tracks, listeners, and peer connection
   */
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (_) {}
      this.peerConnection = null;
    }

    this.candidateQueue = [];
  }
}
