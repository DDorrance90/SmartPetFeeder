import React, { Component } from 'react';
import { Card, Nav, Container, Row, Col, Button, Alert, Image} from 'react-bootstrap';
import DeviceStatus from './deviceStatus';
import Schedule from './Schedule';
import openSocket from 'socket.io-client';
import moment from 'moment-timezone'; 
var url = window.location.protocol + '//' + window.location.hostname; // For production, remove the :5000
global.socket = openSocket(url);

function UpdateDeviceInfo(cb) {
  global.socket.on('update', (msg) => {
    cb(msg, false);
  });
  global.socket.on('StatResponse', (res) => {
      cb(res, true); 
  }); 

}
export default class SmartPetFeeder extends Component {
  constructor(props) {
    
    super(props);
    this.infoRef = React.createRef(); 
    this.state = {
      int: null,
      displayAlert: false,
      displaySuccess: false,
      currentCard: <DeviceStatus ref={this.infoRef} />,
      deviceInfoCard: <DeviceStatus ref={this.infoRef} />,
      scheduleCard: <Schedule />,
      curUpdateTime: "",
      alertMessage: "", 
      Device: {
        shadowName: "",
        host: "",
        isEmpty: 10.0,
        lastFeedTime: ""
      }
    };
    UpdateDeviceInfo((msg, isStat) => {
      if(!isStat) {
        let ReadableString = moment(msg.lastFeedTime).format('ddd, M/D @ h:mm a').toString(); 
        let strUpdateTime = moment(msg.lastUpdate).fromNow(); 

        this.setState({ Device: { isEmpty: msg.isEmpty, lastFeedTime: ReadableString }, curUpdateTime: strUpdateTime });
        if(this.infoRef.current) this.infoRef.current.UpdateInfo(this.state); 
        
      } else {
        if (msg.status === 'rejected') {
          this.setState({ displayAlert: true, alertMessage: msg.message});
        }
        else if (msg.status === 'accepted') {
          this.setState({ displaySuccess: true, alertMessage: msg.message });
        }
      }
    });
  }

    fetchData() {
      global.socket.emit('ConnectIotDevice', 'DerekPC');
    }
    componentWillMount() {
      this.fetchData();
      var interval = setInterval(this.fetchData, 1000);
      this.setState({ int: interval });
    }

    componentWillUnmount() {
      if (this.state.int) {
        clearInterval(this.int);
        this.setState({ int: null });
      }
      global.socket.emit('DisconnectIotDevice', 'DerekPC'); 
    }
    handleFeedNow() {
      global.socket.emit('Feed');
    }
    switchCard(card) {
      if (card === "Info")
        this.setState({ currentCard: this.state.deviceInfoCard });
      else if (card === "Schedule")
        this.setState({ currentCard: this.state.scheduleCard });
      else
        this.setState({ currentCard: this.state.deviceInfoCard });
    }
    handleClose () {
        this.setState({displayAlert: false, displaySuccess: false});
    } 

    render() {
      
      return (
        <>
          <Container>
            {this.state.displayAlert ?
              <Alert dismissible variant="danger" onClose={e => this.handleClose()}>
                <Alert.Heading>{this.state.alertMessage}</Alert.Heading>
                <p> The device did not accept our request. You may try again.</p>
              </Alert>
              : <div> </div>
            }
            {this.state.displaySuccess ?
              <Alert dismissible variant="success" onClose={e => this.handleClose()} >
                <Alert.Heading>{this.state.alertMessage}</Alert.Heading>
                <p>Device accepted the update.</p>
              </Alert>
              : <div></div>
            }
          </Container>
          <Container >

            <Row >
              <Col xs={2} md={2}>
                
                <div id='imageContainer'>  
                  <Image src={this.props.imageUrl} style={{ boxShadow: '7px 10px 36px -8px rgba(0,0,0,0.75)', width: '50px' }} roundedCircle />
                </div>      
                <p className="text-muted">Welcome {this.props.loginName}! </p>      
              </Col>
              <Col xs={8} md={8}>
                <Nav className="NavBar" defaultActiveKey="Info" variant="tabs" onSelect={e => this.switchCard(e)}>
                  <Card style={{ width: '100%' }} className="CardContainer">
                    <Card.Header>

                      <Nav.Item>
                        <Nav.Link eventKey="Info">Info</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="Schedule">Schedule</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link> Reserved</Nav.Link>
                      </Nav.Item>

                    </Card.Header>
                    {this.state.currentCard}
                    <Button onClick={this.handleFeedNow}>Feed Now</Button>
                  </Card>
                </Nav>
              </Col>
              <Col xs={6} md={4} >

              </Col>
            </Row>
          </Container>
        </>
      )
    }
  }
