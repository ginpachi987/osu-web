/// <reference types="../node_modules/@types/p5/global" />

// import * as p5 from '../node_modules/p5/lib/p5.js'

let logo
let loading
let loadingProgress
let files
let loaded
let loadingDone

let beatmap
let beatmaps
let beatmapList

let rawBeatmap
// const beatmaps = [
//   { folder: '24743 FLiP - Katoniago (TV Size)', file: 'FLiP - Katoniago (TV Size) (jericho2442) [Gintoki].osu' },
//   { folder: '1565827 Utada Hikaru - One Last Kiss', file: 'Utada Hikaru - One Last Kiss (moph) [Normal].osu' },
//   { folder: '1639480 ichigo from KISIDA KYODAN & THE AKEBOSI ROCKETS - STONE OCEAN (TV Size)', file: 'ichigo from KISIDA KYODAN & THE AKEBOSI ROCKETS - STONE OCEAN (TV Size) (Sotarks) [Akitoshi\'s NORMAL].osu' },
// ]

let cursor
let cursorSize = 64
let cursorAngle = 0
let hitSound
let hitSoundPlaying = true

let hitCount = 0
let giornoTakeover = false

let giorno

let touching = false

let startButton
let loadingCallback

let buttons = {}

let font

function preload() {
  logo = loadImage('img/logo.png')
  font = loadFont('fonts/Roboto-Regular.ttf')
}

function preloading() {
  setLoader(4)
  loadingCallback = initLoadingEnded
  hitSound = loadSound('sound/sound_hitnormal.ogg', updateLoading);
  giorno = loadSound('sound/giorno.mp3', updateLoading);
  cursor = loadImage('img/cursor.png', updateLoading);

  getBeatmaps()
}

function getBeatmaps() {
  changeDivOpacity(0)

  setTimeout(() => {
    beatmaps = []
    beatmapList.innerHTML = ''

    fetch('https://games.yoro.dev/osu/request.php')
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        beatmaps = data;

        beatmaps.forEach(beatmap => {
          let el = document.createElement('div')
          el.classList.add('beatmap')
          let name = beatmap.folder.slice(beatmap.folder.indexOf(' '))
          let title = document.createElement('div')
          title.innerHTML = name
          title.classList.add('title')
          el.appendChild(title)

          maps = document.createElement('div')
          maps.classList.add('maps')

          beatmap.beatmaps.forEach(file => {
            let map = document.createElement('div')
            map.classList.add('map')
            map.innerHTML = file.match(/\[.*\]/)[0]

            map.addEventListener('click', () => {
              loadBeatmap(beatmap.folder, file)
            })

            maps.appendChild(map)
          })

          el.appendChild(maps)
          beatmapList.appendChild(el)
        })


        if (loadingCallback) {
          updateLoading()
        }
        else {
          changeDivOpacity(1)
        }
      });
  }, beatmaps ? beatmaps.length * 200 : 1000)
}

function setLoader(fileCount) {
  files = fileCount
  loaded = 0
  loadingProgress = 0
  loadingDone = 0
  loading = true

  beatmapList.style.display = 'none'
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(60)
  imageMode(CENTER)
  textAlign(CENTER)
  soundFormats('mp3', 'ogg');
  textFont(font)

  document.addEventListener('keydown', (key) => {
    if (giornoTakeover) return
    switch (key.code) {
      case 'KeyZ':
      case 'KeyX':
      case 'Space':
        hitCount++
        if (hitCount > 20) {
          giornoTakeover = true
          if (beatmap) {
            beatmap.audio.stop()
          }
          giorno.play(0.3, 1, 0.5, 225)
        }
        mousePressed()
        break;
      case 'KeyR':
        resetBeatmap()
        break
      case 'KeyP':
        pauseGame()
        break
      default:
        break;
    }
  })

  document.addEventListener('keyup', (key) => {
    const hitKeys = ['KeyZ', 'KeyX', 'Space']
    if (hitKeys.includes(key.code)) {
      hitCount = 0
      mouseReleased()
    }
  })

  beatmapList = document.querySelector('#beatmaps')

  const buttonsIDs = ['menu', 'pause', 'update', 'reset']
  buttonsIDs.forEach(id => {
    let button = document.querySelector(`#${id}`)
    buttons[id] = button
  })

  preloading()
}

function resetBeatmap() {
  if (beatmap) {
    beatmap.audio.stop()

    setTimeout(() => {
      beatmap.audio.play()
    }, 1000)

  }
}

function toMenu() {
  if (!beatmap) return
  beatmapList.style.display = 'flex'
  //startButton.show()
  beatmap.audio.stop()
  beatmap = null

  buttons.menu.style.display = 'none'
  buttons.pause.style.display = 'none'
  buttons.reset.style.display = 'none'
  buttons.update.style.display = 'inline'
  buttons.pause.innerText = 'Pause'

  changeDivOpacity(1)
}

function pauseGame() {
  if (beatmap) {
    if (beatmap.audio.isPlaying()) {
      beatmap.audio.pause()
      buttons.pause.innerText = 'Resume'
    }
    else {
      beatmap.audio.play()
      buttons.pause.innerText = 'Pause'
    }
  }
}

