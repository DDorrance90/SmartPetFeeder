import React, { Component } from 'react'
import  {Button} from 'react-bootstrap';
import './fullcalendar.min.css'; 
import 'fullcalendar';
import $ from 'jquery'; 

import 'jquery-ui-dist/jquery-ui';
import '../TouchPunch';
import TimePicker from 'react-time-picker'; 

var savedEvents = []; 


class External extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventTime: "",
            showEvent: false 
        };
    }
    handleChange (newTime) {
        this.setState({showEvent: true, eventTime: newTime}); 
    }
    handleSubmit () {
        var Events = $('#calendar').fullCalendar('clientEvents'); 
        var parsedEvents = []; 
        Events.forEach( function (curEvent, index)  {
           let newEvent = {start: curEvent.start, title: curEvent.title};
           parsedEvents.push(newEvent);  
           
        }); 
        global.socket.emit('UpdateSchedule', parsedEvents); 
    }
    render() {
      return (
          <>
            <div id='external-events'>
              <h4>Create new event</h4>
              <p className="text-muted">Drag event onto calendar, click event on calendar to remove </p>
              <TimePicker onChange={e => this.handleChange(e)} value={this.state.eventTime} disableClock={true} /> 
              {this.state.showEvent ? 
              <div className='fc-event' style={{width: '100px'}}>{this.state.eventTime} </div>
              :
              <div></div>}
              <Button onClick={this.handleSubmit} style={{marginBottom: '15px'}}>Save Changes to Device</Button> 

          </div>
         
          </>
      )
    }
    componentDidMount () {

    }
    componentDidUpdate () {
        var newTime = this.state.eventTime; 
        $('#external-events .fc-event').draggable({
            zIndex: 999,
            revert: true,      // will cause the event to go back to its
            revertDuration: 0  //  original position after the drag
        });

        $('#external-events .fc-event').data('event' , {
            title: "Feed",
            stick: true,
            allDay: false,
            start: newTime
        }); 

    }

}
class Calendar extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            loaded: false
        }; 
    }
    render() {
      return <div id="calendar"></div>;
    }
    componentDidMount() {

      $('#calendar').fullCalendar({
              header: {
                  left: 'prev,next today',
                  center: 'title',
                  right: 'month,agendaWeek,agendaDay'
              },
              editable: true,
              droppable: true, // this allows things to be dropped onto the calendar
              drop: function() {
                  
              },
              eventClick: (event) => {
                  if(window.confirm("Remove this Event?")) 
                    $('#calendar').fullCalendar('removeEvents', event._id); 
              }
      });
        global.socket.emit('FetchSchedule');
        global.socket.on('UpdateCalendar', (scheduledEvents) => {
            if(scheduledEvents.length > 0 && !this.state.loaded) {
                scheduledEvents.forEach( (val, index) => {
                    $('#calendar').fullCalendar('renderEvent', val); 
                });
                this.setState({loaded: true}); 
            }
                
         
        });

    }

}

export class Schedule extends Component {

  render() {
    return (
    <>
    <External /> 
      <Calendar /> 
      
     </> 
    )
  }
}

export default Schedule
