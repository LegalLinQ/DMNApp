import React, { Component } from 'react';
import { saveAs } from 'file-saver';
//Below all are dependent on React
import { DropzoneElement } from './Uploads/DropzoneElement';
import fetchExternalFiles from './Uploads/fetchExternal';
import HTMLlayoutResult from "./Output/resultHtmlLayout";
//import "bootswatch/dist/flatly/bootstrap.min.css"; 
import './App.css';
//External imports, not depedent from React

import BuildHTML from "./SinglePageExpertSystem/BuildHTML"
import { DMN2Moddle, formBuilder,  mergeFormForExportSettings, Moddle2FormdataObject, parseModdle13, processExcelWorkbook } from "dmn-llqhelpers"; //via symlink
import { evaluateDecision, eventCreator, formHandler } from "dmnengine"; //via symlink
import { makeDocx } from "docxgen"; //via symlink

interface MyState { 
  parsedDecisionTable : Object,
  DMNxml : string,
  moddleObj : {
    drgElement:Array<any>
  }
  Binaries : Object,
  display: string,
  explanation: string,
  error: string,
  webFormSettings : Object,
  webForm : {
    Title : string,
    Description : string,
    pure : string,
    OutputLabels : {},
    decisionID : string,
    RelevantFunctions : Array<any>
  }
  outcome: string,
};

const INITIAL_STATE = { 
  parsedDecisionTable : {},
  DMNxml : '',
  moddleObj : {drgElement:[]},
  Binaries : {},
  display: 'initialized',
  explanation: '',
  error: 'No error message, please contact the administrator if things do not work as expected.',
  webFormSettings : {},
  webForm : {pure:"",Title:"",Description:"",OutputLabels:{},decisionID:"", RelevantFunctions:[]},
  outcome: '',
};
/**
 * Daar een titel boven
 * @module Doe-maar-iets
 */
class App extends Component<{},MyState> {
  constructor(props) {
    super(props);
    this.uploadedFiles = this.uploadedFiles.bind(this) 
    this.formProcessor = this.formProcessor.bind(this);
    this.prepareDecisions = this.prepareDecisions.bind(this);
    this.state = INITIAL_STATE;
  }

  componentDidMount()  {this.switchboardInitial()} //check for parameters to override standard Dropzone startpage
  
  //forward function for Dropzone, to fix... once, and other functions
  setErrorMessage(e){  this.setState({error : e}, () => this.setState({display : 'errorMessage'}) ); }

  async uploadedFiles(file, readerResult, index, totalNumberOfUploads){
    //EXCEL is always loaded last (see DropzoneElement for that)
    if( file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      && this.state.DMNxml.length > 1){
      try{ 
        //Excel met WebSettings wordt naar simple object omgezet
        let SimpleTable = processExcelWorkbook(readerResult);
        //clean, only forward Formfield to avoid unexpected merge issues
        Object.keys(SimpleTable).forEach(sheetName => {
          if(sheetName.toLowerCase().substring(0,9) !== "formfield") delete SimpleTable[sheetName]; 
        });
        this.setState({webFormSettings : SimpleTable}, () => this.prepareOnUpload(index, totalNumberOfUploads) );
      }
      catch(e){ this.setErrorMessage(e); return; }
    }
    else if(file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){ 
      let binObj = this.state.Binaries; binObj[file.name] = readerResult; //add new files
      this.setState({Binaries : binObj} );
      this.prepareOnUpload(index, totalNumberOfUploads)
    }
    else{ 
      let dmnXML = new TextDecoder().decode(readerResult);
      this.setState({DMNxml : dmnXML}, () => this.prepareOnUpload(index, totalNumberOfUploads) );
    }
  }

  prepareOnUpload(i,t){if(i+1 == t) this.prepareDecisions() }

