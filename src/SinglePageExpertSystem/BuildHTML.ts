import { saveAs } from 'file-saver';

//@ts-ignore
import dmnEngineJS from 'dmnengine/lib/llqEngine.txt'; 
//@ts-ignore
import docxGenCode from 'docxgen/lib/DocxGenerator.txt';
//@ts-ignore
import pureCSS from './BuildHTMLpureCSS.txt';

export default async function BuildHTML(decisionID, formHTML, parsedDecisions, fileTitle, htmlTitle, question, OutputLabels, preLoadedFiles, eventListners) {
  let parsedDecisionsJSON = parsedDecisionsToJSON(parsedDecisions)
  let preLoadedFilesJSON =  preLoadedFiles?outputTemplatesToJSON(preLoadedFiles):'undefined';
  let OutputLabelJSobject = JSON.stringify(OutputLabels)
  let docxGen = preLoadedFiles?docxGenCode:''; //in case docxFiles are send through, we include docxGenerator, otherwise we don't
  let eventListnersJSON = eventListners?eventListnersToJSON(eventListners):'undefined';
  const htmlAsText = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width">
      <style type="text/css">${pureCSS}</style>
      <script type="text/javascript"> 
        if(navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf ('Trident/') > -1){
          alert("Sorry, this service does not work on older browsers. You are using Explorer 11 or before, please use MS Edge, Google Chrome, or Firefox");
        }
      </script>
      <script id="resultStorage" type="application/json"></script>
      <script id="outputLabels" type="application/json">${OutputLabelJSobject}</script>
      <script id="resultDisplay" type="text/javascript">

        const resultNode = document.getElementById('resultStorage');
        function OutputHandler(){
          //basic HTML styling, can be replaced
          const outputLabels = JSON.parse(document.getElementById('outputLabels').innerHTML);
          function buildNestedTable(a){let b="<table>";return Array.isArray(a)?Array.isArray(a)&&a.forEach(a=>{b+=fetchNestedRows(a)}):b+=fetchNestedRows(a),b+="</table>",b}
          function fetchNestedRows(a){let b=!1,c="<tr>";return"string"==typeof a&&0<a.length?(c+="<td>"+a+"</td>"):c+="<td> </td>",b=!0,c+="</tr>",b?c:""}const Specials=["docx","docxTag","docxStyle","docxRef"];
          function fetchTitles(a){let b="<thead><tr>";return Object.keys(a).forEach(a=>{-1!=Specials.indexOf(a)||a.startsWith("hidden")||(b+="<th>"+outputLabels[a]+"</th>")}),b+="</tr></thead>",b}
          function fetchBaseRows(a){let b=!1,c="<tr>";return Object.keys(a).forEach(d=>{-1!=Specials.indexOf(d)||d.startsWith("hidden")||(0==a[d].length?c+="<td> </td>":(c+=Array.isArray(a[d])&&0<a[d].length?"<td>"+buildNestedTable(a[d])+"</td>":"<td>"+a[d]+"</td>",b=!0))}),c+="</tr>",b?c:""}
          function buildBaseTable(a,b=""){let c="<table>";if(0<b.length&&(c+=b),!Array.isArray(a))c+=fetchBaseRows(a);else for(var d=0;d<a.length;d+=1)c+=fetchBaseRows(a[d]);return c+="</table>",c}
          function styleOutcome(a){if(0==a.length)return"<h2>Excuus:</h2><span style='color:red;'><em>Er is een technishe fout opgetreden, excuus er is geen antwoord...</em></span>";let b='<div>',c="";return c=Array.isArray(a)?fetchTitles(a[0]):fetchTitles(a),b+=buildBaseTable(a,c),b+="</div>",b}

          document.getElementById("LLQresultDiv").innerHTML += styleOutcome( JSON.parse(resultNode.innerHTML) );
          document.getElementById("LLQresultDiv").innerHTML += '<br><hr><button onClick="window.location.reload();">Back</button>';

          document.getElementById("LLQformDiv").style.display = "none";
          document.getElementById("LLQresultDiv").style.display = "block";  

        }

        //Observer, trickers when output is ready
        const mCall = function(mutationsList, observer) { for(const mutation of mutationsList) { if (mutation.type === 'childList' && JSON.parse(resultNode.innerHTML) ) { OutputHandler() }  }  };
        new MutationObserver(mCall).observe(resultNode, {childList: true});
      </script>

    </head>
    <body>
      <main>
        <noscript><H1>SORRY, UW BROWSER ACCEPTEERT GEEN JAVASCRIPT, helaas zal het formulier hieronder niet werken.</H1><h2>Mogelijk heeft u dit document in een andere webpagina geopend, bijvoorbeeld in Sharepoint of OneDrive. In dat geval kunt u het html bestand downloaden naar uw computer en daar openen.</h2></noscript>

        <legend>${htmlTitle}</legend>
        <p class="form-description">${question}</p>

        <div id="LLQformDiv" style="padding-bottom: 25px;">
          <form id="${decisionID}" className="pure-form" >
            ${formHTML}
          </form>
        </div>

        <div id="LLQresultDiv" class="innerWrapper result" style="padding-bottom: 25px; display:none;" ></div>

      </main>
      <script id="alterForm" type="text/javascript">
        formElement = document.getElementById("${decisionID}");
        //formElement.removeAttribute("style");
        //formElement.style.backgroundColor = "yellow";
        formElement.setAttribute("class", "pure-form pure-form-stacked");

      </script>
      <script id="decisionIdData" type="application/json">${decisionID}</script>
      <script id="decisionData" type="application/json">${parsedDecisionsJSON}</script>
      <script id="outputTemplates" type="application/json">${preLoadedFilesJSON}</script>
      <script id="docxGen" type="text/javascript">${docxGen?docxGen:''}</script>
      <script id="eventListners" type="application/json">${eventListnersJSON}</script>
      <script id="llqEngine" type="text/javascript">${dmnEngineJS}</script>

    </body>
  </html>
  `;

  /**
   * Save the file
   */ //@ts-ignore
  var blob = new Blob([htmlAsText], {type: "text/plain;charset=utf-8"});
  saveAs(blob, fileTitle+'.html');
}


/**
 * Decision object, convert to JSON, 
 * stringify functions into object with property 'build'
 * remove 'loc' properties, as not necessary
 * @param obj 
 */
function parsedDecisionsToJSON(parsedDecisions){
  
  let parsedDecisionsJSON = {};
  Object.keys(parsedDecisions).forEach(key => {
    parsedDecisionsJSON[key] = JSON.stringify(parsedDecisions[key],
      function replacer(key, value) {
      /*
        if(key !== 'loc' && value !== null && typeof value.build == 'function'){
          //console.log(`${key}:`, value); //console.log(value.build.toString())
          value['build'] = value.build.toString().replace(/\n/g,' ').trim();
          return value;
        }
      */
        return (key == 'loc') ? undefined : value; //remove 'loc' entries, they have no use
      }
    );
  });
  //console.log("Original", parsedDecisionsJSON, parsedDecisions);
  parsedDecisionsJSON = JSON.stringify(parsedDecisionsJSON); //dubbel stringify, nodig om onduidelijke redenen
  //console.log("Parsed Decisions as JSON", JSON.stringify(parsedDecisionsJSON), this.state.parsedDecisionTable)
  //console.log("RoundTrip JSON, original vs revived", parsedDecisions,  pDJ2JS(parsedDecisionsJSON)); 
  return parsedDecisionsJSON;
  
}

/**
 * CONVERT DOCX TO JSON
 * @param obj see uploads in Dropzone
 */
function outputTemplatesToJSON(obj){
  let preLoadsObjOfStrings = {};
  Object.keys(obj).forEach((docName) => {
   preLoadsObjOfStrings[docName] = String.fromCharCode(...new Uint8Array(obj[docName]));
  });
  let preLoadsAsString = JSON.stringify( preLoadsObjOfStrings);
  return preLoadsAsString
}

/**
 * CONVERT EVENTLISTNERS TO JSON
 * @param eventListeners 
 */
function eventListnersToJSON(eventListeners){
    return JSON.stringify(eventListeners);
}