console.log("loaded : CanvasField.js")

class CanvasField {
    constructor (canvasData, callback = ()=>{}){
        this.properties = canvasData
        this.elements = []
        this.currentElement = {
            hover : null,
            selected : null
        }
        this.fields = canvasData.fields
        this.canvas = document.getElementById(this.properties.name)
        // this.addEventListener = this.canvas.addEventListener
        this.ctx = this.canvas.getContext('2d')
        this.ctx.imageSmoothingEnabled = false
        // this.drawGrid()
        callback()
    }
    addEventListener(event, callback){
        this.canvas.addEventListener(event, callback)
    }
    drawGrid(clear = false, segments = [0]){    //[2,2]
        const {fieldSize : { width, height }, scale} = defaults
        this.ctx.setLineDash(segments)
        
        if (clear){
            for (let i = 1; i < this.fields.y; i++){
                this.ctx.clearRect(0 , i * height * scale + i -0.5, (this.fields.x+1) * width *scale + this.fields.x, 2)
            }
            for (let i = 0; i < this.fields.x; i++ )
                this.ctx.clearRect( i * width * scale + i -0.5, 0, 2, (this.fields.y+1) * height *scale + this.fields.y)
        }

        for (let i = 1; i < this.fields.y; i++){
            this.ctx.beginPath()
            this.ctx.strokeStyle = "black"
            this.ctx.lineWidth = 1
            this.ctx.moveTo( 0 , i * height * scale + i -0.5)
            this.ctx.lineTo( (this.fields.x+1) * width *scale + this.fields.x, scale * i * height + i -0.5 )
            this.ctx.stroke()
        }
        for (let i = 0; i < this.fields.x; i++ ){
            this.ctx.beginPath()
            this.ctx.strokeStyle = "black"
            this.ctx.lineWidth = 1
            this.ctx.moveTo( i * width * scale + i -0.5, 0)
            this.ctx.lineTo( scale * i * width + i -0.5, (this.fields.y+1) * height *scale + this.fields.y )
            this.ctx.stroke()
        }
        this.ctx.setLineDash([])
    }

    import( exporter ){
        const { grid } = exporter.canvas
        
        console.log(exporter)
        const client = {
            x : grid.x,
            y : grid.y,
        }
        this.elements[client.y][client.x].import(exporter)
    }

    getElement( exporter ){
        const { grid } = exporter.canvas
        const client = {
            x : grid.x,
            y : grid.y,
        }
        console.log('xxx' , exporter)
        return this.elements[client.y][client.x]
    }

    getClient(event){
        const { fieldSize, scale } = defaults
        const client = {
            canvas : {
                x: event.offsetX,
                y: event.offsetY
            },
            x : Math.floor(event.offsetX / (fieldSize.width * scale + 1)),
            y : Math.floor(event.offsetY / (fieldSize.height * scale + 1))
        }
        // console.log("Wysokość:",this.elements.length)
        // console.log("Szerokość:",this.elements[0].length)

        let height = this.elements.length,
            width = this.elements[0].length
        client.x = client.x > width - 1 ? width - 1 : client.x
        client.y = client.y > height - 1 ? height - 1 : client.y

        client.x = client.x < 0 ? 0 : client.x
        client.y = client.y < 0 ? 0 : client.y

        return client
    }
}