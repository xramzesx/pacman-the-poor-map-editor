console.log("loaded : script.js")

function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj))
}

function isObjFromSameClass(source, template){
    for (let i in template)
        if (source[i] === undefined)
            return false
    return true
}

let canvasMenu
let canvasGenerator
const fileSupport = new FileSupport()

const defaults = {
    fieldSize : {
        height: 12,
        width: 12
    },
    scale : 2,
    field :{
        empty : {
            source : {
                offsetX : 0,
                offsetY : 2 * 12 * 2,
            }
        }
    },
    img : new Image()
}

const session = {
    history : {
        arr : [[]],
        arrIndex : 0,
        add : () => {
            const { elements } = canvasGenerator
            const currentTime = []
            
            for (let i in elements){
                for (let j in elements[i]){
                    if (elements[i][j].isNotEmpty){
                        const element = JSON.parse(JSON.stringify(elements[i][j].export))
                        currentTime.push( element )
                    }
                }
            }
            console.log('taka se długość: ', currentTime.length)

            session.history.arr = session.history.arr.splice(0, session.history.arrIndex + 1)
            session.history.arr.push(currentTime)
            session.history.arrIndex = session.history.arr.length - 1
        },
        
    } ,
    file : {
        save(){
            fileSupport.save(
                session.history.arr[session.history.arrIndex],
                `pacman_save_${Date.now()}.pac.json`,
                true
            )
        },
        load(){
            fileSupport.load( (data) => {
                session.history.arrIndex = 0
                session.history.arr = [ cloneObj( JSON.parse(data) ) ]
                session.history.add()
                session.undo()
                session.history.arr.pop()
            } )
        }
    },
    clear : (rawElements) =>{
        const { elements } = canvasGenerator
        for (let i in rawElements){
            const { grid } = rawElements[i].canvas
            const current = {
                source : rawElements[i].source,
                x: grid.x,
                y: grid.y,
            }
            elements[current.y][current.x].setImage(current, 1 )
        }
        canvasGenerator.draw.refresh(true)
    },
    undo : () => {
        const { history } = session
        if (--session.history.arrIndex < 0)
            session.history.arrIndex = 0
        const { arrIndex } = session.history

        if (arrIndex == 0 || session.history.arr[session.history.arrIndex].length == 0 ){
            canvasGenerator.draw.gfxes()
        }

        session.paste.lastEvent = 'cut'
        console.log('undo', history.arrIndex)
    },
    redo : () => {
        const { history } = session
        if (++session.history.arrIndex >= history.arr.length)
            session.history.arrIndex = history.arr.length - 1
        const { arrIndex } = session.history

        if (arrIndex == 0 || session.history.arr[session.history.arrIndex].length == 0 ){
            canvasGenerator.draw.gfxes()
            canvasGenerator.drawGrid(true)
        }
        session.paste.lastEvent = 'cut'

    },
    copy :{
        area : [],      // only field positions (no gfxes)
        event :(cut = true) => {
            const { selected } = canvasGenerator.currentElement
            if (selected.length > 0){
                const area = []
                for (let i in selected){
                    const tmp = {
                        canvas : JSON.parse(JSON.stringify(selected[i].export.canvas)),
                        isNotEmpty : JSON.parse(JSON.stringify(selected[i].isNotEmpty)),
                        source : cut ? cloneObj(selected[i].export.source) : undefined,
                    }
                    area.push(tmp)
                }
                session.copy.area = area
                session.paste.lastEvent = 'copy'
                session.paste.prevent.firstPaste = true
            }
            canvasGenerator.currentElement.selected = []
        }
    },
    paste : {
        lastEvent : '',
        area : [],
        ready : false,
        point : { x : 0, y : 0 },
        prevent : {
            point : {x : 0, y : 0},
            firstPaste : false
        },
        action: () => {
            const { area } = session.paste
            const { point } = session.paste
            const { elements } = canvasGenerator
            const { history } = session
            if (history.arr[history.arrIndex].length <= 0){
                const { empty } = defaults.field
                for (let i in elements)
                    for (let j in elements)
                        elements[i][j].setImage(empty, 0)
            }
            for (let i in area) {
                const { grid } = area[i].canvas
                const { source } = area[i]
                const current = {
                    source : area[i].isNotEmpty ? JSON.parse(JSON.stringify(source)) : defaults.field.empty ,
                    x: grid.x + point.x,
                    y: grid.y + point.y, 
                }
                try{
                    elements[current.y][current.x].setImage(current, area[i].isNotEmpty)//false
                } catch {}
            }
            console.log(history)

            session.paste.ready = false
            session.history.add()
        },
        event :() => {
            const { elements } = canvasGenerator
            const { paste, history } = session
            const currentHist = history.arr[history.arrIndex]
            canvasGenerator.currentElement.selected = []
            paste.area = []

            const { prevent } = paste
            
            if (paste.lastEvent == 'copy'){
                const { copy } = session
                if (prevent.firstPaste)
                    paste.point = {
                        x : copy.area[0].canvas.grid.x,
                        y : copy.area[0].canvas.grid.y,
                    }
                for (let i in copy.area){
                    const { canvas : tmpCanv } = copy.area[i]
                    const { grid } = tmpCanv
                    const tmp = {
                        canvas : cloneObj(tmpCanv),
                        source : cloneObj(elements[grid.y][grid.x].source),
                        isNotEmpty : cloneObj(canvasGenerator.getElement(copy.area[i]).isNotEmpty) // copy.area[i].isNotEmpty
                    }
                    
                    if (prevent.firstPaste){
                        if (paste.point.x > grid.x)
                            paste.point.x = cloneObj(grid.x)
                        if (paste.point.y > grid.y)
                            paste.point.y = cloneObj(grid.y)
                    }
                    paste.area.push(tmp)
                }
            } else if (paste.lastEvent == 'cut'){
                const { cut } = session
                if (prevent.firstPaste)
                    paste.point = {
                        x : cut.area[0].canvas.grid.x,
                        y : cut.area[0].canvas.grid.y,
                    }
                for (let i in cut.area){
                    const { grid } = cut.area[i].canvas
                    console.log()
                    if (prevent.firstPaste){
                        if (paste.point.x > grid.x)
                            paste.point.x = cloneObj(grid.x)
                        if (paste.point.y > grid.y)
                            paste.point.y = cloneObj(grid.y)
                    }
                    paste.area.push(cloneObj(cut.area[i]))
                }
            }
            if (session.paste.prevent.firstPaste){
                session.paste.prevent.point = paste.point
                session.paste.prevent.firstPaste = false
            }else{
                paste.point = session.paste.prevent.point
            }

            for (let i in paste.area){
                paste.area[i].canvas.grid.x -= paste.point.x
                paste.area[i].canvas.grid.y -= paste.point.y
            }
            
            console.log(paste.point.x, paste.point.y)
            paste.ready = true
            session.paste = paste
        }
    },
    cut : {
        area : [],      // field postions and gfxes
        event :() => {
            const { selected } = canvasGenerator.currentElement
            const { height, width } = defaults.fieldSize
            const area = [];
            if (selected.length > 0){
                for (let i in selected){
                    const { export : tmp } = selected[i];
                    tmp.source.offsetX = tmp.source.x * width
                    tmp.source.offsetY = tmp.source.y * height
                    tmp.isNotEmpty = cloneObj(canvasGenerator.getElement(selected[i].export).isNotEmpty) // copy.area[i].isNotEmpty
                    console.log('=>',tmp.isNotEmpty, tmp.source)
                    area.push( cloneObj(tmp) );
                }
                console.log(area)
                session.cut.area = area
                session.paste.lastEvent = 'cut'
                session.paste.prevent.firstPaste = true
                session.delete()
            }
        },
    },
    delete : ()=>{
        const selected = canvasGenerator.currentElement.selected

        for (let i in selected){
            selected[i].setImage(defaults.field.empty, 0)
        }                
        if (selected.length)
            session.history.add()
        canvasGenerator.currentElement.selected = []
    }
    
}

