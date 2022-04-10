/**
 * Get Files from server
 * @param query 
 * @returns 
 */
export default async function fetchExternalDMN(query){

    let filenames = query.get("loc").split(',')
    console.log("File names taken from url", filenames);
    
    function fetchAll() {
      return Promise.all(
        filenames.map(url => fetch(window.location.origin+'/DMNdownloads/'+url)
          .then(r => r.arrayBuffer() )
          .then(data => ({ data, url }))
          .catch(error => ({ error, url }))
        )
      )
    }
    //data as an Array of Objects, the objects being "data" (arrayBuffer), and "url"
    let files = await fetchAll()
    console.log("Fetched data:",files)

    //make sure excel is processed last
    files.forEach((file, index) => {
      //make sure excel is loaded as last file, after that processing starts
      if(files.length > 1 && index < files.length-1 &&
        file.url.indexOf('.xlsx') != -1
        ){  files.push(files.splice(index, 1)[0]);  }
    });

    //turn parameters in array (by comma seperated) and execute for each
    files.forEach( ( f, i) => {
        f.name = f.url;
    
        //File Type, for DMN no specific type
        f.type = '';
        if( f.url.indexOf('.xlsx') != -1 ){ f.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        else if( f.url.indexOf('.docx') != -1 ){ f["type"] ='application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    });
    
    return files
}