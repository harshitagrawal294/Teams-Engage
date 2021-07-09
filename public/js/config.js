turnConfig = {
    iceServers: [
    {   
      urls: [ "stun:bn-turn1.xirsys.com" ]
    }, 
    {   
      username: "o9bsLoxBNLjC2x6OEauxIKA0cOaWnur5YekBdgQjQ8q2SZGGhQqp3btmWUmd6eoSAAAAAGDaCyVoYXJyb2Nrcw==",   
      credential: "e11d81c2-d838-11eb-af69-0242ac140004",   
      urls: [       
        "turn:bn-turn1.xirsys.com:80?transport=udp",       
        "turn:bn-turn1.xirsys.com:3478?transport=udp", 
		    "turn:bn-turn1.xirsys.com:80?transport=tcp",     
		    "turn:bn-turn1.xirsys.com:3478?transport=tcp", 
        "turns:bn-turn1.xirsys.com:443?transport=tcp",       
        "turns:bn-turn1.xirsys.com:5349?transport=tcp"
       ]
     }
   ]
}