defaults.img.src = "gfx/spritemap-384.png"

window.addEventListener("DOMContentLoaded", (event) => {
    const menu = {
        fields : {
            x: 16,
            y: 40
        },
        name : "canvasMenu"
    }
    const generator = {
        fields : {
            x: 40,
            y: 40
        },
        name : "canvasGenerator"
    }
    canvasMenu = new CanvasField(menu, ()=>{console.log('elo')})
    canvasGenerator = new CanvasField(generator)
          canvasGenerator.shiftKey = false
          canvasGenerator.ctrlKey = false
          canvasGenerator.selectionArea = {
              start : {
                  x: 0,
                  y: 0,
              },
              end : {
                  x : 0,
                  y : 0,
              },
              mousedown : false,
              array : []
          }
          canvasGenerator.currentElement.selected = []
    
    defaults.img.onload = function () {
        let firstSeries = true,
            defaultIterator = 1
        
        for (let i = 1; i <= 40; i++){
            let rowsField = []
            for (let j = defaultIterator; j <= 16; j++){
                const position = {
                    source : {
                        x : firstSeries ? j - 1 : j - 1 + 16,
                        y : firstSeries ? i - 1 : i -1 - 20
                    },
                    destination : {
                        x : j - 1,
                        y : i - 1,
                    },
                    ctx : canvasMenu.ctx
                }
                const field = new Field(position)   //j - 1, i - 1
                rowsField.push(field)   
            }
            canvasMenu.elements.push(rowsField)
            if (firstSeries && i == 20){
                firstSeries = false
                console.log('bruh')
            }
        }
        canvasMenu.drawGrid()
        for (let i = 1; i <= canvasGenerator.fields.y; i++){
            let rowsField = []
            for (let j = 1; j <= canvasGenerator.fields.x; j++){
                const position = {
                    source : {
                        x: 0,
                        y: 2
                    },
                    destination : {
                        x : j - 1,
                        y : i - 1,
                    },
                    ctx : canvasGenerator.ctx
                }
                const field = new Field(position)
                rowsField.push(field)
            }
            canvasGenerator.elements.push(rowsField)
        }

        canvasGenerator.drawGrid()
    }

    document.addEventListener("keydown", function(e) {
        canvasGenerator.ctrlKey = navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey
        canvasGenerator.shiftKey = e.shiftKey

        if ((e.key.toLowerCase() == 'l' || e.key.toLowerCase() == "s") && canvasGenerator.ctrlKey) {
            e.preventDefault();
        }

        switch(e.key){
            case "Delete":
                session.delete()
                console.log('del')
                break

            case "a":
            case "A":
                if (e.ctrlKey){
                    let { selected } = canvasGenerator.currentElement
                    const { elements } = canvasGenerator
                    
                    selected = []
                    for (let i in elements)
                        for (let j in elements[i])
                            selected.push(elements[i][j])
                    canvasGenerator.currentElement.selected = selected
                }
                break
            case "z":
            case "Z":
                if (e.ctrlKey)
                    if (e.shiftKey)
                        session.redo()
                    else
                        session.undo()
                break
            case 'y':
            case 'Y':
                if (e.ctrlKey)
                    session.redo()
                break
            case 'c':
            case 'C':
                if (e.ctrlKey)
                    session.copy.event()
                break
            case 'x':
            case 'X':
                if (e.ctrlKey)
                    session.cut.event()
                break
            case 'v':
            case 'V':
                if (e.ctrlKey)
                    session.paste.event()
                break
            case 'Escape':
                if (session.paste.ready == false)
                    options.toggle()
                session.paste.ready = false
                break
            case 's':
            case 'S':
                if (e.ctrlKey)
                    session.file.save()
                break
            case 'l':
            case 'L':
                if (e.ctrlKey)
                    session.file.load()
                break
            default:
                break
        }

        
        console.log(`${e.ctrlKey ? 'Ctrl + ':''}${e.shiftKey ? 'Shift + ': ''}${e.key != "Meta" && e.key != "Control" && e.key !='Shift' ? e.key:''}`)
      }, false);

    document.addEventListener('keyup', function(e) {
        canvasGenerator.ctrlKey = false
        canvasGenerator.shiftKey = false
    })

    canvasMenu.addEventListener("mousemove", (event)=>{
        const { fieldSize, scale } = defaults
        const client = canvasMenu.getClient(event)

        try{
            if (canvasMenu.currentElement.hover != canvasMenu.currentElement.selected)
            canvasMenu.currentElement.hover.drawImage(true)
        } catch { }
        canvasMenu.currentElement.hover = canvasMenu.elements[client.y][client.x]
        canvasMenu.currentElement.hover.drawImage(true, 1)
    })
    canvasMenu.addEventListener("click", (event)=>{
        if(!session.paste.ready){
            const client = canvasMenu.getClient(event)
            try{
                canvasMenu.currentElement.selected.drawImage(true)
            } catch { }
            canvasMenu.currentElement.selected = canvasMenu.elements[client.y][client.x]
            canvasMenu.currentElement.selected.drawImage(true, 1)
            
            let { selected } = canvasGenerator.currentElement
    
            if (Array.isArray(canvasGenerator.currentElement.selected)){
    
                for (let i in selected){
                    selected[i].setImage(canvasMenu.currentElement.selected, 1)
                }
    
            } else {
                selected.setImage(canvasMenu.currentElement.selected, 1)
            }
            
            canvasGenerator.drawGrid()
            canvasGenerator.currentElement.selected = selected
            const automaton = document.getElementById('map')
            if (automaton.checked){
                let selection
                let grid
                if (Array.isArray(selected)){
                    grid = selected[selected.length - 1].export.canvas.grid
                    for (let i in selected){
                        if (selected[i].export.canvas.grid.y > grid.y)
                            grid = selected[i].export.canvas.grid
                        
                        else if (selected[i].export.canvas.grid.y == grid.y && selected[i].export.canvas.grid.x > grid.x)
                            grid = selected[i].export.canvas.grid
                    }
                    
                } else {
                    grid = selected.export.canvas.grid
                }
                try{
                    selection = canvasGenerator.elements[grid.y][grid.x + 1]
                    selection.drawBorder('red', true, [], 'red')
                }catch {
                    try {
                        selection = canvasGenerator.elements[grid.y + 1][0]
                        selection.drawBorder('red', true, [], 'red')
                    } catch {
                        selection = canvasGenerator.elements[0][0]
                        selection.drawBorder('red', true, [], 'red')
                    }
                }
                canvasGenerator.currentElement.selected = [selection]
    
            }else{
                canvasGenerator.currentElement.selected = []
            }
            session.history.add()
        }

    })
    canvasMenu.addEventListener("mouseout", (event) => {
        if (canvasMenu.currentElement.hover != canvasMenu.currentElement.selected)
            canvasMenu.currentElement.hover.drawImage(true)
    })


    // extended object functions

    canvasGenerator.draw = {
        selections : (clear = false) =>{
            if (clear)
                canvasGenerator.drawGrid(clear)
            let { selected } = canvasGenerator.currentElement
            try{

                if (Array.isArray(selected)){
                    for (let i in selected)
                    selected[i].drawBorder("red", true, [])//.drawBorder( 'red', true, [] )        
                }else{
                    selected.drawBorder("red", true, [])
                }
            }catch{}
        },
        hovers : (clear = false) => {
            if (clear)
                canvasGenerator.drawGrid(clear)
            let { hover } = canvasGenerator.currentElement
            try{
                hover.drawBorder('orange', true, []) //dorobić
            }catch{}
        },
        selectionAreas : (clear = false) => {
            if (clear)
                canvasGenerator.drawGrid(clear)
            let { array } = canvasGenerator.selectionArea
            let { elements } = canvasGenerator
            for (let i in array){
                const client = canvasGenerator.getClient(array[i])
                elements[client.y][client.x].drawBorder("violet", true, [])//.drawBorder( 'red', true, [] )        
            }
        },
        pasteArea : (clear = false, save = false) => {
            if (clear)
                canvasGenerator.drawGrid(clear)
            try{
                const { grid : curPoint } = canvasGenerator.currentElement.hover.export.canvas
                session.paste.point = curPoint
            } catch {}
            const { area } = session.paste
            const { elements } = canvasGenerator
            const { point } = session.paste

            const { history } = session
            if (history.arr[history.arrIndex].length <= 0){
                const { empty } = defaults.field
                for (let i in elements)
                    for (let j in elements)
                        elements[i][j].setImage(empty, 0)
            }

            for (let i in area){
                const { grid } = area[i].canvas
                const { source } = area[i]
                const current = {
                    source : area[i].isNotEmpty ? cloneObj(source) :defaults.field.empty ,
                    x: grid.x + point.x,
                    y: grid.y + point.y, 
                }
                try{
                    elements[current.y][current.x].setImage(current, 1)//false
                    elements[current.y][current.x].drawBorder('yellowgreen', true, [])
                }catch{}
            }
            if (save)
                session.history.add()
        },
        gfxes : (clear = true) => {
            if (clear)
                canvasGenerator.drawGrid(clear)
            const { history } = session
            const { arrIndex } = session.history
            const { elements } = canvasGenerator
            
            for (let i in elements)
                for (let j in elements[i])
                    elements[i][j].setImage(defaults.field.empty, 0)

            for (let i in history.arr[arrIndex]){
                const { grid } = history.arr[arrIndex][i].canvas
                const { source } = history.arr[arrIndex][i]
                const current = {
                    source : {
                        offsetX : source.x * defaults.fieldSize.width,
                        offsetY : source.y * defaults.fieldSize.height,
                    },
                    x: grid.x,
                    y: grid.y,
                }
                elements[current.y][current.x].setImage( current, session.paste.ready ? 0.3 : 1 )
            }
        },
        gfxBorder : (clear = false) => {
            if (clear)
                canvasGenerator.drawGrid(clear)
                const { history } = session
                const { arrIndex } = session.history
                const { elements } = canvasGenerator
                
                for (let i in history.arr[arrIndex]){
                    const { grid } = history.arr[arrIndex][i].canvas
                    const { source } = history.arr[arrIndex][i]
                    const current = {
                        source : {
                            offsetX : source.x * defaults.fieldSize.width,
                            offsetY : source.y * defaults.fieldSize.height,
                        },
                        x: grid.x,
                        y: grid.y,
                    }
                    elements[current.y][current.x].drawBorder( 'darkgray', true, [], 0.2 )
                }
            
        },
        refresh(clear = false){
            if (session.history.arrIndex > 0 && session.history.arr[session.history.arrIndex].length > 0 )
                canvasGenerator.draw.gfxes()
            if (clear)
                canvasGenerator.drawGrid(clear)
            canvasGenerator.draw.gfxBorder()
            canvasGenerator.draw.selections()
            canvasGenerator.draw.hovers()
            canvasGenerator.draw.selectionAreas()
            if (session.paste.ready)
                canvasGenerator.draw.pasteArea()
            // console.log(session.paste.ready)
        }
    }

    canvasGenerator.select = (event, isNotSelectionArea = true) =>{
        if (!session.paste.ready){
            let { selected } = canvasGenerator.currentElement
            const { elements, draw } = canvasGenerator
            // draw.refresh(true)
            
            console.log('to je client',event)
            const client = typeof event.canvas == 'object' ? event : canvasGenerator.getClient(event)
            if (!canvasGenerator.ctrlKey && isNotSelectionArea) //&& !isSelectionArea
                selected = []
    
            const isAlreadyIncluded = selected.find(element => element == elements[client.y][client.x]) != undefined ? true : false
            console.log(canvasGenerator.shiftKey, canvasGenerator.ctrlKey)
            if (isNotSelectionArea && canvasGenerator.ctrlKey && isAlreadyIncluded){
                selected = selected.filter( element => element != elements[client.y][client.x])    
            } else {
                if (selected.find(element => element == elements[client.y][client.x]))
                    return;
            }
    
            if (!isAlreadyIncluded)
                selected.push(typeof event.canvas == 'object'? event : elements[ client.y ][ client.x ])
    
            canvasGenerator.currentElement.selected = selected
        }
    }

    canvasGenerator.addEventListener("mousedown", (event) => {
        console.log("pozdrrr ",event.which)
        if (!session.paste.ready && event.which != 3){
            canvasGenerator.selectionArea = {
                start : {
                    x : event.offsetX,
                    y : event.offsetY,
                },
                end : {
                    x : event.offsetX,
                    y : event.offsetY
                },
                mousedown : true,
                array : []
            }
    
            let { selectionArea } = canvasGenerator
    
            const generatorArea = document.getElementById('generator-area')
                  generatorArea.style.left = selectionArea.start.x +'px'
                  generatorArea.style.top = selectionArea.start.y + 'px'
                  generatorArea.style.width = 0
                  generatorArea.style.height = 0
                  generatorArea.style.opacity = 0.5
                  
                //   generatorArea.style.position = 'absolute'
                //   generatorArea.style.left = 
        }
    })

    canvasGenerator.addEventListener("mousemove", (event) =>{
        const client = canvasGenerator.getClient(event)
        canvasGenerator.drawGrid()
        try {
            if (!Array.isArray(canvasGenerator.currentElement.selected)){
                if (canvasGenerator.currentElement.selected != canvasGenerator.elements[client.y][client.x])
                    canvasGenerator.currentElement.hover.drawBorder('black', true, [])
                canvasGenerator.currentElement.selected.drawBorder('red', true,[])
            }else{
                let { selected } = canvasGenerator.currentElement
                for (let i in selected){
                    if (selected[i] != canvasGenerator.elements[client.y][client.x])
                        canvasGenerator.currentElement.hover.drawBorder('black', true, [])

                    selected[i].drawBorder('red', true, [])
                }
            }
            // canvasGenerator.drawGrid()
        } catch { }
        canvasGenerator.currentElement.hover = canvasGenerator.elements[client.y][client.x]
        canvasGenerator.currentElement.hover.drawBorder('orange', true, [])
        // console.log(client.x, client.y)
        if (canvasGenerator.selectionArea.mousedown && !session.paste.ready){
            canvasGenerator.selectionArea.array = []
            const selectionArea = document.getElementById('generator-area')
            const { style } = selectionArea
            canvasGenerator.selectionArea.end.x = event.offsetX
            canvasGenerator.selectionArea.end.y = event.offsetY
            let { start, end } = canvasGenerator.selectionArea
            
            let difference = {
                width : 0, 
                height : 0,
            }

            if (start.x < end.x && start.y < end.y) {
                // ćw IV
                difference.width = start.x - end.x
                difference.height = start.y - end.y
                style.left = `${start.x}px`
                style.top = `${start.y}px`
                console.log("ćw IV")
            } else if (start.x > end.x && start.y < end.y){
                // ćw III
                difference.width = end.x - start.x
                difference.height = start.y - end.y
                style.left = `${end.x}px`
                style.top = `${start.y}px`
                console.log("ćw III")
                
            } else if (start.x > end.x && start.y > end.y){
                // ćw II
                style.left = `${end.x}px`
                style.top = `${end.y}px`
                difference.width = end.x - start.x
                difference.height = end.y - start.y                
                console.log("ćw II")
            } else if ( start.x < end.x && start.y > end.y){
                // ćw I
                style.left = `${start.x}px`
                style.top = `${end.y}px`

                difference.width = start.x - end.x 
                difference.height = end.y - start.y
                console.log("ćw I")
            }
            style.width = `${-difference.width}px`
            style.height = `${-difference.height}px`
            const eventFrom = {
                offsetX : parseInt(style.left),
                offsetY : parseInt(style.top),
            }
            const eventTo = {
                offsetX : eventFrom.offsetX - difference.width,
                offsetY : eventFrom.offsetY - difference.height,
            }
            const from = canvasGenerator.getClient(eventFrom)
            const to   = canvasGenerator.getClient(eventTo)

            const { fieldSize , scale} = defaults
            const { elements } = canvasGenerator
            for (let i = from.y ; i <= to.y ; i++){
                for (let j = from.x ; j <= to.x ; j++ ){
                    const areaEvent = {
                        offsetX : j * (fieldSize.width * scale + 1),
                        offsetY : i * (fieldSize.height * scale + 1),
                    }
                    canvasGenerator.selectionArea.array.push(areaEvent)        
                }
            }
        }
        
    })

    canvasGenerator.addEventListener("click", (event) =>{
        if( !session.paste.ready ){
            console.log(canvasGenerator.currentElement.selected[0])
            if (canvasGenerator.selectionArea.array.length == 0)
                canvasGenerator.select(event)
            canvasGenerator.selectionArea.array = []
        }else{
            session.paste.action()
            // canvasGenerator.draw.pasteArea(undefined, true)
        }
    })

    canvasGenerator.addEventListener("mouseup", (event) => {
        if (event.which != 3){
            canvasGenerator.selectionArea.mousedown = false
            
            const generatorArea = document.getElementById('generator-area')
            generatorArea.style.opacity = 0
            
            let { array : area } = canvasGenerator.selectionArea
    
            if (!Array.isArray( canvasGenerator.currentElement.selected )){
                let { selected } = canvasGenerator.currentElement
                canvasGenerator.currentElement.selected = [selected]
            }
            if(!canvasGenerator.ctrlKey)
                canvasGenerator.currentElement.selected = []
            let { selected } = canvasGenerator.currentElement
    
            for (let i in area){
                console.log( area[ i ] )
                const { grid } = area[ i ]
    
                canvasGenerator.select( area[i], false )     // ew .exoport
                console.log(area[i])
            }
            console.log('__DŁUGOŚĆ__: ' , selected.length)
            
            canvasGenerator.currentElement.selected = selected
        }

    })

    canvasGenerator.addEventListener("mouseout", (event)=>{
        canvasGenerator.currentElement.hover = null
        console.log('XD', canvasGenerator.currentElement.hover)
    })
    const options = {
        window : document.getElementById('options'),
        list : document.getElementById('options-list'),
        show : false,
        toggle : (show) => {
            options.show = show || !options.show
            
            if (options.show) {
                options.window.style.opacity = 1
                options.window.style.pointerEvents = 'auto'
                options.list.style.transform = `translate(-50%, -50%) scaleY(1)`
            } else {
                options.window.style.opacity = 0
                options.window.style.pointerEvents = 'none'
                options.list.style.transform = `translate(-50%, -50%) scaleY(0)`
            }
        },
        elements : {
            undo   : document.getElementById('options-undo'),
            redo   : document.getElementById('options-redo'),
            cut    : document.getElementById('options-cut'),
            copy   : document.getElementById('options-copy'),
            paste  : document.getElementById('options-paste'),
            delete : document.getElementById('options-delete'),
            save   : document.getElementById('options-save'),
            load   : document.getElementById('options-load'),
        }
    }
    options.elements.undo.addEventListener('click', (e) => {
        session.undo()
    })
    options.elements.redo.addEventListener('click', (e) => {
        session.redo()
    })
    options.elements.cut.addEventListener('click', (e) => {
        session.cut.event()
    })
    options.elements.copy.addEventListener('click', (e) => {
        session.copy.event()
    })
    options.elements.paste.addEventListener('click', (e) => {
        session.paste.event()
    })
    options.elements.delete.addEventListener('click', (e) => {
        session.delete()
    })
    options.elements.save.addEventListener('click', (e) => {
        session.file.save()
    })
    options.elements.load.addEventListener('click', (e) => {
        session.file.load()
    })
    canvasGenerator.addEventListener("contextmenu", (event)=>{
        event.preventDefault()
        options.toggle(true)
        event.stopPropagation()
    })
    

    options.window.addEventListener('click', (event) => {
        event.preventDefault()
        options.toggle(false)
        event.stopPropagation()
    })

    const FPS = {
        counter : 1,
        DOM : document.getElementById('FPS-counter')
    }
    setInterval(()=>{
        FPS.DOM.innerHTML = `${FPS.counter} fps`
        FPS.counter = 0
    }, 1000)
    function render(){
        FPS.counter++
        canvasGenerator.draw.refresh(true)
        requestAnimationFrame(render)
    }
    render()
})