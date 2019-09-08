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
import {
	allMarckersCache,
	populateCities,
	createRoutes,
	routeEl,
	isValidTicket,
	sortTickets,
} from './utils';

const onInputChange = allMarckersCache();

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

		// TODO: remove city if it was changed

		const tickets = [...this.state.tickets];
		const cacheCityIds = {
			departure: this.state.tickets[index].departureCity.id,
			arrival: this.state.tickets[index].arrivalCity.id,
		};
		tickets[index][key] = data;
		this.setState({
			tickets,
		});
		console.log('changeTicketData ', {index, key, data}, cacheCityIds);
		const cities = [...this.state.cities];
		// TODO: save ticket index to avoid save cities that were changed!
		if (key.includes('City')) {
			const cityIndex = cities.findIndex(city => city.id === data.id);
			console.log('manage city adding');

			const city = cityIndex === -1 ? { id: data.id, /*name: data.name, timeOffset: data.timeOffset*/ } : cities[cityIndex];

			if (cityIndex === -1) {
				cities.push(city);
			}

			// check if city was fully removed from all the tickets and delete it from list off cities for routes
			const cachedCityId = cacheCityIds[key.includes('departure') ? 'departure' : 'arrival'];
			const isCityUsed = this.state.tickets.find(ticket => ticket.departureCity.id === cachedCityId || ticket.arrivalCity.id === cachedCityId);

			if (cachedCityId && !isCityUsed) {
				const indexToRemove = cities.findIndex(city => city.id === cachedCityId);
				console.log('removing city with index', indexToRemove, ' el ', cities[indexToRemove]);
				cities.splice(indexToRemove, 1);
			}

			// TODO validate arrival/departure time;
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
				const cityIndex = cities.findIndex(city => city.id === tickets[index][cityKey].id);
				if (cityIndex === -1) {
					cities.push({
						id: tickets[index][cityKey].id,
					});
				}
				this.setState({
					cities,
				});
			}
		}
	}

	render() {

		const orderedDestinations = sortTickets(this.state.tickets);
		const cities = populateCities([...this.state.cities], [...this.state.tickets]);
		const sortedCities = cities.map(city => createRoutes(cities, city));
		const possibleRoutes = sortedCities.map(city => city.routes.length ? routeEl(city) : '');

		return (
			<Container
				style={{
					display: this.state.isVisible ? 'block': 'none',
				}}
				maxWidth="sm">
				{this.state.tickets.map((ticket, index) => (
					<Box key={`ticket-${index}`} my={4}>
						<Card>
							<div>
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
							</div>
						</Card>
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
				<div>Routes: {possibleRoutes}</div>
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