  //start of making the form or keuzemenu
  async prepareDecisions() {

    this.setState({ display: 'wait' });
    
    //Moddle object of DMN XML
    try {
      let mObj = await DMN2Moddle(this.state.DMNxml);
      this.setState({ moddleObj: mObj });
    } catch (e) {
      console.error('DMN cannot be parsed by Moddle:', this.state.DMNxml, e);
      this.setErrorMessage('The decision table is invalid, please see error log.');
    }

    //Parsed DMN table from Moddle object
    try {
      //transpile Moddle into dmn-evaljs structure, to be parsed
      let parsedDMN = await parseModdle13(this.state.moddleObj);
      this.setState({ parsedDecisionTable: Object(parsedDMN) });
    }
    catch (e) {
      console.error('Preparing parsed decision table failed, the decision model is possible incorrect, see error:', this.state.moddleObj, e);
      this.setErrorMessage('Parsing decision logic failed, please see error log.');
    }

    //Webform data prepare / merge with Websettings
    try{
      let DMNformData = await Moddle2FormdataObject(this.state.moddleObj);
      let formFields = await formBuilder(DMNformData, this.state.webFormSettings);
      this.setState({webForm: formFields}, () => this.switchboard() );
    }
    catch (e) {
      console.error('Preparing form data failed, see error:', this.state.moddleObj, e);
      this.setErrorMessage('Preparing form data failed, please see error log.');
    }
  }

  async switchboardInitial(){
    let query = new URLSearchParams(window.location.search);
    //set correct display / action on startup
    if( query.get("loc") && String(this.state.DMNxml).length == 0){ 
      this.setState({ display: 'wait' });
      await this.fetchExternal(query);
      this.switchboard();
    }
    else if( query.get("tiny") ){ this.setState({ explanation: 'tiny' }); }
    else if( query.get("settings") ){ this.setState({ explanation: 'settings' }); }
    else{ this.setState({ explanation: 'execute' }); }
  }
  switchboard(){
    this.setState({ explanation: '' });
    let query = new URLSearchParams(window.location.search);
    if( query.get("tiny") ){ this.buildTinyPage(); }
    else if( query.get("settings") ){ this.downloadWebsettingExcel(); } 
    else{ this.displayForm(); }
  }

  //Fetch files from server
  async fetchExternal(query){
    const files = fetchExternalFiles(query);
    (await files).forEach(async (file, index) => {
        this.uploadedFiles(file, file.data, index, (await files).length)
    })
  }
  displayForm(){
      //Form on screen
      this.setState({ display: 'formPure' }); 
      //set hidden fields and create listeners
      eventCreator(this.state.webForm.RelevantFunctions);
  }
  
  buildTinyPage(){
    //Single Portable HTML download when ?tiny=true
    try{
        BuildHTML(
          this.state.webForm.decisionID,
          this.state.webForm.pure,
          this.state.parsedDecisionTable,
          'DMN by Legal LinQ_' + this.state.webForm.Title.replace(/\s+/, '_'), //fileTitle
          this.state.webForm.Title, //htmlTitle 
          this.state.webForm.Description,
          this.state.webForm.OutputLabels,
          Object.keys(this.state.Binaries).length > 0 ? this.state.Binaries : null, //docx templates
          this.state.webForm.RelevantFunctions.length > 0 ? this.state.webForm.RelevantFunctions : null //eventListners 
        );
      }
    catch (e) {
      console.error('Decision table is invalid and failed to parse, see Moddle object and failure message:', this.state.moddleObj, e);
      this.setErrorMessage('The decision table is invalid, please see error log.');
    }
    this.setState({ explanation: 'dowloaded' });     
  }
async downloadWebsettingExcel(){
    let DMNformData = await Moddle2FormdataObject(this.state.moddleObj);
    let mergedSettings = mergeFormForExportSettings(DMNformData, this.state.webFormSettings);

    //download CSV file for import in Excel
    let blob = new Blob([mergedSettings], {type:"text/plain;charset=utf-8"});
    let fileName = 'FormField_'+ this.state.webForm.Title.replace(/\s+/, '_')+'.csv';
    saveAs(blob, fileName);

    this.setState({ explanation: 'dowloaded' }); 
  }

