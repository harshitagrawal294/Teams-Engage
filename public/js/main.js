// Global Variable Initialisation
var isChannelReady = false;
var isInitiator = false; // Whether current user has created the room
var isStarted = false;

// Initialise turn configration
var pcConfig = turnConfig;

var localStreamConstraints = {
    audio: true,
    video: true
};

// Create or Join room from user provided input
bootbox.prompt({
  title: "Please enter room you want to join or create:",
  callback: function (result) {

      // Check if a valid room name is entered
      if(!result || result===""){
        window.location.replace('/');
      }

      var room=result;
      // Display room name on page
      document.getElementById("room name").innerHTML = room;
      var socket = io.connect();

      socket.emit('create or join', room);

      // Alert user about room creation
      socket.on('created', function(room) {
        bootbox.alert('Created room ' + room);
        isInitiator = true; // current user is the creator of room
      });
      
      // Display msg if the room already has two participants
      socket.on('full', function(room) {
        bootbox.dialog({
          message: "Room- "+room+" is full",
          buttons: {
              ok: {
                  label: "Join Another Room",
                  className: 'btn-primary',
                  callback: function(){
                    window.location.replace('/');
                  }
              }
          }
        });        
      });

      // Someone joins a room
      socket.on('join', function (room){
        isChannelReady = true;
      });

      socket.on('joined', function(room) {
        bootbox.alert('You have joined room- ' + room);
        isChannelReady = true;
      });
      
      // Log messages
      socket.on('log', function(array) {
        console.log.apply(console, array);
      });

      var pc;
      socket.on('message', function(message, room) {
          if (message === 'got user media') {
            maybeStart();
          } else if (message.type === 'offer') {
            if (!isInitiator && !isStarted) {
              maybeStart();
            }
            pc.setRemoteDescription(new RTCSessionDescription(message));
            doAnswer();
          } else if (message.type === 'answer' && isStarted) {
            pc.setRemoteDescription(new RTCSessionDescription(message));
          } else if (message.type === 'candidate' && isStarted) {
            var candidate = new RTCIceCandidate({
              sdpMLineIndex: message.label,
              candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
          } else if (message === 'bye' && isStarted) {
            handleRemoteHangup();
          }
      });
      
      // Send message in room
      function sendMessage(message, room) {
        socket.emit('message', message, room);
      }
      
      // Local and remote video of participants
      var localVideo = document.querySelector('#localVideo');
      var remoteVideo = document.querySelector('#remoteVideo');

      // Alert user if camera is being used elsewhere
      navigator.mediaDevices.getUserMedia(localStreamConstraints)
      .then(gotStream)
      .catch(function(e) {
        bootbox.dialog({
          message: 'Turn of Camera use elsewhere and check camera permissions',
          buttons: {
              ok: {
                  label: "Ok",
                  className: 'btn-primary',
                  callback: function(){
                    window.location.replace('/');
                  }
              }
          }
        });        
      });
      
      // Initialise local stream
      var localStream;
      function gotStream(stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        sendMessage('got user media', room);
        if (isInitiator) {
          maybeStart();
        }
      }
      
      // create peer connection
      function maybeStart() {
        if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
          createPeerConnection();
          pc.addStream(localStream);
          isStarted = true;
          if (isInitiator) {
            doCall();
          }
        }
      }
      
      window.onbeforeunload = function() {
        sendMessage('bye', room);
      };
      
      function createPeerConnection() {
        try {
          pc = new RTCPeerConnection(pcConfig);
          pc.onicecandidate = handleIceCandidate;
          pc.onaddstream = handleRemoteStreamAdded;
          pc.onremovestream = handleRemoteStreamRemoved;
        } catch (e) {
          bootbox.alert('Unable to create RTCPeerConnection object.');
          return;
        }
      }
      
      function handleIceCandidate(event) {
        if (event.candidate) {
          sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          }, room);
        } else {
          console.log('End of candidates.');
        }
      }
      
      function handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
      }
      
      // Create offer 
      function doCall() {
        pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
      }
      
      // Answer Offer
      function doAnswer() {
        pc.createAnswer().then(
          setLocalAndSendMessage,
          onCreateSessionDescriptionError
        );
      }
      
      function setLocalAndSendMessage(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        sendMessage(sessionDescription, room);
      }
      
      function onCreateSessionDescriptionError(error) {
        trace('Failed to create session description: ' + error.toString());
      }
      
      // Initialise and play remote stream
      var remoteStream;
      function handleRemoteStreamAdded(event) {
        remoteStream = event.stream;
        remoteVideo.srcObject = remoteStream;
        if(isInitiator){
          bootbox.alert("Particiapant has joined the conference");
        }
      }
      
      function handleRemoteStreamRemoved(event) {
        console.log('Remote stream removed. Event: ', event);
      }
      
      function hangup() {
        stop();
        sendMessage('bye',room);
      }
      
      // Alert user if other participant leaves the conference
      function handleRemoteHangup() {
        stop();
        isInitiator = false;
        bootbox.dialog({
          message: "Participant has left the conference",
          buttons: {
              ok: {
                  label: "Join/Create Another Room",
                  className: 'btn-primary',
                  callback: function(){
                    window.location.replace('/');
                  }
              }
          }
        });   
      }
      
      function stop() {
        isStarted = false;
        pc.close();
        pc = null;
      }
  }
});








