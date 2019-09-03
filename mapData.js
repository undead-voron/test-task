import { get } from 'lodash';

const dataPath = 'response.GeoObjectCollection.featureMember';
const elPath = 'GeoObject.name';

export default (data) => get(data, dataPath, []).map(el => ({label: get(el, elPath, '')}));