function draw() {
  background(41);

  if (loading) {
    drawLoading()
  }
  else {
    mainDrawing()
  }

  //console.log(giorno.currentTime())
}

function mainDrawing() {
  if (beatmap) beatmap.drawInfo()

  push()
  //translate(mouseX, mouseY)
  rotate(cursorAngle)
  cursorAngle -= 0.005
  if (cursorAngle + PI / 2 <= 0.005) {
    //console.log('reset')
    cursorAngle = 0
  }
  image(cursor, 0, 0, cursorSize, cursorSize)
  pop()
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  //startButton.position(windowWidth / 2, windowHeight - 50)
}

function mousePressed() {
  if (giornoTakeover || loading) return
  cursorSize = 72
  hitSound.play(0, 1, 0.5)
}

function mouseReleased() {
  if (loading) return
  cursorSize = 64
  //loadPixels()
}

function drawLoading() {
  push()
  //translate(windowWidth / 2, windowHeight / 2)
  image(logo, 0, -64, 256, 256)

  stroke(255)
  strokeWeight(3)
  noFill()
  rect(-150, 128, 300, 32, 20)
  noStroke()
  fill(255)
  rect(-150, 128, loadingDone, 32, 20)

  textSize(24)
  text('Loading', 0, 108)

  if (loadingDone < loadingProgress) {
    loadingDone += floor(random() * loaded * 5)

    if (loadingDone > loadingProgress) loadingDone = loadingProgress
  }
  if (loadingDone >= loadingProgress && loadingProgress == 300) {
    loading = false
    loadingCallback()
    loadingCallback = null
    //loadingProgress++
  }
  pop()
}

function initLoadingEnded() {
  setTimeout(() => {

    // startButton.show()
    // beatmaps.forEach(beatmap => {
    //   beatmap.button.show()
    // })

    beatmapList.style.display = 'flex'
    buttons.update.style.display = 'inline'

    changeDivOpacity(1)

    //document.querySelector('body').style.cursor = 'none'
  }, 1000)
}

function changeDivOpacity(opacity) {
  document.querySelectorAll('.beatmap').forEach((el, i) => {
    setTimeout(() => {
      el.style.opacity = opacity
    }, 100 * (i + 1))

  })
}

function touchStarted() {
  if (touching) return
  touching = true
  mousePressed()
}

function touchEnded() {
  touching = false
  mouseReleased()
}

function updateLoading() {
  loaded++
  loadingProgress = 300 / (files - loaded + 1)
}

function loadBeatmap(folder, file) {
  //console.log(folder, file)
  if (loading || beatmap) return
  //startButton.hide()
  loadingCallback = startBeatmap
  changeDivOpacity(0)
  buttons.update.style.display = 'none'
  setLoader(3)
  const bf = 'beatmaps'

  fetch(`./${bf}/${folder}/${file}`).then(resp => resp.blob()).then(blob => {
    blob.text().then(osuFile => {
      //console.log(osuFile)
      beatmap = parseOsu(osuFile)
      //console.log(beatmap)
      updateLoading()

      beatmap.audio = loadSound(`${bf}/${folder}/${beatmap.audioFilename}`, () => {
        updateLoading()
      })

      if (beatmap.imageFile)
        beatmap.background = loadImage(`${bf}/${folder}/${beatmap.imageFile}`, () => {
          updateLoading()
        })
    })
  })
}

function startBeatmap() {
  buttons.menu.style.display = 'inline'
  buttons.pause.style.display = 'inline'
  buttons.reset.style.display = 'inline'

  buttons.pause.disabled = true
  setTimeout(() => {
    buttons.pause.disabled = false
    beatmap.audio.play()
  }, 1000)
}

function parseOsu(osuFile) {
  const version = osuFile.split('\n')[0].match(/[0-9]+/)[0]
  const regex = {
    section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
    param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
    comment: /^\s*;.*$/
  };
  rawBeatmap = {};
  const lines = osuFile.split(/[\r\n]+/);
  let section = null;
  lines.forEach((line) => {
    if (regex.comment.test(line)) return

    if (regex.section.test(line)) {
      const match = line.match(regex.section)[1].toLowerCase()
      rawBeatmap[match] = []
      section = match
    } else {
      if (section) rawBeatmap[section].push(line)
    }
  })

  //   if (regex.param.test(line)) {
  //     var match = line.match(regex.param);
  //     if (section) {
  //       value[section][match[1]] = match[2];
  //     } else {
  //       value[match[1]] = match[2];
  //     }
  //   } else if (regex.section.test(line)) {
  //     var match = line.match(regex.section);
  //     value[match[1]] = {};
  //     section = match[1];
  //   } else if (line.length == 0 && section) {
  //     section = null;
  //   };
  // });
  return new Beatmap(rawBeatmap, version)
}

