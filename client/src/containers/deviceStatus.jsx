import React, { Component } from 'react'
import {Card} from 'react-bootstrap' 




export class DeviceStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lastFeedTime: "",
      isEmpty: 0.0,
      curUpdateTime: ""
    };
  }
  getFillLevel () {
    let level = this.state.isEmpty; 
    let strPercentage = (1 - (level / 10)) * 100; 

    return strPercentage.toFixed(1).toString() + '%'; 
  }
  UpdateInfo (parent) {
    this.setState({isEmpty: parent.Device.isEmpty, lastFeedTime: parent.Device.lastFeedTime, curUpdateTime: parent.curUpdateTime});
  }

  render() {
    return (
        <Card.Body> 
            <Card.Title>Last Feed Time</Card.Title>
            <Card.Text>{this.props.lastFeedTime}</Card.Text>
            <Card.Text  className="text-muted">Fill Level: {this.getFillLevel()} </Card.Text>
            <Card.Text className="text-muted">Received last update {this.state.curUpdateTime}</Card.Text>
        </Card.Body>
    )
  }
}

export default DeviceStatus