  formProcessor(event){
    event.preventDefault();
    this.setState({explanation : 'docsProcessing'})

    let engineResult;
    try {
      let formResult = formHandler(event.target);

      engineResult = evaluateDecision(this.state.webForm.decisionID, this.state.parsedDecisionTable,formResult);

      if(engineResult.length == 0 ){
        let emptyMessage;
        emptyMessage = [{"default":"... geen resultaat."}]
        this.state.webForm.OutputLabels['default'] = "Helaas ...";
        engineResult = emptyMessage;// throw Error('Geen resultaat');
      } 
          
      //DOCX, but only when binaries (ie Docx templates) are loaded
      if(Array.isArray(engineResult)){ 
        let docxInArray = engineResult.filter( e => typeof e['docx'] !== 'undefined'); //check for any docx, not only first line
        if(docxInArray.length>0) makeDocx(docxInArray, this.state.Binaries); //only forward rule lines with 'docx' 
      }
    } catch (err) { 
      //console.trace(err);  
      console.error(err); 
      this.setErrorMessage('ERROR, see consol log');
    }

    //HTML style and display on screen
    let outputHTML = HTMLlayoutResult(engineResult, this.state.webForm.Title, this.state.webForm.Description, this.state.webForm.OutputLabels);

    //FORM reset + Display HTML, formulier verdwijnt van scherm (pas na reset output op scherm)
    this.setState({webForm : INITIAL_STATE.webForm }, //clear the form, also clears decisionID etc.
    () => {  this.setState({outcome : outputHTML}, () => this.setState({display : 'result'}) );   }  );
  }

  render() {
    const display = this.state.display;
    const explanation = this.state.explanation;
    
    const newUploadButton = <form id="newUploadButton" className="pure-form pure-form-aligned">
                              <button className="pure-button pure-input-1-2" onClick={() => this.state = INITIAL_STATE}>New Upload</button>
                            </form>;
    const UpLoadAndReset = <form id="newUploadButton" className="pure-form pure-form-aligned">
                            <button style={{paddingRight: 2}} className="pure-button pure-input-1-2" onClick={() => this.prepareDecisions()}>Back to form</button>
                            <button className="pure-button pure-input-1-2" onClick={() => this.state = INITIAL_STATE}>New Upload</button>
                          </form>;
    const DownloadedFiles = <h2>Please see downloaded files in your browser or local folder</h2>
    const Footer = <div id="menuFooter"> <a href='http://legallinq.com'title="Homepage van Legal LinQ" className="text-light">Legal LinQ Homepage</a>
                  </div> 


    return (
      <div id="outerWrapper">
        { display == 'initialized' && 
          <div className="innerWrapper dropzone">
            <DropzoneElement 
              uploaded={this.uploadedFiles}
              allowedFileTypes = '.xlsx, .dmn, .docx'
            />
          </div>
        }
        { explanation == 'settings' && 
            <div><h2>Provide DMN file, possibly also an Excel file, to download settings based on DMN model</h2></div>
        }
        { explanation == 'tiny' && 
            <div><h2>Provide files (DMN/Excel/Docx), a single HTML page will be returned that is a standalone decision tool.</h2></div>
        }
        { explanation == 'execute' && 
            <div>
              <h2>
                Provide files (DMN/Excel/Docx) to generate the decision tool.
              </h2>
              <p>Other available options are:</p>
              <ul>
                <i><a href= "?tiny=true">Standalone page</a> (advised!)</i>
                <li><a href= "?settings=true">Settings, for updating an Excel or generating a CSV settingsfile</a></li>
              </ul>
            </div>
        }
        { explanation == 'docsProcessing' && 
            <div><h2>Documents are being processed.</h2></div>
        }
        { explanation == 'dowloaded' && 
            <div>{DownloadedFiles}</div>
        }
        { display == 'wait' && <div className="innerWrapper"> ... one moment please ... </div>
        }
        { display == 'formPure' && 
          <div id="llqForm" className="innerWrapper formElements">
            <legend>{this.state.webForm.Title}</legend>
            <p className="form-description">{this.state.webForm.Description}</p>
            <form id={this.state.webForm.decisionID} className="pure-form pure-form-stacked" onSubmit={this.formProcessor}>
              <div dangerouslySetInnerHTML={{ __html: this.state.webForm.pure }} />
            </form>
            <hr></hr>
            {newUploadButton}
          </div> 
        }
        { display == 'result' && 
          <div className="innerWrapper result">
            <div dangerouslySetInnerHTML={{ __html: this.state.outcome }} /> 
            <br />
            <hr></hr>
            {UpLoadAndReset}
          </div>
        }
        { display == 'errorMessage' && 
          <div className="innerWrapper error">
            <div dangerouslySetInnerHTML={{ __html: this.state.error }} />
            <br />
            <button className="pure-button" onClick={() => window.location.reload()}>Return to start</button>
          </div>
        }
      
        { <div id="Footer">
          <hr></hr>
          <div>
            <p>This Demo is for non-production purposes. Please see Github for more info.</p>
            {Footer}
            {newUploadButton}
          </div>
        </div> }

      </div>
    );
  }
}
export default App 