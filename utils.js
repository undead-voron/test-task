import * as React from 'react';
import moment from 'moment';
import { cloneDeep } from 'lodash';


// don't create marker, if it already exists.

export const allMarckersCache = () => {

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

			bounds.extend(place.geometry.location);

			map.fitBounds(bounds);

			marker.setPosition(place.geometry.location);

			marker.setVisible(true);
			markersPlaces[inputId] = place.id;

			dataListener({ name, timeOffset: utc_offset_minutes, id });
		});
	};
};

export const populateCities = (citiesList, tickets) => citiesList.map( ({ id }) => {
	const departure = tickets.find(ticket => ticket.departureCity.id === id);
	const arrival = tickets.find(ticket => ticket.arrivalCity.id === id);
	const cityObj = { id };

	if (departure) {
		cityObj.departure = moment(departure.departureTime).add(departure.departureCity.timeOffset);
		cityObj.name = departure.departureCity.name;
	}

	if (arrival) {
		cityObj.arrival = moment(arrival.arrivalTime).add(arrival.arrivalCity.timeOffset);
		cityObj.name = arrival.arrivalCity.name;
	}

	return cityObj;
});

export const createRoutes = (citiesArray, itemToPopulate) => {

	const cities = cloneDeep(citiesArray);
	const cityIndex = cities.findIndex(({id}) => id === itemToPopulate.id);

	cities.splice(cityIndex, 1);

	itemToPopulate.routes = cities.filter(city => {
		// check if arrival into the checking city is befor arriving in the city from the list.
		return (!city.arrival || city.arrival.isAfter(itemToPopulate.departure || itemToPopulate.arrival))
			&& (!city.departure || city.departure.isAfter(itemToPopulate.departure || itemToPopulate.arrival))
	}).map(city => createRoutes(cities, city));

	return itemToPopulate;
};

export const routeEl = (city, prefix = '') => (city.routes.length ? city.routes.map(route => routeEl(route, prefix + city.name + ' -> ')) : <div>{prefix + city.name}<br/><br/></div> );

export const isValidTicket = ticket => {
	return ticket.departureCity.name
		&& ticket.arrivalCity.name
		&& ticket.arrivalTime
		&& ticket.departureTime
		&& ticket.arrivalCity.id !== ticket.departureCity.id
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

export const sortTickets = tickets => {
	const validTickets = tickets.filter((ticket, index) => isValidTicket(ticket) && (index === tickets.lastIndexOf(t => t.id === ticket.id)));
	const routes = validTickets.reduce(ticketsToRoutes, []);

	return routes.sort(sortingRoutes);
};