console.log("loaded : Field.js")

class Field {
    constructor({source, destination, ctx}, isGrid = true) {  //pozycja w tablicy ofc
        // this.x = source.x
        // this.y = source.y
        let { fieldSize, scale } = defaults 
        this.ctx = ctx
        this.isNotEmpty = false
        this.source = {
            offsetX : source.x * defaults.fieldSize.width,  //+ (source.x + 1),
            offsetY : source.y * defaults.fieldSize.height, //+ (source.y + 1),
        }
        this.destination = {
            offsetX : scale * destination.x * defaults.fieldSize.width  + destination.x * isGrid,
            offsetY : scale * destination.y * defaults.fieldSize.height + destination.y * isGrid,
        }
        this.export = {
            source : {
                x : source.x,
                y : source.y
            },
            canvas : {
                pixels : {
                    x: {
                        from : this.destination.offsetX,
                        to : this.destination.offsetX + fieldSize.width
                    },
                    y: {
                        from : this.destination.offsetY,
                        to : this.destination.offsetY + fieldSize.height
                    },
                },
                grid : {
                    x : Math.floor(this.destination.offsetX / (fieldSize.width * scale + 1)),
                    y : Math.floor(this.destination.offsetY / (fieldSize.height * scale + 1))
                }
            }
        }
        // console.table(source, destination)
        this.drawImage()    

        // this.drawGrid()
        this.ctx.stroke()
    }
    setImage(field, opacity = 0.5, modify = true){
        const { width, height } = defaults.fieldSize
        if (modify)
            this.isNotEmpty = opacity ? true : false //Math.ceil(opacity)
        this.source = field.source
        this.export.source = {
            x : field.source.offsetX / width,
            y : field.source.offsetY / height
        }
        if (typeof field.isNotEmpty == 'boolean'){
            console.log('pozdriiii',field)
        }
        this.drawImage(true, opacity)
    }
    drawImage(clear = false, opacity = 0.5){
        let { fieldSize, scale, img} = defaults 
        // this.isNotEmpty = opacity ? true : false //Math.ceil(opacity)
        if (clear){
            this.ctx.globalAlpha = 1
            this.ctx.clearRect(
                this.destination.offsetX, this.destination.offsetY,
                fieldSize.width * scale, fieldSize.height * scale
            )            
        }
        this.ctx.globalAlpha = opacity
        this.ctx.drawImage(img,this.source.offsetX , this.source.offsetY,
            fieldSize.width, fieldSize.height,
            this.destination.offsetX , this.destination.offsetY,
            fieldSize.width * scale, fieldSize.height * scale
        )
        // this.drawGrid()
    }
    drawBorder( color = "red", clear = false, segments = [2,2],opacity = 0.5){
        let { fieldSize, scale, img} = defaults 

        const points = [
            {x: this.destination.offsetX - 0.5, y: this.destination.offsetY - 0.5},
            {x: this.destination.offsetX + scale * fieldSize.width + 0.5, y: this.destination.offsetY - 0.5},
            {x: this.destination.offsetX + scale * fieldSize.width + 0.5, y: this.destination.offsetY + scale * fieldSize.height +0.5},
            {x: this.destination.offsetX - 0.5, y: this.destination.offsetY + scale * fieldSize.height + 0.5}
        ]

        if (clear){
            this.ctx.globalAlpha = 1
            this.ctx.clearRect(points[0].x + 0.5, points[0].y -0.5, fieldSize.width * scale + 1, 1)
            this.ctx.clearRect(points[0].x, points[0].y + 0.5, 1, fieldSize.height * scale + 1)
            this.ctx.clearRect(points[1].x - 0.5, points[1].y + 0.5, 1, fieldSize.height * scale + 1)
            this.ctx.clearRect(points[3].x + 0.5, points[3].y - 0.5, fieldSize.width * scale + 1, 1)
        }

        this.ctx.globalAlpha = opacity
        this.ctx.strokeStyle = color
        this.ctx.setLineDash(segments)
        this.ctx.beginPath()
        // this.ctx.lineTo(points)
        
        this.ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < 4; i++){
            this.ctx.lineTo(points[i].x,points[i].y )
        }

        // this.ctx.lineTo(this.destination.offsetX + scale * fieldSize.width -0.5, this.destination.offsetY +scale * fieldSize.height - 0.5)
        this.ctx.closePath()
        this.ctx.stroke()
        this.ctx.setLineDash([])
    }
    import( exporter , opacity = 0.5, modify = true){
        const { source } = exporter
        const { width , height } = defaults.fieldSize
        const { empty } = defaults.field
        exporter.source = {
            offsetX : source.x * width,
            offsetY : source.y * height,
        }
        if (exporter.isNotEmpty == false)
            this.setImage(empty, false, modify)
        else
            this.setImage(exporter, opacity, modify)
        console.log('tsetset',exporter.isNotEmpty)
    }
    
    // drawGrid(){
        
    //     this.ctx.beginPath()
    //     this.ctx.strokeStyle = "white"
    //     this.ctx.lineWidth = 1
    //     this.ctx.setLineDash([6,6])
    //     this.ctx.moveTo(this.destination.offsetX-1, this.destination.offsetY -1)
    //     this.ctx.lineTo(this.destination.offsetX + 49, this.destination.offsetY -1 )
    //     this.ctx.lineTo(this.destination.offsetX + 49, this.destination.offsetY + 49)
    //     this.ctx.lineTo(this.destination.offsetX -1, this.destination.offsetY + 49)
        
    //     this.ctx.closePath()
    // }
    mouseover(){

    }
    mouseout(){

    }
    click(){

    }
}