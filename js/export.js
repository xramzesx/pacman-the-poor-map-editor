console.log("loaded : export.js")

let exportCanvas
let file = new FileSupport()

const elements = []
const defaults = {
    fieldSize : {
        height: 12,
        width: 12
    },
    scale : 2,
    field : {
        empty : {
            source : {
                offsetX : 0,
                offsetY : 2 * 12 * 2,
            }
        }
    },
    img : new Image(),
    
    
}

window.addEventListener("DOMContentLoaded", ()=>{
    const exporter = {
        fields : {
            x: 40,
            y: 40,
        },
        name : "exporter"
    }
    exportCanvas = new CanvasField(exporter )
    defaults.img.src = "gfx/spritemap-384.png"
    defaults.img.onload = () => {
        for (let i = 0; i < exporter.fields.y ; i++ ){
            const rowsField = []
            for (let j = 0; j < exporter.fields.y ; j++ ){
                const position = {
                    source : {
                        x: 0,
                        y: 2
                    },
                    destination : {
                        x : j ,
                        y : i ,
                    },
                    ctx : exportCanvas.ctx
                }
                rowsField.push(new Field(position, false))
            }
            exportCanvas.elements.push(rowsField)
        }
        // exportCanvas.drawGrid()
    }
})

window.addEventListener('keydown', (e)=>{
    if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() == "L" ){
        e.preventDefault()
        file.load((res)=>{
            const data = JSON.parse(res)
            console.log(data)
            for (let i in exportCanvas.elements){
                for (let j in exportCanvas.elements[i]){
                    exportCanvas.elements[i][j].import({
                        source : { x: 0, y: 2 },
                        canvas : { grid: { x: j, y: i } }
                    },1)
                }
            }
            // exportCanvas.import(data)

            for (let i in data){
                const { x,y } = data[i].canvas.grid
                exportCanvas.elements[y][x].import(data[i],1)
            }
        })

        console.log(e.key)
    }
})