class Beatmap {
  constructor(data, version) {
    HitObject.color = 0
    HitObject.number = 0
    console.log(data)
    data.metadata.forEach(line => {
      const match = line.match(/^\s*(\w+)\s*:\s*(.*?)\s*$/)
      this[match[1].toLowerCase()] = match[2]
    })
    this.colors = []
    data.colours.forEach(line => {
      const match = line.match(/^\s*(\w+)\s*:\s*(.*?)\s*$/)
      const [r, g, b] = match[2].split(',')
      //console.log(color(r, g, b))

      if (match[1].replace(' ', '') == 'SliderBorder') this.borderColor = color(r, g, b)
      else this.colors.push(color(r, g, b))
      // this.colors.push(color(r, g, b))
    })
    this.difficulty = {}
    data.difficulty.forEach(line => {
      const match = line.match(/^\s*(\w+)\s*:\s*(.*?)\s*$/)
      this.difficulty[match[1]] = match[2]
    })
    this.hitObjects = []
    data.hitobjects.forEach(line => {
      this.hitObjects.push(new HitObject(line, this.colors.length, version))
    })
    data.general.forEach(line => {
      const match = line.match(/^\s*(\w+)\s*:\s*(.*?)\s*$/)
      if (match[1] == 'AudioFilename') {
        this.audioFilename = match[2]
      }
    })

    console.log(data.events[1], data.events[2])
    let bg = 1
    if (data.events[1].substr(0, 1) !== '0') {
      bg++
    }
    this.imageFile = data.events[bg].split('"')[1]
  }

  drawInfo() {
    push()
    //translate(windowWidth / 2, windowHeight / 2)
    if (beatmap.background) {
      rectMode(CENTER)
      let scale = max(windowWidth / beatmap.background.width, windowHeight / beatmap.background.height)
      let halfwidth = beatmap.background.width * scale / 2
      let halfheight = beatmap.background.height * scale / 2
      image(beatmap.background, 0, 0, halfwidth * 2, halfheight * 2)
      fill(0, 70)
      rect(0, 0, halfwidth * 2, halfheight * 2)
    }
    pop()
    push()
    textAlign(RIGHT)
    // stroke(0)
    // strokeWeight(4)
    noStroke()
    fill(255)
    textSize(18)
    text(`${this.title}`, windowWidth - 20, 40)
    text(`by ${this.artist}`, windowWidth - 20, 60)
    text(`Difficulty: ${this.version}`, windowWidth - 20, 80)

    pop()

    push()
    //translate((windowWidth - 640) / 2, (windowHeight - 480) / 2)
    const currentTime = floor(beatmap.audio.currentTime() * 1000)
    this.hitObjects.filter(el => {
      let typeS = el.type === 'S'
      let display = el.time - currentTime > el.duration
      let displayS = el.time <= currentTime && display
      let displayNotS = (el.time - currentTime) < 1000 && display

      return (typeS && displayS) || (!typeS && displayNotS)

    }).reverse().forEach(hit => hit.draw(currentTime))

    pop()
  }
}

class HitObject {
  static color = 0
  static number = 0
  static z = 0

  constructor(rawData, cols, version) {
    let constr
    switch (version) {
      case 7:
        constr = this.constructorV7
        break;
      default:
        constr = this.constructorV7
        break;
    }
    let data = rawData.split('|').map(el => el.split(','))
    let combo
    [this.points, this.time, this.duration, combo, this.type] = constr(data)

    if ([4, 5, 6].includes(parseInt(combo))) {
      HitObject.number = 0
      HitObject.color++
    }
    this.col = HitObject.color % cols
    this.num = ++HitObject.number
    //this.rest = rest
  }

  constructorV7(data) {
    let points = []
    let x = parseInt(data[0][0])
    let y = parseInt(data[0][1])
    points.push({ x: x, y: y })
    for (let i = 1; i < data.length - 1; i++) {
      if (!data[i][0].match(/[0-9]*:[0-9]*/)) break
      let point = data[i][0].split(':').map(el => parseInt(el))
      points.push({ x: point[0], y: point[1] })
    }
    let time = parseInt(data[0][2])
    let combo = parseInt(data[0][3])
    let type = data[0][5] == 0 ? 'P' : data[0][5] > 0 ? 'S' : data[0][5]
    let duration = type === 'S' ? time - parseInt(data[0][5]) : 0

    return [points, time, duration, combo, type]
  }

  draw(currentTime) {
    push()
    //translate(0,0,HitObject.z+=0.01)
    if (this.type == 'S') {
      stroke(0)
      strokeWeight(4)
      fill(255)
      //circle(640 / 2, 480 / 2, 480)
      circle(0, 0, 480)
    } else {
      stroke(beatmap.borderColor || 255)
      strokeWeight(4)
      fill(beatmap.colors[this.col])
      circle(this.points[0].x, this.points[0].y, 100)

      strokeWeight(2)
      noFill()
      stroke(255, 90)
      circle(this.points[0].x, this.points[0].y, 100 + (this.time - currentTime) / 4)
      textAlign(CENTER)
      fill(255)
      stroke(0)
      strokeWeight(2)
      textSize(48)
      text(this.num, this.points[0].x, this.points[0].y + 16)
    }
    pop()
  }
}