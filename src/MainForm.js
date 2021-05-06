import React, {useEffect, useState} from "react";
import "mdbreact/dist/css/mdb.css";
import {
    MDBBox,
    MDBBtn,
    MDBCard,
    MDBCardBody,
    MDBCardText,
    MDBCardTitle,
    MDBCol,
    MDBContainer, MDBModal, MDBModalBody, MDBModalFooter, MDBModalHeader,
    MDBRow,
} from "mdbreact";
import {Button, Card, DatePicker, Dropdown, Menu, Modal, Space, TreeSelect} from "antd";
import Select from "react-select";
import {getInstance} from "d2";
import {DeleteOutlined, DownOutlined} from "@ant-design/icons";
import Header from "@dhis2/d2-ui-header-bar"



var moment = require("moment");


const MainForm = (props) => {

    var orgUnitFilters = ["Filter By", "Markets"];
    const basicAuth = "Basic " + btoa("ahmed:Atwabi@20");

    const [showLoading, setShowLoading] = useState(false);
    const [orgUnits, setOrgUnits] = useState([]);
    const [dataSet, setDataSet] = useState(props.dataSet);
    const [dataElements, setDataElements] = useState(props.dataElements);
    const [searchValue, setSearchValue] = useState();
    const [selectedElement, setSelectedElement] = useState(null);
    const [orgFilter, setOrgFilter] = useState(orgUnitFilters[0]);
    const [choseFilter, setChoseFilter] = useState(false);
    const [treeMarkets, setTreeMarkets] = useState(null);
    const [treeValue, setTreeValue] = useState();
    const [flattenedUnits, setFlattenedUnits] = useState([]);
    const [D2, setD2] = useState();
    const [modal, setModal] = useState(false);
    const [alertModal, setAlertModal] = useState(false);
    const [message, setMessage] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [summary, setSummary] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    getInstance().then(d2 =>{
        setD2(d2);
    });

    function onChange(date, dateString) {
        console.log(date, dateString);
        var momentDate = moment(date);
        var week = momentDate.format("ww");
        var year = momentDate.format("YYYY")
        console.log(year+ "SunW" + (week));
        setSelectedDate(year+ "SunW" + (week))
    }

    const toggle = () => {
        setModal(!modal)
    }

    const toggleAlert = () => {
        setAlertModal(!alertModal);
    }

    useEffect(() => {
        var set = props.dataSet;
        setDataSet(set);
        setDataElements(props.dataElements);
        setOrgUnits(props.organizationalUnits);
        setTreeMarkets(props.treeMarkets);

    },[props.dataElements, props.dataSet, props.organizationalUnits, props.treeMarkets]);

    const handle = (value, label, extra) => {
        setSearchValue(value)
    };

    const onSelect = (value, node) => {
        //setSelectedOrgUnit(node);

        var children = extractChildren(node)
        var tempArray = [];
        if(children === undefined){
            tempArray.push(node);
            setFlattenedUnits(tempArray)
        } else {
            let flat = flatten(extractChildren(node), extractChildren, node.level, node.parent)
                .map(x => delete x.children && x);
            //console.log(flat)
            setFlattenedUnits(flat);
        }
    };

    let extractChildren = x => x.children;
    let flatten = (children, getChildren, level, parent) => Array.prototype.concat.apply(
        children && children.map(x => ({ ...x, level: level || 1, parent: parent || null })),
        children && children.map(x => flatten(getChildren(x) || [], getChildren, (level || 1) + 1, x.id))
    );

    const handleTree = (value, label, extra) => {
        setTreeValue(value)
        //console.log(value);
    };

    const onSelectTree = (value, node) => {
        //setOrgUnit(selectedOrgUnit => [...selectedOrgUnit, node]);
        //setSelectedOrgUnit(node);
        console.log(node);

        var children = extractChildren(node);

        if(children === undefined){
            setFlattenedUnits([node]);
        } else {
            let flat = flatten(extractChildren(node), extractChildren, node.level, node.parent)
                .map(x => delete x.children && x);
            //console.log(flat)
            setFlattenedUnits(flat);
        }
    };

    const handleDataElement = selectedOption => {
        console.log(selectedOption);
        setSelectedElement(selectedOption);
    };

    const deleteEnrolment = (dataValue) => {
        var url = `https://covmw.com/namistest/api/dataValues.json?de=${dataValue.de}&co=${dataValue.co}&ds=${dataValue.ds}&ou=${dataValue.ou}&pe=${dataValue.pe}&value=`

        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization' : basicAuth,
                'Content-type': 'application/json',
            },
            credentials: "include"

        })
            .then(response => response.json())
            .then((result) => {
                console.log(result);
                if(result.httpStatus != null){
                    setSummary(summary => [...summary, {"name": dataValue.ouName + "-" + dataValue.pe, "message" : "Unable to delete: " + result.message}]);
                } else {
                    setSummary(summary => [...summary, {"name": dataValue.ouName + "-" + dataValue.pe, "message" : "Successfully deleted"}]);
                }


            })
            .catch((error) => {
                console.log(error.message);
                if(error.message === "Unexpected end of JSON input"){
                    setSummary(summary => [...summary, {"name": dataValue.ouName + "-" + dataValue.pe, "message" : "Successfully deleted"}]);
                } else {
                    setSummary(summary => [...summary, {"name": dataValue.ouName + "-" + dataValue.pe, "message" : "Unable to delete due to an error: " + error.message}]);
                }
            });
    }

    const functionWithPromise = dataValue => { //a function that returns a promise

        deleteEnrolment(dataValue);
        return message;
    }

    const anAsyncFunction = async item => {
        return functionWithPromise(item)
    }

    const deleteData = async (list) => {
        return await Promise.all(list.map(item => anAsyncFunction(item)))
    }


    const deleting = () => {
        setSummary([]);
        console.log(selectedElement);
        console.log(flattenedUnits);
        console.log(selectedDate);

        var categoryOption = selectedElement.dataElement.categoryCombo.categoryOptionCombos[0].id;
        var elementID = selectedElement.dataElement.id;
        var dataSetID = dataSet.id;
        console.log(categoryOption, elementID, dataSetID);

        setMessage("Deleting");
        setMessageBody("Deleting the dataElement - " + selectedElement.dataElement.name + " for " + flattenedUnits.length + " org units");
        toggleAlert();

        var dataValues = [];
        flattenedUnits.map((unit) => {
            var dataValue = {"ds" : dataSetID, "de" : elementID, "pe": selectedDate, "co" : categoryOption, "ou" : unit.id, "ouName" : unit.name}
            dataValues.push(dataValue);
        });

        deleteData(dataValues)
            .then((r) =>{
                setShowLoading(false);
                console.log(summary);
                setMessage("Operation Complete");
                setMessageBody("A summary of the delete operation for the dataElement: " + selectedElement.dataElement.name);
                //toggleAlert();
            }).catch((err) => {
            console.log("an error occurred: " + err);
            setMessage("An Error Occurred");
            setMessageBody("Unable to delete due to a strange error : " + err);
        });


    }


    const handleOrgFilter = (value) => {
        setOrgFilter(value);
        if(value === "Markets"){
            setChoseFilter(true);
            setFlattenedUnits([]);
            //setSelectedOrgUnit(null)
            setSearchValue(null);
            setTreeValue(null);
        } else {
            setChoseFilter(false);
            setFlattenedUnits([]);
            //setSelectedOrgUnit(null)
            setSearchValue(null);
            setTreeValue(null);
        }
    }


    const orgUnitMenu = (
        <Menu>
            {orgUnitFilters.map((item, index) => (
                <Menu.Item key={index} onClick={()=>{handleOrgFilter(item)}}>
                    {item}
                </Menu.Item>
            ))}
        </Menu>
    );


    return (
        <div>
            {D2 && <Header className="mb-5" d2={D2}/>}
                <MDBBox className="mt-5" display="flex" justifyContent="center" alignItems="center" >
                    <MDBCol className="mb-5 mt-5 h-100 d-flex justify-content-center align-items-center" md="10">
                        <MDBCard className="text-xl-center w-100">
                            <MDBCardBody>
                                <MDBCardTitle>
                                    <strong>Delete Datasets</strong>
                                </MDBCardTitle>

                                <MDBCardText>
                                    <strong>Select Dataset details and Org Unit(s)</strong>
                                </MDBCardText>

                                {dataElements.length == 0 ? <div className="spinner-border mx-2 indigo-text spinner-border-sm" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div> : null}

                                <MDBContainer>
                                    <MDBModal isOpen={modal} toggle={toggle} centered>
                                        <MDBModalHeader toggle={toggle}>Confirmation</MDBModalHeader>
                                        <MDBModalBody>
                                            All the values for the chosen dataElement & orgUnit(and it's children) will be deleted.
                                            Are you sure you want to delete?
                                        </MDBModalBody>
                                        <MDBModalFooter>
                                            <MDBBtn color="secondary" className="mx-1" onClick={toggle}>Cancel</MDBBtn>
                                            <MDBBtn color="primary" className="mx-1" onClick={() => {deleting(); toggle()}}>Delete</MDBBtn>
                                        </MDBModalFooter>
                                    </MDBModal>
                                </MDBContainer>

                                <MDBContainer>
                                    <Modal title={message}
                                           footer={[
                                               <Button type="primary" key="ok" onClick={toggleAlert}>
                                                   Ok
                                               </Button>,
                                           ]}
                                           visible={alertModal} onCancel={toggleAlert} onOk={toggleAlert}>
                                        <div className="d-flex flex-column">
                                            <h6 className="mb-3">
                                                {messageBody}
                                            </h6>

                                            <div>
                                                {summary.map((item, index) => (
                                                    <Card bordered={true} title={item.name} key={index} className="my-2 border border-dark">
                                                        <p>message: {item.message}</p>
                                                    </Card>

                                                ))}

                                                {summary.length == 0 ? <div>
                                                    <p>Found no enrolments to delete</p>
                                                </div> : null}
                                            </div>

                                        </div>
                                    </Modal>
                                </MDBContainer>

                                <hr/>

                                <MDBContainer className="pl-5 mt-3">
                                    <MDBRow>
                                        <MDBCol>
                                            <div className="text-left my-3">
                                                <label className="grey-text ml-2">
                                                    <strong>Select DataElement</strong>
                                                </label>
                                                <Select
                                                    className="mt-2 w-100"
                                                    onChange={handleDataElement}
                                                    options={dataElements}
                                                />
                                            </div>
                                        </MDBCol>
                                        <MDBCol>

                                            <div className="text-left my-3">
                                                <label className="grey-text ml-2">
                                                    <strong>Select Organization Unit</strong>
                                                    <Dropdown overlay={orgUnitMenu} className="ml-3">
                                                        <Button size="small">{orgFilter} <DownOutlined /></Button>
                                                    </Dropdown>
                                                </label>

                                                {choseFilter ?
                                                    <TreeSelect
                                                        style={{ width: '100%' }}
                                                        value={treeValue}
                                                        className="mt-2"
                                                        dropdownStyle={{ maxHeight: 400, overflow: 'auto'}}
                                                        treeData={treeMarkets}
                                                        allowClear
                                                        size="large"
                                                        placeholder="Please select organizational unit"
                                                        onChange={handleTree}
                                                        onSelect={onSelectTree}
                                                        showSearch={true}
                                                    />
                                                    :
                                                    <TreeSelect
                                                        style={{ width: '100%' }}
                                                        value={searchValue}
                                                        className="mt-2"
                                                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                                        treeData={orgUnits}
                                                        allowClear
                                                        size="large"
                                                        placeholder="Please select organizational unit"
                                                        onChange={handle}
                                                        onSelect={onSelect}
                                                        showSearch={true}
                                                    />

                                                }

                                            </div>
                                        </MDBCol>
                                        <MDBCol md={4}>
                                            <div className="text-left my-3 d-flex flex-column">
                                                <label className="grey-text ml-2">
                                                    <strong>Select Week</strong>
                                                </label>
                                                <Space direction="vertical" size={12}>
                                                    <DatePicker className="mt-1"
                                                                style={{ width: "100%" }}
                                                                size="large"
                                                                onChange={onChange}
                                                                picker="week" />
                                                </Space>

                                            </div>

                                        </MDBCol>
                                    </MDBRow>


                                </MDBContainer>

                                <div className="w-100 d-flex justify-content-center py-4 mt-2">
                                    <Button type="primary"
                                            className="d-flex align-items-center justify-content-center"
                                            shape="round"
                                            icon={<DeleteOutlined />}
                                            size="large"
                                            loading={showLoading}
                                            onClick={() => {
                                                setSummary([])
                                                toggle();
                                            }}
                                            danger>
                                        Delete
                                    </Button>
                                </div>

                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBBox>
        </div>
    )
}

export default MainForm;