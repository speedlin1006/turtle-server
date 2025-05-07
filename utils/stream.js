// utils/stream.js
const { spawn } = require('child_process')
const path = require('path')

function startStream() {
  const streamUrl = 'rtsp://speedlin1006:Speedlin9091@192.168.0.105:554/stream1'
  const outputDir = path.join(__dirname, '../public/hls')
  const outputPath = path.join(outputDir, 'stream.m3u8')

  const ffmpeg = spawn('C:\\Users\\tlogin\\Desktop\\binffmpeg.exe', [
    '-rtsp_transport', 'tcp',
    '-i', streamUrl,
    '-f', 'hls',
    '-hls_time', '3',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-g', '45',
    '-r', '15',
    '-an',
    outputPath
  ])

  ffmpeg.stderr.on('data', data => console.error(`[ffmpeg] ${data}`))
  ffmpeg.on('close', code => console.log(`ffmpeg exited with code ${code}`))
}

module.exports = {
  startStream
}

