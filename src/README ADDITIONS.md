/**
 * TOEVOEGINGEN decision-table-xml.js
+ if (drgElement.decisionLogic) {
- if (drgElement.decisionTable) {

+const decision = { decisionTable: parseDecisionTable(drgElement.id, drgElement.decisionLogic), requiredDecisions: [] };
-const decision = { decisionTable: parseDecisionTable(drgElement.id, drgElement.decisionTable), requiredDecisions: [] };

+//DMN by Legal LinQ Hack to incorporate DMN1.3
//add function to exports below
function parseModdle13(moddleObject, opts) {
  return new Promise((resolve, reject) => {
    try {
      //Decisions - in drgElement
      for(let i = 0; i < moddleObject.drgElement.length; ++i) { 
        //we are in decisions
        //make alternations to decisionID, this should be the drgElement[?].name (not id), to correspond with the (callable as per DMN spec) decision variable name
        moddleObject.drgElement[i].id = moddleObject.drgElement[i].name;
        moddleObject.drgElement[i]['decisionTable'] = moddleObject.drgElement.decisionLogic; //system uses the old 'decisionTable'
      }
      //original module requires a decisionTable where it is now decisionLogic, fixed in 'parseDecisions for the moment
      const decisions = parseDecisions(moddleObject.drgElement);
      resolve(decisions);
    } catch (err) {
      reject(err);
    }
  });
}

+ module.exports = { readDmnXml, parseDmnXml, parseModdle13, parseDecisions, evaluateDecision, dumpTree };
- module.exports = { readDmnXml, parseDmnXml, parseDecisions, evaluateDecision, dumpTree };

 */