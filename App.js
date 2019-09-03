import * as React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import DatePicker from 'react-datepicker';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import moment from 'moment';

const onInputChange = (inputId, map, bounds, dataListener) => {
  const marker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29)
  });
  marker.setVisible(false);

  const input = document.getElementById(inputId);
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    console.log('select place', {place}, place.geometry.location.lng(), place.geometry.location.lat());

    bounds.extend(place.geometry.location);

    map.fitBounds(bounds);

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    const { name, utc_offset_minutes } = place;
    dataListener({name, timeOffset: utc_offset_minutes});
  });
};

const isValidTicket = ticket => {
  return ticket.departureCity.name
    && ticket.arrivalCity.name
    && ticket.arrivalTime
    && ticket.departureTime
};

class CardInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flightDate: new Date(),
    }
  }

  componentDidMount() {
    const { inputId, map, mapBounds, changeTicketCity } = this.props;
    onInputChange( inputId, map, mapBounds, changeTicketCity );
    this.props.setTime(this.state.flightDate);
  }

  render() {
    return <div>
        <Card>
          <div>
            <CardContent>
              <Typography component="h2">{this.props.title}</Typography>
              <TextField
                style={{display: 'block', padding: '20px'}}
                id={this.props.inputId}
              />
              <DatePicker
                selected={this.state.flightDate}
                showTimeSelect
                inline
                onChange={ date => {
                  this.setState({flightDate: date});
                  this.props.setTime(date);
                }}
                placeholderText="Select a date between today and 5 days in the future"
              />
            </CardContent>
          </div>
        </Card>
      </div>
  }
}

export default class Ticket extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tickets: [],
      isVisible: false,
    };
    this.addTicket = this.addTicket.bind(this);
    // this.changeTicketData = this.changeTicketData.bind(this);
  }

  componentDidMount() {
    this.map = new google.maps.Map(
      document.getElementById('map'),
      {zoom: 4, center: {lat: -25.344, lng: 131.036}}
    );
    this.mapBounds = new google.maps.LatLngBounds();
    this.addTicket();
    this.setState({
      isVisible: true,
    });
  }

  addTicket() {
    this.setState({tickets: [...this.state.tickets, {
      departureCity: {
        name: '',
        timeOffset: 0,
      },
      departureTime: 0,
      arrivalCity: {
        name: '',
        timeOffset: 0,
      },
      arrivalTime: 0,
    }]});
  }

  changeTicketData(index, key, data) {
    // console.log('changeing ticket data', {index, prefix, data});
    const tickets = [...this.state.tickets];
    tickets[index][key] = data;
    this.setState({
      tickets,
    })
  }

  render() {

    return (
      <Container
        style={{
          display: this.state.isVisible ? 'block': 'none',
        }}
        maxWidth="sm">
        {this.state.tickets.map((ticket, index) => (
          <Box key={`ticket-${index}`} my={4}>
            <CardInner
              title="departure"
              inputId={`departureInput-${index}`}
              currentName={ ticket.departureCity.name }
              map={this.map}
              mapBounds={this.mapBounds}
              changeTicketCity={this.changeTicketData.bind(this, index, 'departureCity')}
              setTime={this.changeTicketData.bind(this, index, 'departureTime')}
            />
            <CardInner
              title="arrival"
              inputId={`arrivalInput-${index}`}
              currentName={ ticket.arrivalCity.name }
              map={this.map}
              mapBounds={this.mapBounds}
              changeTicketCity={this.changeTicketData.bind(this, index, 'arrivalCity')}
              setTime={this.changeTicketData.bind(this, index, 'arrivalTime')}
            />
          </Box>
        ))}
        <div>
          {this.state.tickets.map((ticket, index) => {
            const arrivalTime = moment(ticket.arrivalTime).add(ticket.arrivalCity.timeOffset, 'm');
            const departureTime = moment(ticket.departureTime).add(ticket.departureCity.timeOffset, 'm')
            return !isValidTicket(ticket) ? (<div key={`flight-${index}`}><b>Ticket {index + 1}:</b> Fill out the ticket</div>) : (<div key={`flight-${index}`}><b>Ticket {index + 1}:</b>
              Flight from {ticket.departureCity.name} at {moment(ticket.departureTime).format("MM/DD LT")} to {ticket.arrivalCity.name} at {moment(ticket.arrivalTime).format("MM/DD LT")}
              <br/>Flight length: { arrivalTime.isBefore(departureTime) ? 'incorrect time' : moment.duration(arrivalTime.diff(departureTime)).humanize()}
            </div>)})}
        </div>
        <Button
          variant="contained"
          style={{
            display: this.state.tickets.length < 4 ? 'block' : 'none',
          }}
          onClick={this.addTicket}
        >
          Add ticket
        </Button>

      </Container>
    );
  }
}