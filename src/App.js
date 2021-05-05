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
  const [D2, setD2] = React.useState();

  //initializing an array-to-tree library that will turn an array of org units into a tree form
  var arrayToTree = require("array-to-tree");

  React.useEffect(() => {

    getInstance().then((d2) => {
      setD2(d2);
      //const endpoint = "programs.json?paging=false";
      //const unitEndpoint = "organisationUnits.json?paging=false&fields=name&fields=level&fields=id&fields=parent";
      //const marketsEndPoint = "organisationUnitGroups/Lp9RVPodv0V.json?fields=organisationUnits[id,name,level,ancestors[id,name,level,parent]]";
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

    });

  }, [])


  return (
      <Fragment>
        <Switch>
          <Route path="/"  render={(props) => (
              <MainForm {...props}
                        d2={D2}
                        dataElements={dataElements}
                        dataSet={dataSet}/>
          )} exact/>
        </Switch>
      </Fragment>
  );
}

export default App;