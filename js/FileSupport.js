console.log("loaded : FileSupport.js")

class FileSupport {
    constructor(){
        
    }

    save(data, filename = `save_${Date.now()}.json`, stringify = false ){
        const json = stringify ? JSON.stringify(data, null, 5) : data
        const blob = new Blob([json], { type : "application/json" })
        const anchor = document.createElement('a');     //anchor == file

        anchor.download = filename;
        anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
        anchor.dataset.downloadurl = ['application/json', anchor.download, anchor.href].join(':');
        anchor.click();
    
    }

    load( callback = ()=>{} ){
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
            // console.log('pozdrawiam serdecznie')
            const handler = document.createElement('input')
            handler.setAttribute('type','file')
            handler.setAttribute('accept','application/json')
            handler.click()
            handler.addEventListener('change', (e)=>{
                // console.log(input.files)
                const inp = event.target
                const reader = new FileReader()
                reader.addEventListener('load', ()=>{
                    const text = reader.result
                    callback(text)
                    // console.log(JSON.parse(text))
                    // return JSON.parse(text)
                    // console.log(JSON.parse(text))
                })
                reader.readAsText(handler.files[0])
            })
            // const fileReader = new FileReader()
            // fileReader.onload = callback(e)
        } else {
            console.warn('The File APIs are not fully supported in this browser.');
        }
    }
}