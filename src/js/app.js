// load parameters
const pathname = window.location.pathname.match(/^.*[\/]/)[0] // until the trailing slash, do not include the filename
const hashParams = window.location.hash.substring(1).split('&').reduce(function (res, item) {
  var parts = item.split('=')

  res[parts[0]] = parts[1]

  return res
}, {})

// set up editor
ace.config.set("loadWorkerFromBlob", false)

const editor = ace.edit("editor")

editor.setTheme("ace/theme/monokai")
editor.session.setMode("ace/mode/javascript")
if(hashParams['encodedString']){
  editor.setValue(plantumlEncoder.decode(hashParams['encodedString']), -1)
}
editor.focus()

function _render(){
  plantuml.renderPng(editor.getValue()).then((blob) => {
    document.getElementById('render-image').src = window.URL.createObjectURL(blob)
  }).catch((error) => {
    console.log(error)
  })
}

function debounce(func, delay = 400) {
  let timerId

  return (...args) => {
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  };
}

const debouncedRender = debounce(() => _render())

async function loadFromUrl(url){
  window.location.hash = `#example=${url}`

  const response = await fetch(url)
  const pumlContent = await response.text()

  editor.setValue(pumlContent, -1)
  editor.focus()
}

const debouncedLoadFromUrl = debounce((url) => loadFromUrl(url))
const jarPath = "/app" + pathname + "jar"

plantuml.initialize(jarPath).then(() => {
  debouncedRender()

  editor.session.on('change', function() {
    debouncedRender()
  })
})

const element = document.querySelector('#right-panel-image-wrapper')

panzoom(element)

const resizer = document.querySelector('#resizer')
const sidebar = document.querySelector('#sidebar')
const sidePanel = document.querySelector('#sidePanel')

resizer.addEventListener('mousedown', () => {
  document.addEventListener('mousemove', resize, false)
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', resize, false)
  }, false)
})

function resize(e) {
  const x = Math.max(e.x, 200)
  const size = `${x}px`

  sidebar.style.width = size
  sidePanel.style.width = size
}
