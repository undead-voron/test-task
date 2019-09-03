import axios from 'axios';
import mapper from '../mapData';

export default ( {body}, res) => {
	axios.get(
		'https://geocode-maps.yandex.ru/1.x/?apikey=5c596203-5356-44b8-b67c-f33c4d8874b0&format=json&kind=locality',
		{ params:{
			apikey: '5c596203-5356-44b8-b67c-f33c4d8874b0',
			format: 'json',
			geocode: body.input,
			kind: 'locality',
			// lang: 'ru_RU'
		}}
	).then(({data}) => {
		res.send(mapper(data));
	})
		.catch(err => {
			console.log('axios error', err);
			res.send([{label: 'nope'}])
		});
}