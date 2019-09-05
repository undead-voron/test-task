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


// don't create marker, if it already exists.

const allMarckersCache = () => {
	const markersPlaces = {};
	return ({inputId, map, bounds}, dataListener) => {
		const marker = new google.maps.Marker({
			map,
			anchorPoint: new google.maps.Point(0, -29)
		});
		marker.setVisible(false);

		const input = document.getElementById(inputId);
		const autocomplete = new google.maps.places.Autocomplete(input);
		autocomplete.addListener('place_changed', (...args) => {
			const place = autocomplete.getPlace();
			const { name, utc_offset_minutes, id } = place;

			console.log('select place', {args, autocomplete, place, lng: place.geometry.location.lng(), lat: place.geometry.location.lat()});

			bounds.extend(place.geometry.location);

			map.fitBounds(bounds);

			let doubledMarker = false;
			for (let cachedMarker in markersPlaces) {
				if (markersPlaces[cachedMarker] === place.id && (cachedMarker !== inputId)) {
					doubledMarker = true;
				}
			}

			marker.setPosition(place.geometry.location);

			if (markersPlaces[inputId]) {
				console.log('changing existing marker');
				if (doubledMarker) {
					console.log('marker place is occupied');
					marker.setVisible(false);
				} else {
					console.log('marker place is vacant');
					marker.setVisible(true);
					markersPlaces[inputId] = place.id;
				}
			} else {
				console.log('creating new marker');
				if (!doubledMarker) {
					console.log('marker place is vacant');
					marker.setVisible(true);
					markersPlaces[inputId] = place.id;
				}
			}

			dataListener({ name, timeOffset: utc_offset_minutes, id });
		});
	};
};


// const onInputChange = ({inputId, map, bounds}, dataListener) => {
// 	const marker = new google.maps.Marker({
// 		map,
// 		anchorPoint: new google.maps.Point(0, -29)
// 	});
// 	marker.setVisible(false);
//
// 	const input = document.getElementById(inputId);
// 	const autocomplete = new google.maps.places.Autocomplete(input);
// 	autocomplete.addListener('place_changed', (...args) => {
// 		const place = autocomplete.getPlace();
// 		console.log('select place', {args, autocomplete, place, lng: place.geometry.location.lng(), lat: place.geometry.location.lat()});
//
// 		bounds.extend(place.geometry.location);
//
// 		map.fitBounds(bounds);
//
// 		marker.setPosition(place.geometry.location);
// 		marker.setVisible(true);
//
// 		const { name, utc_offset_minutes, id } = place;
// 		dataListener({ name, timeOffset: utc_offset_minutes, id });
// 	});
// };
const onInputChange = allMarckersCache();

const isValidTicket = ticket => {
  return ticket.departureCity.name
    && ticket.arrivalCity.name
    && ticket.arrivalTime
    && ticket.departureTime
};

const ticketsToRoutes = (routes, ticket) => {
  routes.push({
    city: ticket.departureCity.name,
    date: moment(ticket.departureTime).add(ticket.departureCity.timeOffset, 'm'),
  });
  routes.push({
    city: ticket.arrivalCity.name,
    date: moment(ticket.arrivalTime).add(ticket.departureCity.timeOffset, 'm'),
  });
  return routes;
};

const sortingRoutes = (routeA, routeB) => routeA.date.diff(routeB.date);

const sortTickets = tickets => {
  const validTickets = tickets.filter(ticket => isValidTicket(ticket));
  const routes = validTickets.reduce(ticketsToRoutes, []);

  return routes.sort(sortingRoutes);
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
    onInputChange( {inputId, map, bounds: mapBounds}, changeTicketCity );
    this.props.setTime(this.state.flightDate);
  }

  render() {
    return <div>
        <Card>
          <div>
            <CardContent>
              <Typography component="h2" align="center">{this.props.title}</Typography>
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
      cities: [],
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
    window.mainApp = this;
  }

  addTicket() {
    this.setState({tickets: [...this.state.tickets, {
      departureCity: {
        name: '',
        timeOffset: 0,
        id: '',
      },
      departureTime: 0,
      arrivalCity: {
        name: '',
        timeOffset: 0,
        id: '',
      },
      arrivalTime: 0,
    }]});
  }

  changeTicketData(index, key, data) {
    console.log('before setting ticket data', {index, key, data});
    const tickets = [...this.state.tickets];
    tickets[index][key] = data;
    this.setState({
      tickets,
    });
    const cities = [...this.state.cities];
    // TODO: save ticket index to avoid save cities that were changed!
    if (key.includes('City')) {
      const dateKey = key.includes('departure') ? 'departureTime' : 'arrivalTime';
      const cityIndex = cities.findIndex(city => city.id === data.id);
      console.log('manage city adding');

      if (cityIndex === -1) {
        const city = { id: data.id, name: data.name };
        if (tickets[index][dateKey]) {
          city[key.includes('departure') ? 'departure' : 'arrival'] = tickets[index][dateKey];
        }
        cities.push(city);
      }
      this.setState({
        cities,
      });
    } else {
      console.log('handle time setting');

      // check departure city
      if (
        (key.includes('departure') && tickets[index].departureCity.id)
        || (key.includes('arrival') && tickets[index].arrivalCity.id)
      ) {
        const cityKey = key.includes('departure') ? 'departureCity' : 'arrivalCity';
        const setKey = key.includes('departure') ? 'departure' : 'arrival';
        const cityIndex = cities.findIndex(city => city.id === tickets[index][cityKey].id);
        if (cityIndex === -1) {
          cities.push({
            id: tickets[index][cityKey].id,
            name: tickets[index][cityKey].name,
            [setKey]: data,
          });
        } else {
          cities[cityIndex][setKey] = data;
        }
        this.setState({
          cities,
        });
      }
    }
  }

  render() {

    const orderedDestinations = sortTickets(this.state.tickets);

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
        <br/>
        <div>
          {this.state.tickets.map((ticket, index) => {
            const arrivalTime = moment(ticket.arrivalTime).add(ticket.arrivalCity.timeOffset, 'm');
            const departureTime = moment(ticket.departureTime).add(ticket.departureCity.timeOffset, 'm');
            return !isValidTicket(ticket) ? (<div key={`flight-${index}`}><b>Ticket {index + 1}:</b> Fill out the ticket</div>) : (<div key={`flight-${index}`}><b>Ticket {index + 1}:</b>
              Flight from {ticket.departureCity.name} at {moment(ticket.departureTime).format("MM/DD LT")} to {ticket.arrivalCity.name} at {moment(ticket.arrivalTime).format("MM/DD LT")}
              <br/>Flight length: { arrivalTime.isBefore(departureTime) ? 'incorrect time' : moment.duration(arrivalTime.diff(departureTime)).humanize()}
            </div>)})}
        </div>
        <br/>
        <div>
          Ordered trip: {orderedDestinations.map(route => route.city).join(' --> ')}
        </div>
        <br/>
        <br/>
        <Button
          variant="contained"
          style={{
            display: this.state.tickets.length < 4 ? 'block' : 'none',
          }}
          onClick={this.addTicket}
        >
          Add ticket
        </Button>
        <br/>
        <br/>
      </Container>
    );
  }
}