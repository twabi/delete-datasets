import React, {Fragment, useState} from "react";
import "./App.css";
import MainForm from "./MainForm";
import {getInstance} from "d2";
import {Route, Switch} from "react-router-dom";


//authentication for the namis api
//const basicAuth = "Basic " + btoa("ahmed:Atwabi@20");

function App() {

  const [dataSet, setDataSet] = useState();
  const [dataElements, setDataElements] = useState([]);
    const [orgUnits, setOrgUnits] = React.useState([]);
    const [markets, setMarkets] = React.useState([]);
    const [treeMarkets, setTreeMarkets] = React.useState([]);
  const [D2, setD2] = React.useState();

  //initializing an array-to-tree library that will turn an array of org units into a tree form
  var arrayToTree = require("array-to-tree");

  React.useEffect(() => {

    getInstance().then((d2) => {
      setD2(d2);
      //const endpoint = "programs.json?paging=false";
      const unitEndpoint = "organisationUnits.json?paging=false&fields=name&fields=level&fields=id&fields=parent";
      const marketsEndPoint = "organisationUnitGroups/Lp9RVPodv0V.json?fields=organisationUnits[id,name,level,ancestors[id,name,level,parent]]";
      const dataEndpoint = "dataSets/ezXA3633kEQ.json?fields=id,name,dataSetElements[dataElement[id,name,categoryCombo[categoryOptionCombos]]]";
      d2.Api.getApi().get(dataEndpoint)
          .then((response) => {
              console.log(response);
              response.dataSetElements.map((item) => {
                  item.label = item.dataElement.name;
                  item.value = item.dataElement.id;
              });
              setDataElements(response.dataSetElements);
              setDataSet(response);

          })
          .catch((error) => {
            console.log(error);
            alert("An error occurred: " + error);
          });

        d2.Api.getApi().get(unitEndpoint)
            .then((response) => {
                //console.log(response.organisationUnits)

                response.organisationUnits.map((item, index) => {
                    //

                    //making sure every org unit has a parent node, if not set it to undefined
                    item.title = item.name;
                    item.value = item.name.replace(/ /g, "") + "-" + index;
                    if(item.parent != null){
                        //console.log(item.parent.id)
                        item.parent = item.parent.id
                    } else {
                        item.parent = undefined
                    }
                });

                //do the array-to-tree thing using the parent and id fields in each org unit
                var tree = arrayToTree(response.organisationUnits, {
                    parentProperty: 'parent',
                    customID: 'id'
                });

                console.log(tree);
                setOrgUnits(tree)

            })
            .catch((error) => {
                console.log(error);
                alert("An error occurred: " + error);
            });

        d2.Api.getApi().get(marketsEndPoint)
            .then((response) => {
                //console.log(response.organisationUnits);

                const tempArray = []
                response.organisationUnits.map((item) => {
                    tempArray.push({"id" : item.id, "label" : item.name})
                });
                setMarkets(tempArray);


                //var tempVar = {};
                var anotherArray = [];
                response.organisationUnits.map((item, index) => {
                    item.title = item.name;
                    item.value = item.name.replace(/ /g, "") + "-" + index;
                    item.ancestors.map((ancestor, number) => {

                        if(ancestor.level === 3){
                            item.parent = ancestor.id
                            ancestor.parent = ""
                            ancestor.title = ancestor.name;
                            ancestor.value = ancestor.name.replace(/ /g, "") + "-" + (index+number);
                            anotherArray.push(ancestor);
                        } else if(ancestor.level === 1){
                            ancestor.parent = undefined;
                            ancestor.title = ancestor.name;
                            ancestor.value = ancestor.name.replace(/ /g, "") + "-" + (index+number);
                            //tempVar = ancestor;
                        }
                    });
                    if(item.parent != null){
                        //console.log(item.parent.id)
                        //item.parent = item.parent.id
                    } else {
                        item.parent = undefined
                    }
                });

                anotherArray = anotherArray.slice().filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);

                response.organisationUnits = response.organisationUnits.concat(anotherArray);
                //response.organisationUnits.push(tempVar);

                //do the array-to-tree thing using the parent and id fields in each org unit
                var tree = arrayToTree(response.organisationUnits, {
                    parentProperty: 'parent',
                    customID: 'id'
                });

                setTreeMarkets(tree);
                console.log(tree);

            })
            .catch((error) => {
                console.log(error);
                alert("An error occurred: " + error);
            });

    });

  }, [])


  return (
      <Fragment>
        <Switch>
          <Route path="/"  render={(props) => (
              <MainForm {...props}
                        d2={D2}
                        treeMarkets={treeMarkets}
                        organizationalUnits={orgUnits}
                        marketOrgUnits={markets}
                        dataElements={dataElements}
                        dataSet={dataSet}/>
          )} exact/>
        </Switch>
      </Fragment>
  );
}

export default App;