# node-webrtc-segfault

This is a test code for showcasing a segfault error in lib node-webrtc v0.0.66

## usage:

1) clone repo

2)

```
npm install
npm start
```

3) open browser: localhost:8080
4) click start

## 'Documentation:'

1) On button click, a new webrtc connection is created, using HTTP post to send the `candidate` to the server.
2) once its `connected` server send some packets and closes the connection impertinently
