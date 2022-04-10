export default function HTMLlayoutResult(engineResult, title, description, OutputLabels){
    title = '<legend>'+title+'</legend>';
    description = '<p class="form-description">' +description+ '</p>';
    let htmlString = styleOutcome(engineResult, OutputLabels);
    return title + description + htmlString;
}

/**
 * HTML STYLING THE PAGE
 * NESTED STYLING
 */

function buildNestedTable(outputList){
    let html = '<table  class="innerTable">';
    //1 column and hence not array

    if (!Array.isArray(outputList)){ html += fetchNestedRows(outputList); }
    
    else if(Array.isArray(outputList)) { 
        outputList.forEach(row => {
            html += fetchNestedRows(row);
        });
    }

    html += '</table>'
    return html;
}

function fetchNestedRows(rowResult){
    //console.log("NESTED", rowResult, "\n", typeof rowResult)
    //publish, set to true when there is at least 1 entry in this row
    let publish = false;

    let htmlFragment = '<tr>';
    if(typeof rowResult == 'string' && rowResult.trim().length > 0){
        htmlFragment += '<td>' +rowResult+ '</td>';
    }
    else{htmlFragment += '<td> </td>'; }
    publish = true;

    htmlFragment += '</tr>';
    //when good to publish 
    if(publish){ return htmlFragment}
    else { return ''; }
}

/**
 * BASE STYLING
 */
 //titles of rows not to include in on-screen result
const Specials = ['docx','docxTag','docxStyle','docxRef'];

function fetchTitles(oneResultLine, OutputLabels){
    let htmlFragment = '<thead><tr>';
    //put titles in title field of table
    Object.keys(oneResultLine).forEach((key) => {
        //filter out docx and other special answer rows
        if(Specials.indexOf(key) == -1 && !key.startsWith('hidden')) {
            htmlFragment += '<th>' +OutputLabels[key]+ '</th>';
        }
    });
    htmlFragment += '</tr></thead>';
    return htmlFragment;
}

function fetchBaseRows(singleResultforOneRow){
    //publish, set to true when there is at least 1 entry in this row
    let publish = false;

    let htmlFragment = '<tr>';

    Object.keys(singleResultforOneRow).forEach(t1 => {
        //filter out docx and other special answer rows
        if(Specials.indexOf(t1) == -1 && !t1.startsWith('hidden')) {
            //make undefined cell empty
            if(singleResultforOneRow[t1] != undefined){
                if(Array.isArray( singleResultforOneRow[t1] ) && singleResultforOneRow[t1].length > 0 ){
                    htmlFragment += '<td>' +buildNestedTable(singleResultforOneRow[t1])+ '</td>';
                }
                else { htmlFragment += '<td>' +singleResultforOneRow[t1]+ '</td>'; }
                publish = true;
            } else{htmlFragment += '<td> </td>';}
        }
    });
    htmlFragment += '</tr>';
    //when good to publish 
    if(publish){ return htmlFragment}
    else { return ''; }
}

function buildBaseTable(rawOut, titles = ''){
    let html = '<table>';
    if(titles.length > 0) html += titles;
    
    //1 column and hence not array
    if (!Array.isArray(rawOut)){ html += fetchBaseRows(rawOut); }
    //more columns and hence array
    else{ 
        var i = 0;   
        for (; i < rawOut.length; i += 1) { //meerdere antwoorden mogelijk, daarom een loop
            html += fetchBaseRows(rawOut[i]);  
        }
    }

    html += '</table>'
    return html;
}

function styleOutcome(rawOut, OutputLabels){
    //bij een fout, geen uitkomst
    if(rawOut.length == 0){ return '<div id="LLQresultDiv"><h2>Excuus:</h2><span style="color:red;"><em>Er is een technishe fout opgetreden, excuus er is geen antwoord...</em></span></div>';}

    let html = '<div id="LLQresultDiv">';
    let titles = '';
    //titles of table
    if (!Array.isArray(rawOut)){ titles = fetchTitles(rawOut,OutputLabels); }
    else{ titles = fetchTitles(rawOut[0],OutputLabels); } //use the first answer, assuming every answer has all 'titles', either filled or undefined
    
    //rows of table
    html += buildBaseTable(rawOut, titles)
    
    //closure and return of table
    html += '</div>';
    return html;
}